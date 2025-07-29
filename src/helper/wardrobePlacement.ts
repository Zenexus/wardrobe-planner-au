import { WardrobeInstance } from "../types";
import productsData from "../products.json";
import { R3F_SCALE } from "../store";
import {
  requiresWallAttachment,
  getClosestWall,
  snapToWall,
  WallConstraint,
  RoomDimensions as WallRoomDimensions,
} from "./wallConstraints";

// R3F Scaling factor: 1 R3F unit = 100cm

export interface BoundingBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/**
 * Get the bounding box of a wardrobe based on its product dimensions and position
 */
export function getWardrobeBoundingBox(
  instance: WardrobeInstance
): BoundingBox {
  const product = instance.product;
  const [x, y, z] = instance.position;

  // Convert cm to R3F units (1 R3F unit = 100cm, so divide by 100)
  const width = product.width / R3F_SCALE;
  const depth = product.depth / R3F_SCALE;

  return {
    minX: x - width / 2,
    maxX: x + width / 2,
    minZ: z - depth / 2,
    maxZ: z + depth / 2,
  };
}

/**
 * Check if two bounding boxes intersect (with optional padding)
 */
export function boundingBoxesIntersect(
  box1: BoundingBox,
  box2: BoundingBox,
  padding: number = 0.1
): boolean {
  return !(
    box1.maxX + padding < box2.minX ||
    box1.minX - padding > box2.maxX ||
    box1.maxZ + padding < box2.minZ ||
    box1.minZ - padding > box2.maxZ
  );
}

/**
 * Check if a position would collide with existing wardrobes
 */
export function wouldCollideWithExisting(
  productModel: string,
  position: [number, number, number],
  existingInstances: WardrobeInstance[],
  padding: number = 0.2
): boolean {
  // Get product dimensions
  const product = productsData.products.find((p) => p.model === productModel);
  if (!product) return false;

  // Create temporary instance to get bounding box
  const tempInstance: WardrobeInstance = {
    id: "temp",
    product,
    position,
    addedAt: new Date(),
  };

  const newBox = getWardrobeBoundingBox(tempInstance);

  // Check against all existing wardrobes
  for (const existing of existingInstances) {
    const existingBox = getWardrobeBoundingBox(existing);
    if (boundingBoxesIntersect(newBox, existingBox, padding)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if there's any available space in the room for a new wardrobe
 */
export function hasAvailableSpace(
  productModel: string,
  existingInstances: WardrobeInstance[],
  roomDimensions = { width: 5, depth: 4 }
): boolean {
  const product = productsData.products.find((p) => p.model === productModel);
  if (!product) return false;

  // Calculate actual wardrobe height from product dimensions
  const wardrobeHeight = product.height / R3F_SCALE;
  const yPosition = 0; // Position wardrobe directly on floor

  // Quick check: if no existing wardrobes, space is available
  if (existingInstances.length === 0) return true;

  // Test a few strategic positions to see if any are available
  const testPositions = [
    [0, yPosition, 0], // Center
    [-1, yPosition, 0], // Left
    [1, yPosition, 0], // Right
    [0, yPosition, -1], // Front
    [0, yPosition, 1], // Back
  ];

  // Test grid positions across the room
  const stepSize = 0.5;
  const maxX = roomDimensions.width / 2 - 0.5;
  const maxZ = roomDimensions.depth / 2 - 0.5;

  for (let x = -maxX; x <= maxX; x += stepSize) {
    for (let z = -maxZ; z <= maxZ; z += stepSize) {
      const testPosition: [number, number, number] = [x, yPosition, z];
      if (
        !wouldCollideWithExisting(productModel, testPosition, existingInstances)
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Find positions along a specific wall for traditional wardrobes
 */
function findWallPositions(
  wallIndex: number,
  product: any,
  roomDimensions: { width: number; depth: number },
  wallRoomDimensions: WallRoomDimensions,
  existingInstances: WardrobeInstance[],
  yPosition: number
): [number, number, number][] {
  const positions: [number, number, number][] = [];
  const stepSize = 0.3; // Smaller steps for more precise placement
  const wardrobeWidth = product.width / R3F_SCALE;
  const wardrobeDepth = product.depth / R3F_SCALE;

  const { width, depth, thickness } = wallRoomDimensions;
  const halfWidth = width / 2;
  const halfDepth = depth / 2;

  switch (wallIndex) {
    case 0: // Right wall
    case 1: // Left wall
      // Search along Z-axis (front to back)
      const wallX =
        wallIndex === 0
          ? halfWidth - thickness / 2 - wardrobeDepth / 2
          : -halfWidth + thickness / 2 + wardrobeDepth / 2;

      for (
        let z = -halfDepth + wardrobeWidth / 2;
        z <= halfDepth - wardrobeWidth / 2;
        z += stepSize
      ) {
        const testPos: [number, number, number] = [wallX, yPosition, z];
        if (
          !wouldCollideWithExisting(product.model, testPos, existingInstances)
        ) {
          positions.push(testPos);
        }
      }
      break;

    case 2: // Back wall
    case 3: // Front wall
      // Search along X-axis (left to right)
      const wallZ =
        wallIndex === 2
          ? halfDepth - thickness / 2 - wardrobeDepth / 2
          : -halfDepth + thickness / 2 + wardrobeDepth / 2;

      for (
        let x = -halfWidth + wardrobeWidth / 2;
        x <= halfWidth - wardrobeWidth / 2;
        x += stepSize
      ) {
        const testPos: [number, number, number] = [x, yPosition, wallZ];
        if (
          !wouldCollideWithExisting(product.model, testPos, existingInstances)
        ) {
          positions.push(testPos);
        }
      }
      break;
  }

  return positions;
}

/**
 * Smart placement for traditional wardrobes - finds closest spot along walls
 */
function findSmartWallPosition(
  productModel: string,
  existingInstances: WardrobeInstance[],
  roomDimensions: { width: number; depth: number },
  yPosition: number,
  passedWallRoomDimensions?: WallRoomDimensions
): [number, number, number] | null {
  const product = productsData.products.find((p) => p.model === productModel);
  if (!product) return null;

  const wallRoomDimensions: WallRoomDimensions = passedWallRoomDimensions || {
    width: roomDimensions.width,
    depth: roomDimensions.depth,
    height: 2.5, // Default height
    thickness: 0.05, // Default thickness
  };

  // Find existing traditional wardrobes and their wall attachments
  const traditionalWardrobes = existingInstances.filter((w) =>
    requiresWallAttachment(w.product.model)
  );

  if (traditionalWardrobes.length === 0) {
    // No existing traditional wardrobes, start at back wall center
    const backWallZ =
      roomDimensions.depth / 2 -
      wallRoomDimensions.thickness / 2 -
      product.depth / R3F_SCALE / 2;
    return [0, yPosition, backWallZ];
  }

  // Count wardrobes on each wall
  const wallCounts = [0, 0, 0, 0]; // right, left, back, front
  const wallPositions: { [key: number]: [number, number, number][] } = {
    0: [],
    1: [],
    2: [],
    3: [],
  };

  traditionalWardrobes.forEach((wardrobe) => {
    const wallConstraint = getClosestWall(
      wardrobe.position,
      wallRoomDimensions
    );
    wallCounts[wallConstraint.wallIndex]++;
    wallPositions[wallConstraint.wallIndex].push(wardrobe.position);
  });

  // Try to place on walls with existing wardrobes first, prioritizing less crowded walls
  const wallsByPriority = [0, 1, 2, 3]
    .filter((wallIndex) => wallCounts[wallIndex] > 0) // Walls with existing wardrobes
    .sort((a, b) => wallCounts[a] - wallCounts[b]); // Sort by wardrobe count (ascending)

  // First, try adjacent to existing wardrobes on the same wall
  for (const wallIndex of wallsByPriority) {
    const availablePositions = findWallPositions(
      wallIndex,
      product,
      roomDimensions,
      wallRoomDimensions,
      existingInstances,
      yPosition
    );

    if (availablePositions.length > 0) {
      // Find position closest to existing wardrobes on this wall
      const existingOnWall = wallPositions[wallIndex];
      let bestPosition = availablePositions[0];
      let minDistance = Infinity;

      for (const pos of availablePositions) {
        for (const existing of existingOnWall) {
          const distance = Math.sqrt(
            Math.pow(pos[0] - existing[0], 2) +
              Math.pow(pos[2] - existing[2], 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            bestPosition = pos;
          }
        }
      }

      return bestPosition;
    }
  }

  // If no space on walls with existing wardrobes, try empty walls
  const emptyWalls = [0, 1, 2, 3].filter(
    (wallIndex) => wallCounts[wallIndex] === 0
  );

  for (const wallIndex of emptyWalls) {
    const availablePositions = findWallPositions(
      wallIndex,
      product,
      roomDimensions,
      wallRoomDimensions,
      existingInstances,
      yPosition
    );

    if (availablePositions.length > 0) {
      // Return center position of available spots
      const centerIndex = Math.floor(availablePositions.length / 2);
      return availablePositions[centerIndex];
    }
  }

  return null; // No available wall position found
}

/**
 * Find the next available position for a wardrobe using smart placement
 */
export function findAvailablePosition(
  productModel: string,
  existingInstances: WardrobeInstance[],
  preferredPosition?: [number, number, number],
  roomDimensions = { width: 5, depth: 4 }, // Default room size in R3F units
  wallRoomDimensions?: WallRoomDimensions // Optional detailed room dimensions for better placement
): [number, number, number] | null {
  const product = productsData.products.find((p) => p.model === productModel);
  if (!product) {
    console.warn(`Product not found: ${productModel}`);
    return [0, 0, 0]; // Fallback position - on floor
  }

  // Calculate actual wardrobe height from product dimensions
  const wardrobeHeight = product.height / R3F_SCALE;
  const yPosition = 0; // Position wardrobe directly on floor

  // If no existing wardrobes, use center or preferred position
  if (existingInstances.length === 0) {
    const initialPos: [number, number, number] = preferredPosition || [
      0,
      yPosition,
      0,
    ];
    return initialPos;
  }

  // For traditional wardrobes, use smart wall placement
  if (requiresWallAttachment(productModel)) {
    const smartPosition = findSmartWallPosition(
      productModel,
      existingInstances,
      roomDimensions,
      yPosition,
      wallRoomDimensions
    );

    if (smartPosition) {
      console.log(
        `Smart wall placement found for traditional wardrobe at:`,
        smartPosition
      );
      return smartPosition;
    }
  }

  // Fallback to original spiral search for modern wardrobes or if smart placement fails
  console.log(`Using fallback spiral search for ${productModel}`);

  // Start from preferred position or center
  const startX = preferredPosition?.[0] || 0;
  const startZ = preferredPosition?.[2] || 0;

  // Define search parameters
  const stepSize = 0.5; // Distance between test positions
  const maxRadius = Math.max(roomDimensions.width, roomDimensions.depth);

  // Spiral search pattern
  for (let radius = stepSize; radius <= maxRadius; radius += stepSize) {
    // Test positions in a circle around the start point
    const points = Math.max(8, Math.floor(radius * 8)); // More points for larger radii

    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const testX = startX + Math.cos(angle) * radius;
      const testZ = startZ + Math.sin(angle) * radius;

      // Check if position is within room bounds (with some margin)
      const margin = 0.5;
      if (
        Math.abs(testX) > roomDimensions.width / 2 - margin ||
        Math.abs(testZ) > roomDimensions.depth / 2 - margin
      ) {
        continue;
      }

      const testPosition: [number, number, number] = [testX, yPosition, testZ];

      // Check if this position would collide
      if (
        !wouldCollideWithExisting(productModel, testPosition, existingInstances)
      ) {
        return testPosition;
      }
    }
  }

  // If no position found, return null instead of forcing placement
  console.warn("No available position found in room");
  return null;
}

/**
 * Get suggested positions near an existing wardrobe (for manual placement)
 */
export function getSuggestedPositions(
  targetInstanceId: string,
  productModel: string,
  existingInstances: WardrobeInstance[]
): [number, number, number][] {
  const targetInstance = existingInstances.find(
    (w) => w.id === targetInstanceId
  );
  if (!targetInstance) return [];

  const product = productsData.products.find((p) => p.model === productModel);
  if (!product) return [];

  const [targetX, targetY, targetZ] = targetInstance.position;
  const targetBox = getWardrobeBoundingBox(targetInstance);

  // Calculate spacing based on both wardrobes' dimensions
  const newWidth = product.width / R3F_SCALE;
  const newDepth = product.depth / R3F_SCALE;
  const spacing = 0.3; // Minimum gap between wardrobes

  // Suggested positions: left, right, front, back of target wardrobe
  const suggestions: [number, number, number][] = [
    // Left side
    [targetBox.minX - newWidth / 2 - spacing, targetY, targetZ],
    // Right side
    [targetBox.maxX + newWidth / 2 + spacing, targetY, targetZ],
    // Front side
    [targetX, targetY, targetBox.minZ - newDepth / 2 - spacing],
    // Back side
    [targetX, targetY, targetBox.maxZ + newDepth / 2 + spacing],
  ];

  // Filter out positions that would still collide
  return suggestions.filter(
    (pos) => !wouldCollideWithExisting(productModel, pos, existingInstances)
  );
}
