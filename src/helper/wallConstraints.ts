import * as THREE from "three";
import { WardrobeInstance } from "../types";
import { getWardrobeBoundingBox } from "./wardrobePlacement";

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
  const [x, y, z] = position;
  const { width, depth, thickness } = roomDimensions;

  const halfWidth = width / 2;
  const halfDepth = depth / 2;

  // Calculate distances to each wall
  const distanceToRight = Math.abs(x - halfWidth);
  const distanceToLeft = Math.abs(x + halfWidth);
  const distanceToBack = Math.abs(z - halfDepth);
  const distanceToFront = Math.abs(z + halfDepth);

  const distances = [
    {
      wall: 0,
      distance: distanceToRight,
      normal: new THREE.Vector3(-1, 0, 0),
      axis: "x" as const,
      pos: halfWidth - thickness / 2,
      rotation: Math.PI / 2, // Right wall - face left toward center
    },
    {
      wall: 1,
      distance: distanceToLeft,
      normal: new THREE.Vector3(1, 0, 0),
      axis: "x" as const,
      pos: -halfWidth + thickness / 2,
      rotation: -Math.PI / 2, // Left wall - face right toward center
    },
    {
      wall: 2,
      distance: distanceToBack,
      normal: new THREE.Vector3(0, 0, -1),
      axis: "z" as const,
      pos: halfDepth - thickness / 2,
      rotation: 0, // Back wall - face forward toward center
    },
    {
      wall: 3,
      distance: distanceToFront,
      normal: new THREE.Vector3(0, 0, 1),
      axis: "z" as const,
      pos: -halfDepth + thickness / 2,
      rotation: Math.PI, // Front wall - face backward toward center
    },
  ];

  // Find the closest wall
  const closest = distances.reduce((min, current) =>
    current.distance < min.distance ? current : min
  );

  return {
    wallIndex: closest.wall,
    wallNormal: closest.normal,
    constrainedAxis: closest.axis,
    wallPosition: closest.pos,
    rotation: closest.rotation,
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
  const wardrobeWidth = product.width / 100; // Convert cm to R3F units
  const wardrobeDepth = product.depth / 100; // Convert cm to R3F units

  let newX = x;
  let newZ = z;

  // Calculate position based on wall and rotation
  // The wardrobe back should be against the wall, front facing center
  switch (wallConstraint.wallIndex) {
    case 0: // Right wall - wardrobe faces left (rotation = π/2)
      newX = wallConstraint.wallPosition - wardrobeDepth / 2;
      break;
    case 1: // Left wall - wardrobe faces right (rotation = -π/2)
      newX = wallConstraint.wallPosition + wardrobeDepth / 2;
      break;
    case 2: // Back wall - wardrobe faces forward (rotation = π)
      newZ = wallConstraint.wallPosition - wardrobeDepth / 2;
      break;
    case 3: // Front wall - wardrobe faces backward (rotation = 0)
      newZ = wallConstraint.wallPosition + wardrobeDepth / 2;
      break;
  }

  return {
    position: [newX, y, newZ],
    rotation: wallConstraint.rotation,
  };
}

/**
 * Constrains movement along a wall for wall-attached wardrobes
 * Returns both the constrained position and whether a wall transition should occur
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
  const boundingBox = getWardrobeBoundingBox(instance);
  const wardrobeWidth = boundingBox.maxX - boundingBox.minX;
  const wardrobeDepth = boundingBox.maxZ - boundingBox.minZ;

  // Different thresholds for starting vs continuing transition (hysteresis)
  const startTransitionThreshold = 0.5; // Larger threshold to start transition
  const continueTransitionThreshold = 0.2; // Smaller threshold to continue
  const transitionThreshold = isCurrentlyTransitioning
    ? continueTransitionThreshold
    : startTransitionThreshold;

  let constrainedX = targetX;
  let constrainedZ = targetZ;
  let shouldTransition = isCurrentlyTransitioning;
  let allowFreeMovement = false;
  let newWallConstraint: WallConstraint | undefined;

  // Calculate distance from current wall and check for transitions
  switch (wallConstraint.wallIndex) {
    case 0: // Right wall
      const rightWallDistance = Math.abs(
        targetX - (wallConstraint.wallPosition - wardrobeDepth / 2)
      );

      if (rightWallDistance > transitionThreshold) {
        // Check if moving toward another wall
        const newConstraint = getClosestWall(targetPosition, roomDimensions);
        if (newConstraint.wallIndex !== wallConstraint.wallIndex) {
          shouldTransition = true;
          newWallConstraint = newConstraint;
          allowFreeMovement = true;
          // Allow free movement during transition with gentle constraints
          constrainedX = targetX;
          constrainedZ = targetZ;
        } else {
          // Still closest to right wall but far from it, allow gradual movement back
          shouldTransition = false;
          const pullBackFactor = Math.min(
            rightWallDistance / startTransitionThreshold,
            1
          );
          constrainedX =
            wallConstraint.wallPosition -
            wardrobeDepth / 2 +
            (targetX - (wallConstraint.wallPosition - wardrobeDepth / 2)) *
              pullBackFactor *
              0.3;
        }
      } else {
        // Stay against right wall
        shouldTransition = false;
        constrainedX = wallConstraint.wallPosition - wardrobeDepth / 2;
      }

      if (!allowFreeMovement) {
        // Allow movement along Z axis with bounds checking
        const maxZ_right = roomDimensions.depth / 2 - wardrobeWidth / 2;
        const minZ_right = -roomDimensions.depth / 2 + wardrobeWidth / 2;
        constrainedZ = Math.max(minZ_right, Math.min(maxZ_right, targetZ));
      }
      break;

    case 1: // Left wall
      const leftWallDistance = Math.abs(
        targetX - (wallConstraint.wallPosition + wardrobeDepth / 2)
      );

      if (leftWallDistance > transitionThreshold) {
        const newConstraint = getClosestWall(targetPosition, roomDimensions);
        if (newConstraint.wallIndex !== wallConstraint.wallIndex) {
          shouldTransition = true;
          newWallConstraint = newConstraint;
          allowFreeMovement = true;
          constrainedX = targetX;
          constrainedZ = targetZ;
        } else {
          shouldTransition = false;
          const pullBackFactor = Math.min(
            leftWallDistance / startTransitionThreshold,
            1
          );
          constrainedX =
            wallConstraint.wallPosition +
            wardrobeDepth / 2 +
            (targetX - (wallConstraint.wallPosition + wardrobeDepth / 2)) *
              pullBackFactor *
              0.3;
        }
      } else {
        shouldTransition = false;
        constrainedX = wallConstraint.wallPosition + wardrobeDepth / 2;
      }

      if (!allowFreeMovement) {
        const maxZ_left = roomDimensions.depth / 2 - wardrobeWidth / 2;
        const minZ_left = -roomDimensions.depth / 2 + wardrobeWidth / 2;
        constrainedZ = Math.max(minZ_left, Math.min(maxZ_left, targetZ));
      }
      break;

    case 2: // Back wall
      const backWallDistance = Math.abs(
        targetZ - (wallConstraint.wallPosition - wardrobeDepth / 2)
      );

      if (backWallDistance > transitionThreshold) {
        const newConstraint = getClosestWall(targetPosition, roomDimensions);
        if (newConstraint.wallIndex !== wallConstraint.wallIndex) {
          shouldTransition = true;
          newWallConstraint = newConstraint;
          allowFreeMovement = true;
          constrainedX = targetX;
          constrainedZ = targetZ;
        } else {
          shouldTransition = false;
          const pullBackFactor = Math.min(
            backWallDistance / startTransitionThreshold,
            1
          );
          constrainedZ =
            wallConstraint.wallPosition -
            wardrobeDepth / 2 +
            (targetZ - (wallConstraint.wallPosition - wardrobeDepth / 2)) *
              pullBackFactor *
              0.3;
        }
      } else {
        shouldTransition = false;
        constrainedZ = wallConstraint.wallPosition - wardrobeDepth / 2;
      }

      if (!allowFreeMovement) {
        const maxX_back = roomDimensions.width / 2 - wardrobeWidth / 2;
        const minX_back = -roomDimensions.width / 2 + wardrobeWidth / 2;
        constrainedX = Math.max(minX_back, Math.min(maxX_back, targetX));
      }
      break;

    case 3: // Front wall
      const frontWallDistance = Math.abs(
        targetZ - (wallConstraint.wallPosition + wardrobeDepth / 2)
      );

      if (frontWallDistance > transitionThreshold) {
        const newConstraint = getClosestWall(targetPosition, roomDimensions);
        if (newConstraint.wallIndex !== wallConstraint.wallIndex) {
          shouldTransition = true;
          newWallConstraint = newConstraint;
          allowFreeMovement = true;
          constrainedX = targetX;
          constrainedZ = targetZ;
        } else {
          shouldTransition = false;
          const pullBackFactor = Math.min(
            frontWallDistance / startTransitionThreshold,
            1
          );
          constrainedZ =
            wallConstraint.wallPosition +
            wardrobeDepth / 2 +
            (targetZ - (wallConstraint.wallPosition + wardrobeDepth / 2)) *
              pullBackFactor *
              0.3;
        }
      } else {
        shouldTransition = false;
        constrainedZ = wallConstraint.wallPosition + wardrobeDepth / 2;
      }

      if (!allowFreeMovement) {
        const maxX_front = roomDimensions.width / 2 - wardrobeWidth / 2;
        const minX_front = -roomDimensions.width / 2 + wardrobeWidth / 2;
        constrainedX = Math.max(minX_front, Math.min(maxX_front, targetX));
      }
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
  newWallConstraint: WallConstraint,
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
  return modelPath === "components/W-01684"; // Only traditional wardrobe
}
