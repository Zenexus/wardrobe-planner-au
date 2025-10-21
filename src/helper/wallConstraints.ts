import * as THREE from "three";
import { WardrobeInstance } from "../types";
import {
  getWardrobeBoundingBox,
  boundingBoxesIntersect,
} from "./wardrobePlacement";

//FIXME: this wall index need align with the wall index in closestWallDetector.ts
export type WallConstraint = {
  wallIndex: number; // 0: right, 1: left, 2: back, 3: front
  wallNormal: THREE.Vector3;
  constrainedAxis: "x" | "z"; // Which axis to constrain
  wallPosition: number; // Position along the constrained axis
  rotation: number; // Y-axis rotation in radians to face away from wall
  isValid: boolean;
};

export interface RoomDimensions {
  width: number;
  depth: number;
  height: number;
  thickness: number;
}

/**
 * Determines which wall a wardrobe should attach to based on its position
 */
export function getClosestWall(
  position: [number, number, number],
  roomDimensions: RoomDimensions
): WallConstraint {
  const [x, , z] = position; // Skip y since it's not used
  const { width, depth, thickness } = roomDimensions;

  const halfWidth = width * 0.5; // Slightly faster than division
  const halfDepth = depth * 0.5;
  const halfThickness = thickness * 0.5;

  // Pre-calculate wall positions
  const rightWallPos = halfWidth - halfThickness;
  const leftWallPos = -halfWidth + halfThickness;
  const backWallPos = halfDepth - halfThickness;
  const frontWallPos = -halfDepth + halfThickness;

  // Calculate distances (no Math.abs needed since we know wall orientations)
  const distanceToRight = rightWallPos - x;
  const distanceToLeft = x - leftWallPos;
  const distanceToBack = backWallPos - z;
  const distanceToFront = z - frontWallPos;

  // Find minimum distance and corresponding wall in one pass
  let minDistance = distanceToRight;
  let closestWall = 0;

  if (distanceToLeft < minDistance) {
    minDistance = distanceToLeft;
    closestWall = 1;
  }
  if (distanceToBack < minDistance) {
    minDistance = distanceToBack;
    closestWall = 2;
  }
  if (distanceToFront < minDistance) {
    closestWall = 3;
  }

  // Wall data lookup table (more cache-friendly than array of objects)
  const wallNormals = [
    new THREE.Vector3(-1, 0, 0), // Right
    new THREE.Vector3(1, 0, 0), // Left
    new THREE.Vector3(0, 0, -1), // Back
    new THREE.Vector3(0, 0, 1), // Front
  ];

  const wallAxes = ["x", "x", "z", "z"] as const;
  const wallPositions = [rightWallPos, leftWallPos, backWallPos, frontWallPos];
  const wallRotations = [Math.PI * 0.5, -Math.PI * 0.5, 0, Math.PI];

  return {
    wallIndex: closestWall,
    wallNormal: wallNormals[closestWall],
    constrainedAxis: wallAxes[closestWall],
    wallPosition: wallPositions[closestWall],
    rotation: wallRotations[closestWall],
    isValid: true,
  };
}
/**
 * Snaps a wardrobe position to the closest wall (backside against wall, facing center)
 */
export function snapToWall(
  instance: WardrobeInstance,
  roomDimensions: RoomDimensions
): { position: [number, number, number]; rotation: number } {
  const [x, y, z] = instance.position;
  const wallConstraint = getClosestWall(instance.position, roomDimensions);

  if (!wallConstraint.isValid) {
    return { position: instance.position, rotation: 0 };
  }

  // Get wardrobe dimensions (original dimensions, not rotated)
  const product = instance.product;
  const wardrobeDepth = product.depth / 100; // Convert cm to R3F units

  // Add safety buffer to prevent sinking into walls
  const WALL_CLEARANCE_BUFFER = 0.02; // 2cm safety margin

  let newX = x;
  let newZ = z;

  // Calculate position based on wall and rotation
  // The wardrobe back should be against the wall, front facing center
  // Apply buffer to keep wardrobe slightly away from wall surface
  switch (wallConstraint.wallIndex) {
    case 0: // Right wall - wardrobe faces left (rotation = π/2)
      newX =
        wallConstraint.wallPosition -
        (wardrobeDepth / 2 + WALL_CLEARANCE_BUFFER);
      break;
    case 1: // Left wall - wardrobe faces right (rotation = -π/2)
      newX =
        wallConstraint.wallPosition +
        (wardrobeDepth / 2 + WALL_CLEARANCE_BUFFER);
      break;
    case 2: // Back wall - wardrobe faces forward (rotation = π)
      newZ =
        wallConstraint.wallPosition -
        (wardrobeDepth / 2 + WALL_CLEARANCE_BUFFER);
      break;
    case 3: // Front wall - wardrobe faces backward (rotation = 0)
      newZ =
        wallConstraint.wallPosition +
        (wardrobeDepth / 2 + WALL_CLEARANCE_BUFFER);
      break;
  }

  return {
    position: [newX, y, newZ],
    rotation: wallConstraint.rotation,
  };
}

/**
 * Constrains movement along a wall for wall-attached wardrobes
 * Allows wall transitions when wardrobe is dragged to a different wall
 */
export function constrainMovementAlongWall(
  targetPosition: [number, number, number],
  wallConstraint: WallConstraint,
  instance: WardrobeInstance,
  roomDimensions: RoomDimensions,
  isCurrentlyTransitioning: boolean = false
): {
  position: [number, number, number];
  shouldTransition: boolean;
  newWallConstraint?: WallConstraint;
  allowFreeMovement?: boolean;
} {
  const [targetX, targetY, targetZ] = targetPosition;

  // Use PRODUCT dimensions (not bounding box) - these are the actual dimensions
  // Convert from cm to R3F units
  const product = instance.product;

  // For traditional wardrobes, regardless of which wall they're on:
  // - depth is always perpendicular to wall (used for wall offset)
  // - width is always parallel to wall (used for sliding movement bounds)
  const wardrobeDepth = product.depth / 100; // Perpendicular to wall (R3F units)
  const wardrobeWidth = product.width / 100; // Parallel to wall (R3F units)

  // Add a small safety buffer to prevent sinking into walls
  // This accounts for model pivot point variations and floating-point precision
  const WALL_CLEARANCE_BUFFER = 0.02; // 2cm safety margin

  // Check if wardrobe should transition to a different wall
  // Detect when user drags the wardrobe close to a perpendicular wall
  const TRANSITION_THRESHOLD = 0.5; // 50cm from perpendicular wall to trigger transition

  let shouldTransition = false;
  let newWallConstraint: WallConstraint | undefined = undefined;
  let constrainedX = targetX;
  let constrainedZ = targetZ;
  const allowFreeMovement = false; // Never allow free movement

  // Only check for transitions if not already transitioning
  if (!isCurrentlyTransitioning) {
    // Check if wardrobe is close enough to a perpendicular wall to transition
    const closestWall = getClosestWall(targetPosition, roomDimensions);

    // If the closest wall is different from current wall, consider transition
    if (closestWall.wallIndex !== wallConstraint.wallIndex) {
      // Calculate distance to the new wall
      let distanceToNewWall = 0;

      if (closestWall.constrainedAxis === "x") {
        distanceToNewWall = Math.abs(targetX - closestWall.wallPosition);
      } else {
        distanceToNewWall = Math.abs(targetZ - closestWall.wallPosition);
      }

      // If within transition threshold, trigger transition
      if (distanceToNewWall < TRANSITION_THRESHOLD) {
        shouldTransition = true;
        newWallConstraint = closestWall;

        // During transition, allow smoother movement
        // Constrain to new wall immediately
        wallConstraint = closestWall;
      }
    }
  }

  // STRICT WALL CONSTRAINTS: Lock to wall, only allow left/right sliding
  switch (wallConstraint.wallIndex) {
    case 0: // Right wall (X+ wall)
      // LOCK X position to wall - wardrobe CANNOT move away from wall
      // Apply buffer to prevent sinking into wall
      constrainedX =
        wallConstraint.wallPosition -
        (wardrobeDepth / 2 + WALL_CLEARANCE_BUFFER);

      // ONLY allow movement along Z axis (left/right along the wall)
      // Account for perpendicular wall thickness AND clearance buffer
      const maxZ_right =
        roomDimensions.depth / 2 -
        roomDimensions.thickness / 2 -
        wardrobeWidth / 2 -
        WALL_CLEARANCE_BUFFER;
      const minZ_right =
        -roomDimensions.depth / 2 +
        roomDimensions.thickness / 2 +
        wardrobeWidth / 2 +
        WALL_CLEARANCE_BUFFER;
      constrainedZ = Math.max(minZ_right, Math.min(maxZ_right, targetZ));
      break;

    case 1: // Left wall (X- wall)
      // LOCK X position to wall - wardrobe CANNOT move away from wall
      // Apply buffer to prevent sinking into wall
      constrainedX =
        wallConstraint.wallPosition +
        (wardrobeDepth / 2 + WALL_CLEARANCE_BUFFER);

      // ONLY allow movement along Z axis (left/right along the wall)
      // Account for perpendicular wall thickness AND clearance buffer
      const maxZ_left =
        roomDimensions.depth / 2 -
        roomDimensions.thickness / 2 -
        wardrobeWidth / 2 -
        WALL_CLEARANCE_BUFFER;
      const minZ_left =
        -roomDimensions.depth / 2 +
        roomDimensions.thickness / 2 +
        wardrobeWidth / 2 +
        WALL_CLEARANCE_BUFFER;
      constrainedZ = Math.max(minZ_left, Math.min(maxZ_left, targetZ));
      break;

    case 2: // Back wall (Z+ wall)
      // LOCK Z position to wall - wardrobe CANNOT move away from wall
      // Apply buffer to prevent sinking into wall
      constrainedZ =
        wallConstraint.wallPosition -
        (wardrobeDepth / 2 + WALL_CLEARANCE_BUFFER);

      // ONLY allow movement along X axis (left/right along the wall)
      // Account for perpendicular wall thickness AND clearance buffer
      const maxX_back =
        roomDimensions.width / 2 -
        roomDimensions.thickness / 2 -
        wardrobeWidth / 2 -
        WALL_CLEARANCE_BUFFER;
      const minX_back =
        -roomDimensions.width / 2 +
        roomDimensions.thickness / 2 +
        wardrobeWidth / 2 +
        WALL_CLEARANCE_BUFFER;
      constrainedX = Math.max(minX_back, Math.min(maxX_back, targetX));
      break;

    case 3: // Front wall (Z- wall)
      // LOCK Z position to wall - wardrobe CANNOT move away from wall
      // Apply buffer to prevent sinking into wall
      constrainedZ =
        wallConstraint.wallPosition +
        (wardrobeDepth / 2 + WALL_CLEARANCE_BUFFER);

      // ONLY allow movement along X axis (left/right along the wall)
      // Account for perpendicular wall thickness AND clearance buffer
      const maxX_front =
        roomDimensions.width / 2 -
        roomDimensions.thickness / 2 -
        wardrobeWidth / 2 -
        WALL_CLEARANCE_BUFFER;
      const minX_front =
        -roomDimensions.width / 2 +
        roomDimensions.thickness / 2 +
        wardrobeWidth / 2 +
        WALL_CLEARANCE_BUFFER;
      constrainedX = Math.max(minX_front, Math.min(maxX_front, targetX));
      break;
  }

  return {
    position: [constrainedX, targetY, constrainedZ],
    shouldTransition,
    newWallConstraint,
    allowFreeMovement,
  };
}

/**
 * Handles wall transition when drag ends - snaps to the new wall
 */
export function handleWallTransition(
  instance: WardrobeInstance,
  _newWallConstraint: WallConstraint,
  roomDimensions: RoomDimensions
): { position: [number, number, number]; rotation: number } {
  const tempInstance = { ...instance };
  tempInstance.position = instance.position;

  return snapToWall(tempInstance, roomDimensions);
}

/**
 * Checks if a wardrobe model requires wall attachment (only traditional wardrobe)
 */
export function requiresWallAttachment(modelPath: string): boolean {
  return (
    modelPath === "components/W-01684" ||
    modelPath === "components/W-01685" ||
    modelPath === "components/W-01686" ||
    modelPath === "components/w-04140" ||
    modelPath === "components/w-04141" ||
    modelPath === "components/w-04142" ||
    modelPath === "components/w-04143" ||
    modelPath === "components/w-04144" ||
    modelPath === "components/w-04145" ||
    modelPath === "components/W-01685-bundle-A" ||
    modelPath === "components/W-01685-bundle-B" ||
    modelPath === "components/W-01685-bundle-C"
  ); // Only traditional wardrobe
}

/**
 * Checks if a wardrobe model requires corner placement (only L-shaped wardrobe)
 */
export function requiresCornerPlacement(modelPath: string): boolean {
  return modelPath === "components/W-01687"; // Only L-shaped wardrobe
}

export type CornerConstraint = {
  cornerIndex: number; // 0: front-left, 1: front-right, 2: back-right, 3: back-left
  position: [number, number, number];
  rotation: number; // Y-axis rotation in radians
  isValid: boolean;
};

/**
 * Gets all 4 corner positions for L-shaped wardrobes
 */
export function getCornerPositions(
  roomDimensions: RoomDimensions,
  wardrobeWidth: number,
  wardrobeDepth: number
): CornerConstraint[] {
  const { width, depth, thickness } = roomDimensions;
  const halfWidth = width * 0.5;
  const halfDepth = depth * 0.5;
  const halfThickness = thickness * 0.5;

  // Calculate offset from walls (wardrobe center should be offset by half its dimensions)
  const xOffset = wardrobeWidth / 2 - halfThickness;
  const zOffset = wardrobeDepth / 2 - halfThickness;

  // model provided has offset
  const modelOffset = 0.1;
  return [
    {
      cornerIndex: 0,
      position: [
        -halfWidth + xOffset,
        0.05,
        -halfDepth + zOffset + modelOffset,
      ], // Front-left
      rotation: Math.PI * 1.5, // 270 degree Facing inward
      isValid: true,
    },
    {
      cornerIndex: 1,
      position: [halfWidth - xOffset - modelOffset, 0.05, -halfDepth + zOffset], // Front-right
      rotation: Math.PI, // 180 degrees
      isValid: true,
    },
    {
      cornerIndex: 2,
      position: [halfWidth - xOffset, 0.05, halfDepth - zOffset - modelOffset], // Back-right
      rotation: Math.PI * 0.5, // 90 degrees
      isValid: true,
    },
    {
      cornerIndex: 3,
      position: [-halfWidth + xOffset + modelOffset, 0.05, halfDepth - zOffset], // Back-left
      rotation: Math.PI * 2, // 360 degrees
      isValid: true,
    },
  ];
}

/**
 * Check if a specific corner is available for L-shaped wardrobes
 */
export function isCornerAvailable(
  corner: CornerConstraint,
  instance: WardrobeInstance,
  existingInstances: WardrobeInstance[]
): boolean {
  // Create a temporary instance at this corner to check for collisions
  const tempInstance: WardrobeInstance = {
    ...instance,
    position: corner.position,
    rotation: corner.rotation,
  };

  // Check if this corner position would collide with existing wardrobes
  const tempBoundingBox = getWardrobeBoundingBox(tempInstance);

  for (const existing of existingInstances) {
    if (existing.id === instance.id) continue; // Skip self

    const existingBox = getWardrobeBoundingBox(existing);

    if (boundingBoxesIntersect(tempBoundingBox, existingBox, 0.1)) {
      return false; // Has collision
    }
  }

  return true; // No collision, corner is available
}

/**
 * Finds the closest available corner for L-shaped wardrobes
 */
export function findAvailableCorner(
  instance: WardrobeInstance,
  roomDimensions: RoomDimensions,
  existingInstances: WardrobeInstance[]
): CornerConstraint | null {
  const product = instance.product;
  const wardrobeWidth = product.width / 100; // Convert cm to R3F units
  const wardrobeDepth = product.depth / 100; // Convert cm to R3F units

  const corners = getCornerPositions(
    roomDimensions,
    wardrobeWidth,
    wardrobeDepth
  );

  // Check each corner for availability
  for (const corner of corners) {
    if (isCornerAvailable(corner, instance, existingInstances)) {
      return corner;
    }
  }

  return null; // No available corner found
}

/**
 * Snaps an L-shaped wardrobe to the closest available corner
 */
export function snapToCorner(
  instance: WardrobeInstance,
  roomDimensions: RoomDimensions,
  existingInstances: WardrobeInstance[] = []
): { position: [number, number, number]; rotation: number } | null {
  const availableCorner = findAvailableCorner(
    instance,
    roomDimensions,
    existingInstances
  );

  if (!availableCorner) {
    return null; // No corner available
  }

  return {
    position: availableCorner.position,
    rotation: availableCorner.rotation,
  };
}
