import { WardrobeInstance } from "../types";
import productsData from "../products.json";
import { R3F_SCALE } from "../store";

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
 * Find the next available position for a wardrobe using spiral search
 */
export function findAvailablePosition(
  productModel: string,
  existingInstances: WardrobeInstance[],
  preferredPosition?: [number, number, number],
  roomDimensions = { width: 5, depth: 4 } // Default room size in R3F units
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
