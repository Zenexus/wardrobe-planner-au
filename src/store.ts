import create from "zustand";
import { Product, WardrobeInstance } from "./types";
import {
  findAvailablePosition,
  getSuggestedPositions,
  hasAvailableSpace,
} from "./helper/wardrobePlacement";
import {
  snapToWall,
  snapToCorner,
  requiresWallAttachment,
  requiresCornerPlacement,
} from "./helper/wallConstraints";

// Real-world dimension constants (in CM)
export const ROOM_DIMENSIONS = {
  DEFAULT_WIDTH: 500, // 500cm = 5 meters
  DEFAULT_DEPTH: 400, // 400cm = 4 meters
  DEFAULT_HEIGHT: 250, // 250cm = 2.5 meters
  WALL_THICKNESS: 5, // 5cm wall thickness
};

export const DIMENSION_LIMITS = {
  HEIGHT: {
    MIN: 240, // 240cm = 2.4 meters
    MAX: 400, // 400cm = 4 meters
  },
  WIDTH_LENGTH: {
    MIN: 400, // 400cm = 4 meters
    MAX: 2000, // 2000cm = 20 meters
  },
};

// R3F Scaling factor: 1 R3F unit = 100cm
export const R3F_SCALE = 100;

export interface WallDimensions {
  length: number; // in CM
  depth: number; // in CM (thickness)
  height: number; // in CM
}

export interface WallsDimensions {
  front: WallDimensions;
  back: WallDimensions;
  left: WallDimensions;
  right: WallDimensions;
}

interface StoreState {
  globalHasDragging: boolean;
  setGlobalHasDragging: (globalHasDragging: boolean) => void;
  draggedObjectId: string | null;
  setDraggedObjectId: (draggedObjectId: string | null) => void;
  selectedObjectId: string | null;
  setSelectedObjectId: (selectedObjectId: string | null) => void;

  // Wardrobe instances management
  wardrobeInstances: WardrobeInstance[];
  addWardrobeInstance: (
    product: Product,
    position?: [number, number, number]
  ) => { success: boolean; id?: string; message: string };
  removeWardrobeInstance: (id: string) => void;
  updateWardrobePosition: (
    id: string,
    position: [number, number, number]
  ) => void;
  updateWardrobeRotation: (id: string, rotation: number) => void;
  updateWardrobeInstance: (
    id: string,
    updates: Partial<WardrobeInstance>
  ) => void;
  getWardrobeInstance: (id: string) => WardrobeInstance | undefined;
  getSuggestedPositions: (
    targetInstanceId: string,
    productModel: string
  ) => [number, number, number][];
  checkSpaceAvailability: (productModel: string) => boolean;
  clearAllWardrobes: () => void;

  // the customise mode is a button that allows the user to customize the room size and wall height
  customizeMode: boolean;
  setCustomizeMode: (customizeMode: boolean) => void;

  // Focused wardrobe instance
  focusedWardrobeInstance: WardrobeInstance | null;
  setFocusedWardrobeInstance: (
    focusedWardrobeInstance: WardrobeInstance | null
  ) => void;

  // Show wardrobe measurements toggle
  showWardrobeMeasurements: boolean;
  setShowWardrobeMeasurements: (showWardrobeMeasurements: boolean) => void;
  // Wall dimensions for 4 sides
  wallsDimensions: WallsDimensions;
  setWallDimensions: (
    wall: keyof WallsDimensions,
    dimensions: WallDimensions
  ) => void;
  getWallDimensions: (wall: keyof WallsDimensions) => WallDimensions;
}

export const useStore = create<StoreState>((set, get) => ({
  globalHasDragging: false,
  setGlobalHasDragging: (globalHasDragging: boolean) =>
    set({ globalHasDragging }),
  draggedObjectId: null,
  setDraggedObjectId: (draggedObjectId: string | null) =>
    set({ draggedObjectId }),
  selectedObjectId: null,
  setSelectedObjectId: (selectedObjectId: string | null) =>
    set({ selectedObjectId }),

  // Wardrobe instances management
  wardrobeInstances: [],
  addWardrobeInstance: (
    product: Product,
    position?: [number, number, number]
  ) => {
    const state = get();

    // Calculate room dimensions from walls (convert cm to R3F units)
    const roomDimensions = {
      width: state.wallsDimensions.front.length * 0.01, // Convert cm to R3F units
      depth: state.wallsDimensions.left.length * 0.01,
    };

    // Enhanced room dimensions for wall constraint calculations
    const wallRoomDimensions = {
      width: roomDimensions.width,
      depth: roomDimensions.depth,
      height: state.wallsDimensions.front.height * 0.01, // Convert cm to R3F
      thickness: state.wallsDimensions.front.depth * 0.01, // Convert cm to R3F
    };

    // Check if there's available space for this wardrobe
    if (
      !hasAvailableSpace(
        product.model,
        state.wardrobeInstances,
        roomDimensions,
        wallRoomDimensions
      )
    ) {
      const isTraditional = product.model === "components/W-01684";
      const isLShaped = product.model === "components/W-01687";

      let spaceMessage;
      if (isTraditional) {
        spaceMessage =
          "No wall space available for this traditional wardrobe. Traditional wardrobes must be placed against walls.";
      } else if (isLShaped) {
        spaceMessage =
          "No corner space available for this L-shaped wardrobe. L-shaped wardrobes must be placed in room corners.";
      } else {
        spaceMessage = "No floor space available for this modern wardrobe.";
      }

      return {
        success: false,
        message: `${spaceMessage} Try removing or moving existing wardrobes to create space, or consider enlarging the room.`,
      };
    }

    // Use smart placement to find available position
    const smartPosition = findAvailablePosition(
      product.model,
      state.wardrobeInstances,
      position, // Use provided position as preferred if given
      roomDimensions,
      wallRoomDimensions // Pass enhanced dimensions for better wall placement
    );

    // Double check that placement was successful
    if (!smartPosition) {
      return {
        success: false,
        message: `Unable to find a suitable position for ${product.name}. Room may be too crowded.`,
      };
    }

    const newId = `wardrobe-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // For traditional wardrobes, snap to the closest wall
    // For L-shaped wardrobes, snap to the closest corner
    let finalPosition = smartPosition;
    let finalRotation = 0;

    if (requiresWallAttachment(product.model)) {
      const tempInstance: WardrobeInstance = {
        id: newId,
        product,
        position: smartPosition,
        addedAt: new Date(),
      };

      const snapResult = snapToWall(tempInstance, wallRoomDimensions);
      finalPosition = snapResult.position;
      finalRotation = snapResult.rotation;
    } else if (requiresCornerPlacement(product.model)) {
      const tempInstance: WardrobeInstance = {
        id: newId,
        product,
        position: smartPosition,
        addedAt: new Date(),
      };

      const snapResult = snapToCorner(
        tempInstance,
        wallRoomDimensions,
        state.wardrobeInstances
      );
      if (snapResult) {
        finalPosition = snapResult.position;
        finalRotation = snapResult.rotation;
      } else {
        // This shouldn't happen if hasAvailableSpace worked correctly
        return {
          success: false,
          message: `Failed to snap L-shaped wardrobe to corner. Please try again.`,
        };
      }
    }

    const newInstance: WardrobeInstance = {
      id: newId,
      product,
      position: finalPosition,
      rotation: finalRotation,
      addedAt: new Date(),
    };

    set((state) => ({
      wardrobeInstances: [...state.wardrobeInstances, newInstance],
    }));

    return {
      success: true,
      id: newId,
      message: `${product.name} added successfully!`,
    };
  },
  removeWardrobeInstance: (id: string) =>
    set((state) => ({
      wardrobeInstances: state.wardrobeInstances.filter((w) => w.id !== id),
    })),
  updateWardrobePosition: (id: string, position: [number, number, number]) => {
    const state = get();
    const instance = state.wardrobeInstances.find((w) => w.id === id);

    let finalPosition = position;
    let finalRotation = instance?.rotation || 0;

    // For traditional wardrobes, maintain wall constraints
    if (instance && requiresWallAttachment(instance.product.model)) {
      const wallRoomDimensions = {
        width: state.wallsDimensions.front.length * 0.01,
        depth: state.wallsDimensions.left.length * 0.01,
        height: state.wallsDimensions.front.height * 0.01,
        thickness: state.wallsDimensions.front.depth * 0.01,
      };

      const updatedInstance = { ...instance, position };
      const snapResult = snapToWall(updatedInstance, wallRoomDimensions);
      finalPosition = snapResult.position;
      finalRotation = snapResult.rotation;
    }
    // For L-shaped wardrobes, maintain corner constraints
    else if (instance && requiresCornerPlacement(instance.product.model)) {
      const wallRoomDimensions = {
        width: state.wallsDimensions.front.length * 0.01,
        depth: state.wallsDimensions.left.length * 0.01,
        height: state.wallsDimensions.front.height * 0.01,
        thickness: state.wallsDimensions.front.depth * 0.01,
      };

      const updatedInstance = { ...instance, position };
      const otherInstances = state.wardrobeInstances.filter((w) => w.id !== id);
      const snapResult = snapToCorner(
        updatedInstance,
        wallRoomDimensions,
        otherInstances
      );

      if (snapResult) {
        finalPosition = snapResult.position;
        finalRotation = snapResult.rotation;
      }
    }

    set((state) => ({
      wardrobeInstances: state.wardrobeInstances.map((w) =>
        w.id === id
          ? { ...w, position: finalPosition, rotation: finalRotation }
          : w
      ),
    }));
  },

  updateWardrobeRotation: (id: string, rotation: number) =>
    set((state) => ({
      wardrobeInstances: state.wardrobeInstances.map((w) =>
        w.id === id ? { ...w, rotation } : w
      ),
    })),
  updateWardrobeInstance: (id: string, updates: Partial<WardrobeInstance>) =>
    set((state) => ({
      wardrobeInstances: state.wardrobeInstances.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      ),
    })),
  getWardrobeInstance: (id: string) => {
    return get().wardrobeInstances.find((w) => w.id === id);
  },
  getSuggestedPositions: (targetInstanceId: string, productModel: string) => {
    const state = get();
    return getSuggestedPositions(
      targetInstanceId,
      productModel,
      state.wardrobeInstances
    );
  },
  checkSpaceAvailability: (productModel: string) => {
    const state = get();
    const roomDimensions = {
      width: state.wallsDimensions.front.length * 0.01,
      depth: state.wallsDimensions.left.length * 0.01,
    };
    return hasAvailableSpace(
      productModel,
      state.wardrobeInstances,
      roomDimensions
    );
  },
  clearAllWardrobes: () => {
    set(() => ({
      wardrobeInstances: [],
      selectedObjectId: null,
      draggedObjectId: null,
      focusedWardrobeInstance: null,
      globalHasDragging: false,
    }));
  },
  customizeMode: false,
  setCustomizeMode: (customizeMode: boolean) => set({ customizeMode }),
  focusedWardrobeInstance: null,
  setFocusedWardrobeInstance: (
    focusedWardrobeInstance: WardrobeInstance | null
  ) => set({ focusedWardrobeInstance }),
  showWardrobeMeasurements: false,
  setShowWardrobeMeasurements: (showWardrobeMeasurements: boolean) =>
    set({ showWardrobeMeasurements }),
  // Wall dimensions - now using real CM values
  wallsDimensions: {
    front: {
      length: ROOM_DIMENSIONS.DEFAULT_WIDTH,
      depth: ROOM_DIMENSIONS.WALL_THICKNESS,
      height: ROOM_DIMENSIONS.DEFAULT_HEIGHT,
    },
    back: {
      length: ROOM_DIMENSIONS.DEFAULT_WIDTH,
      depth: ROOM_DIMENSIONS.WALL_THICKNESS,
      height: ROOM_DIMENSIONS.DEFAULT_HEIGHT,
    },
    left: {
      length: ROOM_DIMENSIONS.DEFAULT_DEPTH,
      depth: ROOM_DIMENSIONS.WALL_THICKNESS,
      height: ROOM_DIMENSIONS.DEFAULT_HEIGHT,
    },
    right: {
      length: ROOM_DIMENSIONS.DEFAULT_DEPTH,
      depth: ROOM_DIMENSIONS.WALL_THICKNESS,
      height: ROOM_DIMENSIONS.DEFAULT_HEIGHT,
    },
  },
  setWallDimensions: (
    wall: keyof WallsDimensions,
    dimensions: WallDimensions
  ) =>
    set((state) => ({
      wallsDimensions: {
        ...state.wallsDimensions,
        [wall]: dimensions,
      },
    })),
  getWallDimensions: (wall: keyof WallsDimensions) =>
    get().wallsDimensions[wall],
}));
