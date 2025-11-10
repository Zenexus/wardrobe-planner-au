import * as THREE from "three";

type Wall = {
  position: [number, number, number];
  args?: [number, number, number];
};

/**
 * Detects the closest wall to the camera and hides it.
 * In top view, no walls are hidden to provide a complete overview.
 *
 * @param {THREE.Camera} camera - The camera object from the scene
 * @param {Wall[]} walls - Array of wall objects, each with position and args properties
 * @returns {number[]} Array of wall indices that should be hidden from rendering
 */
const detectClosestWalls = (camera: THREE.Camera, walls: Wall[]): number[] => {
  if (!camera || !walls || walls.length === 0) return [];

  // Get camera position
  const cameraPosition = new THREE.Vector3();
  camera.getWorldPosition(cameraPosition);

  // Check if camera is in top view
  const isTopView = isInTopView(camera, cameraPosition);

  // In top view, don't hide any walls to show complete room overview
  if (isTopView) {
    return [];
  }

  // Find the closest wall
  let closestWallIndex = 0;
  let closestDistance = Infinity;

  walls.forEach((wall, index) => {
    // Get wall position and calculate distance
    const wallPosition = new THREE.Vector3(...wall.position);
    const distance = cameraPosition.distanceTo(wallPosition);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestWallIndex = index;
    }
  });

  // Hide only the closest wall
  return [closestWallIndex];
};

/**
 * Determines if the camera is in top view (looking down from above)
 * @param {THREE.Camera} camera - The camera object
 * @param {THREE.Vector3} cameraPosition - The camera's world position
 * @returns {boolean} True if camera is in top view
 */
const isInTopView = (
  camera: THREE.Camera,
  cameraPosition: THREE.Vector3
): boolean => {
  // Check if camera is high enough (above y = 15, which is well above room height)
  const isHighEnough = cameraPosition.y > 5;

  // Get camera's look direction
  const lookDirection = new THREE.Vector3();
  camera.getWorldDirection(lookDirection);

  // Check if camera is looking mostly downward (y component should be significantly negative)
  const isLookingDown = lookDirection.y < -0.7; // cos(45°) ≈ 0.7, so this means looking down more than 45°

  return isHighEnough && isLookingDown;
};

export { detectClosestWalls };
export type { Wall };
