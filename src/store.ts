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
  getClosestWall,
  getCornerPositions,
  RoomDimensions as WallRoomDimensions,
} from "./helper/wallConstraints";
import {
  saveDesignState,
  loadDesignState,
  SavedDesignState,
} from "./utils/memorySystem";

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

  // Memory system functions
  saveCurrentState: () => boolean;
  loadSavedState: (savedState: SavedDesignState) => boolean;
  resetToDefaultState: () => void;
  autoSaveEnabled: boolean;
  setAutoSaveEnabled: (enabled: boolean) => void;

  // Global lighting toggle
  lightsOn: boolean;
  setLightsOn: (on: boolean) => void;

  // Recalculate wardrobe positions when room size changes
  recalcPositionsForRoomResize: () => void;
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

  // Memory system functions
  saveCurrentState: () => {
    const state = get();
    return saveDesignState({
      wardrobeInstances: state.wardrobeInstances,
      wallsDimensions: state.wallsDimensions,
      customizeMode: state.customizeMode,
    });
  },

  loadSavedState: (savedState: SavedDesignState) => {
    try {
      console.log("🔄 Loading saved state into store:", {
        wardrobes: savedState.wardrobeInstances?.length || 0,
        walls: savedState.wallsDimensions,
        customizeMode: savedState.customizeMode,
      });

      set({
        wardrobeInstances: savedState.wardrobeInstances || [],
        wallsDimensions: savedState.wallsDimensions,
        customizeMode: savedState.customizeMode || false,
        // Reset UI states when loading
        selectedObjectId: null,
        draggedObjectId: null,
        focusedWardrobeInstance: null,
        globalHasDragging: false,
      });

      // Verify the state was set correctly
      const currentState = get();
      console.log(
        "✅ State loaded successfully. Current wardrobes:",
        currentState.wardrobeInstances.length
      );
      return true;
    } catch (error) {
      console.error("❌ Failed to load saved state:", error);
      return false;
    }
  },

  resetToDefaultState: () => {
    set({
      wardrobeInstances: [],
      selectedObjectId: null,
      draggedObjectId: null,
      focusedWardrobeInstance: null,
      globalHasDragging: false,
      customizeMode: false,
      showWardrobeMeasurements: false,
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
    });
    console.log("State reset to default");
  },

  // Auto-save control
  autoSaveEnabled: false, // Start disabled
  setAutoSaveEnabled: (enabled: boolean) => {
    console.log(`🔄 Auto-save ${enabled ? "enabled" : "disabled"}`);
    set({ autoSaveEnabled: enabled });
  },

  // Lighting
  lightsOn: true,
  setLightsOn: (on: boolean) => set({ lightsOn: on }),

  // Adjust wardrobes when room size changes
  recalcPositionsForRoomResize: () => {
    const state = get();
    const wallRoomDimensions: WallRoomDimensions = {
      width: state.wallsDimensions.front.length * 0.01,
      depth: state.wallsDimensions.left.length * 0.01,
      height: state.wallsDimensions.front.height * 0.01,
      thickness: state.wallsDimensions.front.depth * 0.01,
    };

    const GAP = 0.05; // 5cm minimal gap between wardrobes along a wall

    // Start from a shallow copy
    const updated: WardrobeInstance[] = state.wardrobeInstances.map((w) => ({
      ...w,
    }));

    type WallItem = {
      index: number; // index in updated/state array
      wallIndex: 0 | 1 | 2 | 3;
      alongAxis: "x" | "z"; // axis parallel to wall
      widthAlong: number; // projected width along that axis
      minBound: number; // allowed min center along axis
      maxBound: number; // allowed max center along axis
      desiredCenter: number; // preferred center (from current position)
      snapNormalPos: [number, number, number]; // snapped normal position
      rotation: number;
    };

    const wallGroups: Record<0 | 1 | 2 | 3, WallItem[]> = {
      0: [],
      1: [],
      2: [],
      3: [],
    };

    // Helper to process a single wardrobe
    const processWardrobe = (instance: WardrobeInstance, index: number) => {
      const product = instance.product;
      const wardrobeWidth = product.width * 0.01;
      const wardrobeDepth = product.depth * 0.01;

      // Helper to clamp within room bounds (center-based)
      const clampWithinRoom = (x: number, z: number): [number, number] => {
        const maxX = wallRoomDimensions.width / 2 - wardrobeWidth / 2;
        const maxZ = wallRoomDimensions.depth / 2 - wardrobeDepth / 2;
        const clampedX = Math.max(-maxX, Math.min(maxX, x));
        const clampedZ = Math.max(-maxZ, Math.min(maxZ, z));
        return [clampedX, clampedZ];
      };

      if (requiresCornerPlacement(product.model)) {
        // Move to nearest corner under new size
        const corners = getCornerPositions(
          wallRoomDimensions,
          wardrobeWidth,
          wardrobeDepth
        );
        const [cx, , cz] = instance.position;
        let nearest = corners[0];
        let nearestDist = Infinity;
        for (const c of corners) {
          const dx = c.position[0] - cx;
          const dz = c.position[2] - cz;
          const d2 = dx * dx + dz * dz;
          if (d2 < nearestDist) {
            nearest = c;
            nearestDist = d2;
          }
        }
        updated[index] = {
          ...instance,
          position: nearest.position,
          rotation: nearest.rotation,
        };
        return;
      }

      if (requiresWallAttachment(product.model)) {
        // Snap to current closest wall under new dimensions
        const snap = snapToWall(instance, wallRoomDimensions);
        const constraint = getClosestWall(snap.position, wallRoomDimensions);
        const alongAxis: "x" | "z" =
          constraint.constrainedAxis === "x" ? "z" : "x";
        const widthAlong = product.width * 0.01; // Along the wall use wardrobe width

        // Allowed bounds for center along the wall
        let minBound: number, maxBound: number;
        if (alongAxis === "z") {
          const maxZ = wallRoomDimensions.depth / 2 - widthAlong / 2;
          minBound = -maxZ;
          maxBound = maxZ;
        } else {
          const maxX = wallRoomDimensions.width / 2 - widthAlong / 2;
          minBound = -maxX;
          maxBound = maxX;
        }

        const desiredCenterRaw =
          alongAxis === "z" ? instance.position[2] : instance.position[0];
        const desiredCenter = Math.max(
          minBound,
          Math.min(maxBound, desiredCenterRaw)
        );

        wallGroups[constraint.wallIndex as 0 | 1 | 2 | 3].push({
          index,
          wallIndex: constraint.wallIndex as 0 | 1 | 2 | 3,
          alongAxis,
          widthAlong,
          minBound,
          maxBound,
          desiredCenter,
          snapNormalPos: snap.position as [number, number, number],
          rotation: snap.rotation,
        });
        return;
      }

      // Freestanding: clamp within room
      const [nx, nz] = clampWithinRoom(
        instance.position[0],
        instance.position[2]
      );
      updated[index] = {
        ...instance,
        position: [nx, instance.position[1], nz] as [number, number, number],
      };
    };

    state.wardrobeInstances.forEach(processWardrobe);

    // Resolve overlaps on each wall group with a two-pass constraint solver
    ([0, 1, 2, 3] as const).forEach((key) => {
      const items = wallGroups[key];
      if (items.length === 0) return;

      // Sort by desired center to preserve relative order
      items.sort((a, b) => a.desiredCenter - b.desiredCenter);

      // Compute adaptive gap if wall is oversubscribed
      const n = items.length;
      const totalWidths = items.reduce((sum, it) => sum + it.widthAlong, 0);
      const groupMin = Math.min(...items.map((it) => it.minBound));
      const groupMax = Math.max(...items.map((it) => it.maxBound));
      const available = groupMax - groupMin;
      const baseGap = GAP;
      const required = totalWidths + baseGap * (n - 1);
      const effectiveGap =
        n > 1
          ? Math.max(0, Math.min(baseGap, (available - totalWidths) / (n - 1)))
          : 0;

      // Forward pass: enforce min spacing and lower bounds
      const centers: number[] = new Array(items.length);
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const prevCenter = i > 0 ? centers[i - 1] : undefined;
        const prevWidth = i > 0 ? items[i - 1].widthAlong : undefined;
        let center = Math.max(item.desiredCenter, item.minBound);
        if (prevCenter !== undefined && prevWidth !== undefined) {
          const sep = (prevWidth + item.widthAlong) / 2 + effectiveGap;
          center = Math.max(center, prevCenter + sep);
        }
        centers[i] = Math.min(center, item.maxBound);
      }

      // Backward pass: enforce upper bounds and spacing
      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const nextCenter = i < items.length - 1 ? centers[i + 1] : undefined;
        const nextWidth =
          i < items.length - 1 ? items[i + 1].widthAlong : undefined;
        let center = centers[i];
        center = Math.min(center, item.maxBound);
        if (nextCenter !== undefined && nextWidth !== undefined) {
          const sep = (nextWidth + item.widthAlong) / 2 + effectiveGap;
          center = Math.min(center, nextCenter - sep);
        }
        centers[i] = Math.max(center, item.minBound);
      }

      // Apply resolved centers to updated positions
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const center = centers[i];
        if (item.alongAxis === "z") {
          updated[item.index] = {
            ...updated[item.index],
            position: [
              item.snapNormalPos[0],
              item.snapNormalPos[1],
              center,
            ] as [number, number, number],
            rotation: item.rotation,
          };
        } else {
          updated[item.index] = {
            ...updated[item.index],
            position: [
              center,
              item.snapNormalPos[1],
              item.snapNormalPos[2],
            ] as [number, number, number],
            rotation: item.rotation,
          };
        }
      }
    });

    set({ wardrobeInstances: updated });
  },
}));
