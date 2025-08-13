import { WallsDimensions } from "@/store";
import { WardrobeInstance } from "@/types";

export type SavedDesignState = {
  version: string;
  timestamp: number;
  wardrobeInstances: WardrobeInstance[];
  wallsDimensions: WallsDimensions;
  customizeMode: boolean;
};

const STORAGE_KEY = "wardrobe-design-state";
const CURRENT_VERSION = "1.0.0";

/**
 * Save the current design state to local storage
 */
export const saveDesignState = (
  state: Omit<SavedDesignState, "version" | "timestamp">
): boolean => {
  try {
    const designState: SavedDesignState = {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      ...state,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(designState));

    return true;
  } catch (error) {
    return false;
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
    if (parsedData.wardrobeInstances) {
      parsedData.wardrobeInstances = parsedData.wardrobeInstances.map(
        (instance) => ({
          ...instance,
          addedAt: new Date(instance.addedAt),
        })
      );
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
  timestamp: number;
  version: string;
} | null => {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) {
      return null;
    }

    const parsedData = JSON.parse(savedData);
    return {
      timestamp: parsedData.timestamp || 0,
      version: parsedData.version || "unknown",
    };
  } catch (error) {
    return null;
  }
};
