import { WallsDimensions } from "@/store";
import { WardrobeInstance } from "@/types";
import {
  saveDesignToFirebase,
  getDesignFromFirebase,
  getLatestDesign,
} from "@/services/designService";

export type ShoppingCartItem = {
  itemNumber: string;
  name: string;
  thumbnail: string;
  quantity: number;
  price: number; // unit price
  totalPrice: number; // quantity * price
};

export type SavedDesignState = {
  version: string;
  date: string; // ISO string format
  designId: string; // Human-friendly design code (e.g., W3K8ZQ12)
  designData: {
    wardrobeInstances: WardrobeInstance[];
    wallsDimensions: WallsDimensions;
    customizeMode: boolean;
  };
  shoppingCart: ShoppingCartItem[];
  totalPrice: number;
  firebaseId?: string; // Track Firebase document ID for internal use
};

const STORAGE_KEY = "wardrobe-design-state";
const CURRENT_VERSION = "1.0.0";

/**
 * Generate shopping cart from wardrobe instances
 */
export const generateShoppingCart = (
  wardrobeInstances: WardrobeInstance[]
): { shoppingCart: ShoppingCartItem[]; totalPrice: number } => {
  const groupedItems: Record<string, ShoppingCartItem> = {};

  wardrobeInstances.forEach((instance) => {
    const itemNumber = instance.product.itemNumber;

    if (groupedItems[itemNumber]) {
      groupedItems[itemNumber].quantity += 1;
      groupedItems[itemNumber].totalPrice += instance.product.price;
    } else {
      groupedItems[itemNumber] = {
        itemNumber: instance.product.itemNumber,
        name: instance.product.name,
        thumbnail: instance.product.thumbnail,
        quantity: 1,
        price: instance.product.price,
        totalPrice: instance.product.price,
      };
    }
  });

  const shoppingCart = Object.values(groupedItems);
  const totalPrice = shoppingCart.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );

  return { shoppingCart, totalPrice };
};

/**
 * Save the current design state to local storage
 */
export const saveDesignState = (
  state: Omit<SavedDesignState, "version" | "date">
): boolean => {
  try {
    const designState: SavedDesignState = {
      version: CURRENT_VERSION,
      date: new Date().toISOString(),
      ...state,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(designState));

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Save the current design state to both local storage and Firebase
 */
export const saveDesignStateWithSync = async (
  state: Omit<SavedDesignState, "version" | "date">
): Promise<{ success: boolean; firebaseId?: string; error?: string }> => {
  try {
    // First save to local storage
    const localSaveSuccess = saveDesignState(state);
    if (!localSaveSuccess) {
      return { success: false, error: "Failed to save to local storage" };
    }

    // Then save to Firebase
    const firebaseResult = await saveDesignToFirebase(
      {
        version: CURRENT_VERSION,
        date: new Date().toISOString(),
        ...state,
      },
      state.firebaseId // Use existing ID if updating
    );

    if (firebaseResult.success && firebaseResult.id) {
      // Update local storage with Firebase ID
      const updatedState: SavedDesignState = {
        version: CURRENT_VERSION,
        date: new Date().toISOString(),
        ...state,
        firebaseId: firebaseResult.id,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));

      return {
        success: true,
        firebaseId: firebaseResult.id,
      };
    }

    // If Firebase fails, still return success since local storage worked
    return {
      success: true,
      error: `Local save successful, but Firebase sync failed: ${firebaseResult.error}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Load the design state from local storage
 */
export const loadDesignState = (): SavedDesignState | null => {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) {
      return null;
    }

    const parsedData = JSON.parse(savedData) as SavedDesignState;

    // Convert date strings back to Date objects for wardrobe instances
    if (parsedData.designData?.wardrobeInstances) {
      parsedData.designData.wardrobeInstances =
        parsedData.designData.wardrobeInstances.map((instance) => ({
          ...instance,
          addedAt: new Date(instance.addedAt),
        }));
    }

    return parsedData;
  } catch (error) {
    return null;
  }
};

/**
 * Check if there's a saved design state
 */
export const hasSavedDesign = (): boolean => {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    return savedData !== null && savedData.trim() !== "";
  } catch (error) {
    return false;
  }
};

/**
 * Clear the saved design state
 */
export const clearSavedDesign = (): boolean => {
  try {
    localStorage.removeItem(STORAGE_KEY);

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get metadata about the saved design (without loading the full state)
 */
export const getSavedDesignMetadata = (): {
  date: string;
  designId: string;
  version: string;
  firebaseId?: string;
} | null => {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) {
      return null;
    }

    const parsedData = JSON.parse(savedData);
    return {
      date: parsedData.date || "",
      designId: parsedData.designId || "",
      version: parsedData.version || "unknown",
      firebaseId: parsedData.firebaseId,
    };
  } catch (error) {
    return null;
  }
};

/**
 * Load design state from Firebase by ID
 */
export const loadDesignStateFromFirebase = async (
  designId: string
): Promise<{ success: boolean; data?: SavedDesignState; error?: string }> => {
  try {
    const result = await getDesignFromFirebase(designId);

    if (result.success && result.data) {
      // Convert Firebase data to our new structure
      const designState: SavedDesignState = {
        version: result.data.version,
        date: result.data.date || new Date().toISOString(),
        designId: result.data.designId,
        designData: {
          wardrobeInstances: result.data.designData.wardrobeInstances.map(
            (instance: any) => ({
              ...instance,
              addedAt: new Date(instance.addedAt),
            })
          ),
          wallsDimensions: result.data.designData.wallsDimensions,
          customizeMode: result.data.designData.customizeMode,
        },
        shoppingCart: result.data.shoppingCart || [],
        totalPrice: result.data.totalPrice || 0,
        firebaseId: result.data.id,
      };

      return { success: true, data: designState };
    }

    return { success: false, error: result.error };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Sync design state from Firebase to local storage
 * This will try to get the latest version from Firebase and update local storage
 */
export const syncDesignStateFromFirebase = async (
  designId?: string
): Promise<{ success: boolean; synced: boolean; error?: string }> => {
  try {
    let firebaseResult;

    if (designId) {
      // Load specific design
      firebaseResult = await loadDesignStateFromFirebase(designId);
    } else {
      // Try to get the latest design
      const latestResult = await getLatestDesign();
      if (latestResult.success && latestResult.data) {
        firebaseResult = await loadDesignStateFromFirebase(
          latestResult.data.id!
        );
      } else {
        return {
          success: true,
          synced: false,
          error: "No designs found in Firebase",
        };
      }
    }

    if (firebaseResult?.success && firebaseResult.data) {
      // Save to local storage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(firebaseResult.data));
      return { success: true, synced: true };
    }

    return {
      success: true,
      synced: false,
      error: firebaseResult?.error || "Failed to load from Firebase",
    };
  } catch (error) {
    return {
      success: false,
      synced: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Check if local design is newer than Firebase version
 * Returns true if local is newer, false if Firebase is newer, null if can't compare
 */
export const isLocalDesignNewer = async (
  firebaseId: string
): Promise<boolean | null> => {
  try {
    const localState = loadDesignState();
    if (!localState) return null;

    const firebaseResult = await getDesignFromFirebase(firebaseId);
    if (!firebaseResult.success || !firebaseResult.data) return null;

    const localDate = new Date(localState.date).getTime();
    const firebaseDate = new Date(firebaseResult.data.date || 0).getTime();
    return localDate > firebaseDate;
  } catch (error) {
    console.error("Error comparing dates:", error);
    return null;
  }
};
