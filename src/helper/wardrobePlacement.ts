// This file contains the logic for placing wardrobes in the room

import { WardrobeInstance } from "../types";
// Products data will be passed as parameters to functions
import { R3F_SCALE } from "../store";
import {
  requiresWallAttachment,
  requiresCornerPlacement,
  getClosestWall,
  getCornerPositions,
  findAvailableCorner,
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
  const [x, , z] = instance.position;

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
  padding: number = 0.2,
  productsData?: any[]
): boolean {
  if (!productsData) return false;
  // Get product dimensions
  const product = productsData.find((p) => p.model === productModel);
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
 * This is a more efficient check that doesn't do full placement calculation
 */
export function hasAvailableSpace(
  productModel: string,
  existingInstances: WardrobeInstance[],
  roomDimensions = { width: 5, depth: 4 },
  wallRoomDimensions?: WallRoomDimensions,
  productsData?: any[]
): boolean {
  if (!productsData) return false;
  const product = productsData.find((p) => p.model === productModel);
  if (!product) return false;

  // Quick check: if no existing wardrobes, space is available
  if (existingInstances.length === 0) return true;

  const yPosition = 0;

  // For L-shaped wardrobes, check corner positions
  if (requiresCornerPlacement(productModel) && wallRoomDimensions) {
    console.log(
      `Checking corner positions for L-shaped wardrobe ${product.name}`
    );

    const wardrobeWidth = product.width / 100; // Convert cm to R3F units
    const wardrobeDepth = product.depth / 100; // Convert cm to R3F units
    const corners = getCornerPositions(
      wallRoomDimensions,
      wardrobeWidth,
      wardrobeDepth
    );

    // Check each corner for availability
    for (const corner of corners) {
      // Create a temporary instance at this corner to check for collisions
      const tempInstance: WardrobeInstance = {
        id: "temp-corner-check",
        product,
        position: corner.position,
        rotation: corner.rotation,
        addedAt: new Date(),
      };

      // Check if this corner position would collide with existing wardrobes
      const tempBoundingBox = getWardrobeBoundingBox(tempInstance);
      let hasCollision = false;

      for (const existing of existingInstances) {
        const existingBox = getWardrobeBoundingBox(existing);
        if (boundingBoxesIntersect(tempBoundingBox, existingBox, 0.1)) {
          hasCollision = true;
          break;
        }
      }

      if (!hasCollision) {
        console.log(
          `Found available corner position at corner ${corner.cornerIndex}`
        );
        return true; // Found at least one available corner
      }
    }
    console.log(
      `No corner positions available for L-shaped wardrobe ${product.name}`
    );
    return false; // No corner positions available
  }

  // For traditional wardrobes, check wall positions
  if (requiresWallAttachment(productModel) && wallRoomDimensions) {
    console.log(
      `Checking wall positions for traditional wardrobe ${product.name}`
    );
    // Check each wall for available space
    for (let wallIndex = 0; wallIndex < 4; wallIndex++) {
      const wallPositions = findWallPositions(
        wallIndex,
        product,
        roomDimensions,
        wallRoomDimensions,
        existingInstances,
        yPosition
      );
      if (wallPositions.length > 0) {
        console.log(
          `Found ${wallPositions.length} available positions on wall ${wallIndex}`
        );
        return true; // Found at least one available wall position
      }
    }
    console.log(
      `No wall positions available for traditional wardrobe ${product.name}`
    );
    return false; // No wall positions available
  }

  // For modern wardrobes, do a grid search
  console.log(`Checking grid positions for modern wardrobe ${product.name}`);
  const stepSize = 0.5;
  const maxX = roomDimensions.width / 2 - 0.5;
  const maxZ = roomDimensions.depth / 2 - 0.5;

  for (let x = -maxX; x <= maxX; x += stepSize) {
    for (let z = -maxZ; z <= maxZ; z += stepSize) {
      const testPosition: [number, number, number] = [x, yPosition, z];
      if (
        !wouldCollideWithExisting(
          productModel,
          testPosition,
          existingInstances,
          0.2,
          productsData
        )
      ) {
        console.log(
          `Found available position for modern wardrobe at [${x.toFixed(
            1
          )}, ${yPosition}, ${z.toFixed(1)}]`
        );
        return true;
      }
    }
  }

  console.log(
    `No grid positions available for modern wardrobe ${product.name}`
  );
  return false;
}

/**
 * Find positions along a specific wall for traditional wardrobes
 */
export function findWallPositions(
  wallIndex: number,
  product: any,
  _roomDimensions: { width: number; depth: number },
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
          !wouldCollideWithExisting(
            product.model,
            testPos,
            existingInstances,
            0.2,
            [product]
          )
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
          !wouldCollideWithExisting(
            product.model,
            testPos,
            existingInstances,
            0.2,
            [product]
          )
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
  passedWallRoomDimensions?: WallRoomDimensions,
  productsData?: any[]
): [number, number, number] | null {
  if (!productsData) return null;
  const product = productsData.find((p) => p.model === productModel);
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
  wallRoomDimensions?: WallRoomDimensions, // Optional detailed room dimensions for better placement
  productsData?: any[]
): [number, number, number] | null {
  if (!productsData) return null;
  const product = productsData.find((p) => p.model === productModel);
  if (!product) {
    console.warn(`Product not found: ${productModel}`);
    return null; // Return null instead of fallback position
  }

  const yPosition = 0; // Position wardrobe directly on floor

  // If no existing wardrobes, use center or preferred position (except for corner wardrobes which must go in corners)
  if (existingInstances.length === 0) {
    // For L-shaped wardrobes, place in first available corner
    if (requiresCornerPlacement(productModel)) {
      if (!wallRoomDimensions) {
        console.warn("Wall room dimensions required for corner placement");
        return null;
      }
      const wardrobeWidth = product.width / 100;
      const wardrobeDepth = product.depth / 100;
      const corners = getCornerPositions(
        wallRoomDimensions,
        wardrobeWidth,
        wardrobeDepth
      );
      console.log(
        `Placing L-shaped wardrobe in first corner:`,
        corners[0].position
      );
      return corners[0].position; // Use first corner when room is empty
    }

    const initialPos: [number, number, number] = preferredPosition || [
      0,
      yPosition,
      0,
    ];
    return initialPos;
  }

  // For L-shaped wardrobes, find available corner
  if (requiresCornerPlacement(productModel)) {
    if (!wallRoomDimensions) {
      console.warn("Wall room dimensions required for corner placement");
      return null;
    }

    const tempInstance: WardrobeInstance = {
      id: "temp-corner-placement",
      product,
      position: [0, yPosition, 0], // Temporary position
      addedAt: new Date(),
    };

    const cornerResult = findAvailableCorner(
      tempInstance,
      wallRoomDimensions,
      existingInstances
    );
    if (cornerResult) {
      console.log(
        `Corner placement found for L-shaped wardrobe at corner ${cornerResult.cornerIndex}:`,
        cornerResult.position
      );
      return cornerResult.position;
    } else {
      console.log("No available corners for L-shaped wardrobe");
      return null;
    }
  }

  // For traditional wardrobes, use smart wall placement
  if (requiresWallAttachment(productModel)) {
    const smartPosition = findSmartWallPosition(
      productModel,
      existingInstances,
      roomDimensions,
      yPosition,
      wallRoomDimensions,
      productsData
    );

    if (smartPosition) {
      console.log(
        `Smart wall placement found for traditional wardrobe at:`,
        smartPosition
      );
      return smartPosition;
    }
  }

  // For modern (freestanding) wardrobes, try to place beside existing wardrobes first
  console.log(`Finding position for modern wardrobe ${productModel}`);

  // If there are existing wardrobes, try positions adjacent to them first
  if (existingInstances.length > 0) {
    console.log(
      `Trying positions adjacent to ${existingInstances.length} existing wardrobes`
    );

    // Get the most recently added wardrobe to place beside it
    const recentWardrobe = existingInstances[existingInstances.length - 1];
    const recentBox = getWardrobeBoundingBox(recentWardrobe);

    const newWidth = product.width / R3F_SCALE;
    const newDepth = product.depth / R3F_SCALE;
    const spacing = 0.2; // Minimum gap between wardrobes

    // Try positions in order: right, left, back, front of the most recent wardrobe
    const adjacentPositions: [number, number, number][] = [
      // Right side (positive X)
      [
        recentBox.maxX + newWidth / 2 + spacing,
        yPosition,
        recentWardrobe.position[2],
      ],
      // Left side (negative X)
      [
        recentBox.minX - newWidth / 2 - spacing,
        yPosition,
        recentWardrobe.position[2],
      ],
      // Back side (positive Z)
      [
        recentWardrobe.position[0],
        yPosition,
        recentBox.maxZ + newDepth / 2 + spacing,
      ],
      // Front side (negative Z)
      [
        recentWardrobe.position[0],
        yPosition,
        recentBox.minZ - newDepth / 2 - spacing,
      ],
    ];

    for (const adjacentPos of adjacentPositions) {
      // Check if position is within room bounds
      const margin = 0.5;
      if (
        Math.abs(adjacentPos[0]) <= roomDimensions.width / 2 - margin &&
        Math.abs(adjacentPos[2]) <= roomDimensions.depth / 2 - margin
      ) {
        // Check if this position would collide with any existing wardrobe
        if (
          !wouldCollideWithExisting(
            productModel,
            adjacentPos,
            existingInstances,
            0.2,
            productsData
          )
        ) {
          console.log(
            `Found adjacent position beside most recent wardrobe at:`,
            adjacentPos
          );
          return adjacentPos;
        }
      }
    }

    console.log(
      `No adjacent positions available beside most recent wardrobe, trying other wardrobes`
    );

    // If no position found beside most recent, try beside other wardrobes
    for (const existingInstance of existingInstances.slice(0, -1).reverse()) {
      const existingBox = getWardrobeBoundingBox(existingInstance);

      const nearbyPositions: [number, number, number][] = [
        [
          existingBox.maxX + newWidth / 2 + spacing,
          yPosition,
          existingInstance.position[2],
        ],
        [
          existingBox.minX - newWidth / 2 - spacing,
          yPosition,
          existingInstance.position[2],
        ],
        [
          existingInstance.position[0],
          yPosition,
          existingBox.maxZ + newDepth / 2 + spacing,
        ],
        [
          existingInstance.position[0],
          yPosition,
          existingBox.minZ - newDepth / 2 - spacing,
        ],
      ];

      for (const nearbyPos of nearbyPositions) {
        const margin = 0.5;
        if (
          Math.abs(nearbyPos[0]) <= roomDimensions.width / 2 - margin &&
          Math.abs(nearbyPos[2]) <= roomDimensions.depth / 2 - margin
        ) {
          if (
            !wouldCollideWithExisting(
              productModel,
              nearbyPos,
              existingInstances,
              0.2,
              productsData
            )
          ) {
            console.log(
              `Found position beside another wardrobe at:`,
              nearbyPos
            );
            return nearbyPos;
          }
        }
      }
    }
  }

  // Fallback to spiral search for modern wardrobes if no adjacent positions found
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
        !wouldCollideWithExisting(
          productModel,
          testPosition,
          existingInstances,
          0.2,
          productsData
        )
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
  existingInstances: WardrobeInstance[],
  productsData?: any[]
): [number, number, number][] {
  const targetInstance = existingInstances.find(
    (w) => w.id === targetInstanceId
  );
  if (!targetInstance) return [];

  if (!productsData) return [];
  const product = productsData.find((p) => p.model === productModel);
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
    (pos) =>
      !wouldCollideWithExisting(
        productModel,
        pos,
        existingInstances,
        0.2,
        productsData
      )
  );
}
