import { WallsDimensions } from "../store";
import { WardrobeInstance } from "../types";

// Define the structure of saved design data
export interface SavedDesignState {
  version: string; // For future compatibility
  timestamp: number;
  wardrobeInstances: WardrobeInstance[];
  wallsDimensions: WallsDimensions;
  customizeMode: boolean;
  // Add any other state that should be persisted
}

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
    console.log("Design state saved successfully", designState);
    return true;
  } catch (error) {
    console.error("Failed to save design state:", error);
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

    // Version compatibility check (for future use)
    if (!parsedData.version) {
      console.warn("Saved data has no version, might be incompatible");
    }

    // Convert date strings back to Date objects for wardrobe instances
    if (parsedData.wardrobeInstances) {
      parsedData.wardrobeInstances = parsedData.wardrobeInstances.map(
        (instance) => ({
          ...instance,
          addedAt: new Date(instance.addedAt),
        })
      );
    }

    console.log("Design state loaded successfully", parsedData);
    return parsedData;
  } catch (error) {
    console.error("Failed to load design state:", error);
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
    console.error("Failed to check for saved design:", error);
    return false;
  }
};

/**
 * Clear the saved design state
 */
export const clearSavedDesign = (): boolean => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log("Saved design cleared successfully");
    return true;
  } catch (error) {
    console.error("Failed to clear saved design:", error);
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
    console.error("Failed to get saved design metadata:", error);
    return null;
  }
};
