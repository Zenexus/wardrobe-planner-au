import create from "zustand";
import { Product } from "./types";

// Real-world dimension constants (in CM)
export const ROOM_DIMENSIONS = {
  DEFAULT_WIDTH: 500, // 500cm = 5 meters
  DEFAULT_DEPTH: 400, // 400cm = 4 meters
  DEFAULT_HEIGHT: 250, // 250cm = 2.5 meters
  WALL_THICKNESS: 10, // 10cm wall thickness
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
  selectedWardrobe: Product | null;
  setSelectedWardrobe: (selectedWardrobe: Product | null) => void;
  wardrobeSelectionCount: number;
  incrementWardrobeSelectionCount: () => void;
  // the customise mode is a button that allows the user to customize the room size and wall height
  customizeMode: boolean;
  setCustomizeMode: (customizeMode: boolean) => void;
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
  selectedWardrobe: null,
  setSelectedWardrobe: (selectedWardrobe: Product | null) =>
    set({ selectedWardrobe }),
  wardrobeSelectionCount: 0,
  incrementWardrobeSelectionCount: () =>
    set((state) => ({
      wardrobeSelectionCount: state.wardrobeSelectionCount + 1,
    })),
  customizeMode: false,
  setCustomizeMode: (customizeMode: boolean) => set({ customizeMode }),
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
