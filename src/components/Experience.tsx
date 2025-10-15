import React, {
  useRef,
  useState,
  useCallback,
  MutableRefObject,
  ReactNode,
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
} from "react";
import { useThree, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import { EffectComposer, Outline } from "@react-three/postprocessing";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { useStore } from "../store";
import { cmToR3F } from "../utils/scaling";
import { RapierRigidBody } from "@react-three/rapier";
import { WardrobeInstance } from "../types";
import { shouldTriggerSheetOnClickOnly } from "../constants/wardrobeConfig";
import FloorRenderer from "./FloorRenderer";
import { WallPaper, Ceiling } from "./WallPaper";
import { detectClosestWalls, Wall } from "../helper/closestWallDetector";
// Core Wardrobe Range Components
import { ClassicWardrobe } from "./W-01684";
import { Model as W01685 } from "./W-01685";
import { Model as W01686 } from "./W-01686";
import { ModernWardrobe as W01687 } from "./W-01687";
// Bundle Models
import { Model as W01685BundleA } from "./W-01685-bundle-A";
import { Model as W01685BundleB } from "./W-01685-bundle-B";
import { Model as W01685BundleC } from "./W-01685-bundle-C";
// 400mm Wardrobe Range Components
import { Model as W04140 } from "./w-04140";
import { Model as W04141 } from "./w-04141";
import { Model as W04142 } from "./w-04142";
import { Model as W04143 } from "./w-04143";
import { Model as W04144 } from "./w-04144";
import { Model as W04145 } from "./w-04145";
// Test fixtures
import { Model as WindowModel } from "./Window";
import { Model as DoorModel } from "./Door";
import { Model as TreeModel } from "./Tree";
import { Model as CabinetModel } from "./Cabinet";

import GroupedWardrobeMeasurements from "@/components/GroupedWardrobeMeasurements";
import {
  getClosestWall,
  constrainMovementAlongWall,
  handleWallTransition,
  requiresWallAttachment,
  requiresCornerPlacement,
  getCornerPositions,
  findAvailableCorner,
  isCornerAvailable,
  WallConstraint,
  CornerConstraint,
  RoomDimensions as WallRoomDimensions,
} from "../helper/wallConstraints";

interface DraggableObjectProps {
  position: [number, number, number];
  rotation?: number;
  color?: string;
  id: string;
  objectRefs: MutableRefObject<{ [key: string]: THREE.Object3D }>;
  children?: ReactNode;
  scale?: [number, number, number];
  onPositionChange?: (
    id: string,
    newPosition: [number, number, number]
  ) => void;
  onRotationChange?: (id: string, newRotation: number) => void;
  setFocusedWardrobeInstance?: (instance: WardrobeInstance | null) => void;
  wardrobeInstances?: WardrobeInstance[];
  modelPath?: string;
  roomDimensions?: WallRoomDimensions;
  customizeMode?: boolean;
}

const DraggableObject: React.FC<DraggableObjectProps> = ({
  position,
  rotation = 0,
  color = "#ffffff",
  id,
  objectRefs,
  children,
  scale = [1, 1, 1],
  onPositionChange,
  onRotationChange,
  setFocusedWardrobeInstance,
  wardrobeInstances,
  modelPath,
  roomDimensions,
  customizeMode = false,
}) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const childRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [lastReportedPosition, setLastReportedPosition] = useState<
    [number, number, number] | null
  >(null);
  const {
    setGlobalHasDragging,
    draggedObjectId,
    setDraggedObjectId,
    selectedObjectId,
    setSelectedObjectId,
  } = useStore();
  const [dragOffset, setDragOffset] = useState<THREE.Vector3>(
    new THREE.Vector3()
  );
  const { camera, gl } = useThree();

  // Raycaster setup
  const raycaster = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouse = useRef<THREE.Vector2>(new THREE.Vector2());
  const dragPlane = useRef<THREE.Plane>(
    new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  );
  const intersectionPoint = useRef<THREE.Vector3>(new THREE.Vector3());

  // Track mouse movement for drag detection
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [wasClick, setWasClick] = useState<boolean>(true);
  const [mouseDownTime, setMouseDownTime] = useState<number>(0);

  // Wall constraint state
  const [wallConstraint, setWallConstraint] = useState<WallConstraint | null>(
    null
  );
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [currentRotation, setCurrentRotation] = useState<number>(rotation);
  const isWallConstrained =
    modelPath && requiresWallAttachment(modelPath) && roomDimensions;
  const isCornerConstrained =
    modelPath && requiresCornerPlacement(modelPath) && roomDimensions;

  // Snapping state to prevent flip-flopping
  const [snappedToWardrobeId, setSnappedToWardrobeId] = useState<string | null>(
    null
  );
  const [isCurrentlySnapped, setIsCurrentlySnapped] = useState<boolean>(false);

  // Initialize wall constraint for traditional wardrobes
  useEffect(() => {
    if (isWallConstrained && roomDimensions) {
      const constraint = getClosestWall(position, roomDimensions);
      setWallConstraint(constraint);
    }
  }, [isWallConstrained, position, roomDimensions]);

  // Sync rotation prop with internal state
  useEffect(() => {
    setCurrentRotation(rotation);
  }, [rotation]);

  // CRITICAL: Re-enforce wall constraints when rigid body type changes
  // This prevents sinking when grabbing or releasing the wardrobe
  useEffect(() => {
    if (
      !rigidBodyRef.current ||
      !isWallConstrained ||
      !wallConstraint ||
      !roomDimensions ||
      !wardrobeInstances
    )
      return;

    const currentInstance = wardrobeInstances.find((w) => w.id === id);
    if (!currentInstance) return;

    // Get current position from rigid body
    const currentPos = rigidBodyRef.current.translation();

    // Apply wall constraints with buffer
    const constraintResult = constrainMovementAlongWall(
      [currentPos.x, currentPos.y, currentPos.z],
      wallConstraint,
      currentInstance,
      roomDimensions,
      false
    );

    // Immediately set the constrained position to prevent sinking
    rigidBodyRef.current.setTranslation(
      {
        x: constraintResult.position[0],
        y: constraintResult.position[1],
        z: constraintResult.position[2],
      },
      true
    );
  }, [
    draggedObjectId,
    isWallConstrained,
    wallConstraint,
    roomDimensions,
    wardrobeInstances,
    id,
  ]); // Re-run when drag state changes

  const handlePointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      // Disable all interactions when in customize mode
      if (customizeMode || !rigidBodyRef.current || !meshRef.current) return;

      event.stopPropagation();
      setIsDragging(true);
      setGlobalHasDragging(true);
      setDraggedObjectId(id);

      // Track mouse position for click detection
      setMouseDownPos({
        x: event.nativeEvent.clientX,
        y: event.nativeEvent.clientY,
      });
      setWasClick(true);
      setMouseDownTime(Date.now());
      setLastReportedPosition(null);

      // Convert mouse coordinates to normalized device coordinates
      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x =
        ((event.nativeEvent.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y =
        -((event.nativeEvent.clientY - rect.top) / rect.height) * 2 + 1;

      // Set up raycaster
      raycaster.current.setFromCamera(mouse.current, camera);

      // Get object's current position
      const currentPos = rigidBodyRef.current.translation();

      // First, try to intersect with the actual mesh to get precise click point
      // 🔥 CHANGE 1: Enhanced intersection detection for narrow objects
      const intersects = raycaster.current.intersectObject(
        meshRef.current,
        true
      );

      if (intersects.length > 0) {
        // Use the actual intersection point on the mesh
        const clickPoint = intersects[0].point;

        // Set drag plane at the click point's Y position for more accuracy
        dragPlane.current.constant = -clickPoint.y;

        // Calculate precise offset from click point to object center
        setDragOffset(
          new THREE.Vector3(
            clickPoint.x - currentPos.x,
            0,
            clickPoint.z - currentPos.z
          )
        );
      } else {
        // Fallback to the old method if mesh intersection fails
        dragPlane.current.constant = -currentPos.y;
        setDragOffset(new THREE.Vector3(0, 0, 0)); // CHANGE: No offset for narrow objects instead of calculating intersection
      }

      // Keep in dynamic mode but disable gravity temporarily and add high damping
      rigidBodyRef.current.setGravityScale(10, true);
      rigidBodyRef.current.setLinearDamping(10);
      rigidBodyRef.current.setAngularDamping(10);

      // Prevent orbit controls from interfering
      gl.domElement.style.cursor = "grabbing";
    },
    [
      camera,
      gl.domElement,
      id,
      setDraggedObjectId,
      setGlobalHasDragging,
      customizeMode,
    ]
  );

  const handlePointerMove = useCallback(
    (event: MouseEvent | TouchEvent) => {
      // Disable dragging when in customize mode
      if (customizeMode || !isDragging || !rigidBodyRef.current) return;

      event.stopPropagation();

      const clientX =
        "clientX" in event ? event.clientX : event.touches[0].clientX;
      const clientY =
        "clientY" in event ? event.clientY : event.touches[0].clientY;

      // Check if mouse moved enough to be considered dragging
      const deltaX = Math.abs(clientX - mouseDownPos.x);
      const deltaY = Math.abs(clientY - mouseDownPos.y);
      if (deltaX > 5 || deltaY > 5) {
        setWasClick(false);
        // Select the object when dragging actually starts
        if (selectedObjectId !== id) {
          setSelectedObjectId(id);
          // Also set focused wardrobe instance if this is a wardrobe
          // BUT only if it's not a click-only sheet trigger wardrobe
          if (wardrobeInstances && setFocusedWardrobeInstance) {
            const wardrobeInstance = wardrobeInstances.find((w) => w.id === id);
            if (wardrobeInstance) {
              // Check if this wardrobe should only trigger sheet on click, not drag
              if (
                !shouldTriggerSheetOnClickOnly(
                  wardrobeInstance.product.itemNumber
                )
              ) {
                setFocusedWardrobeInstance(wardrobeInstance);
              }
            }
          }
        }
      }

      // Convert mouse coordinates
      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      // Update raycaster
      raycaster.current.setFromCamera(mouse.current, camera);

      // Find intersection with drag plane - use more robust approach
      const tempIntersection = new THREE.Vector3();
      const intersected = raycaster.current.ray.intersectPlane(
        dragPlane.current,
        tempIntersection
      );

      if (intersected) {
        // Direct intersection - use it immediately for precise control
        intersectionPoint.current.copy(tempIntersection);
      } else {
        // No direct intersection - project ray onto floor plane at Y=0 for better fallback
        const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const floorIntersection = new THREE.Vector3();
        if (
          raycaster.current.ray.intersectPlane(floorPlane, floorIntersection)
        ) {
          intersectionPoint.current.copy(floorIntersection);
        }
        // If both fail, keep last valid position (very rare edge case)
      }

      // Calculate target position with direct offset
      // This ensures fast, responsive movement
      let targetPosition = new THREE.Vector3(
        intersectionPoint.current.x - dragOffset.x,
        rigidBodyRef.current.translation().y, // Keep same Y
        intersectionPoint.current.z - dragOffset.z
      );

      // Apply STRICT wall constraints for traditional wardrobes
      // Wardrobes are locked to their wall and can only slide left/right
      if (
        isWallConstrained &&
        wallConstraint &&
        roomDimensions &&
        wardrobeInstances
      ) {
        const currentInstance = wardrobeInstances.find((w) => w.id === id);
        if (currentInstance) {
          const constraintResult = constrainMovementAlongWall(
            [targetPosition.x, targetPosition.y, targetPosition.z],
            wallConstraint,
            currentInstance,
            roomDimensions,
            isTransitioning
          );

          // Apply the strictly constrained position
          // (No transitions allowed - wardrobe stays locked to its wall)
          targetPosition.set(
            constraintResult.position[0],
            constraintResult.position[1],
            constraintResult.position[2]
          );

          // SNAPPING: Check for nearby wardrobes on the same wall and snap if within 20cm
          // Use hysteresis: smaller distance to snap, larger distance to un-snap
          const SNAP_ENGAGE_DISTANCE = 0.2; // 20cm - distance to engage snap
          const SNAP_RELEASE_DISTANCE = 0.45; // 35cm - distance to release snap (hysteresis)
          const otherWardrobes = wardrobeInstances.filter((w) => w.id !== id);

          let closestSnapPosition: number | null = null;
          let closestSnapWardrobeId: string | null = null;
          let minSnapDistance = Infinity;
          const isVerticalWall =
            wallConstraint.wallIndex === 0 || wallConstraint.wallIndex === 1;

          for (const other of otherWardrobes) {
            // Check if the other wardrobe is on the same wall
            const otherWallConstraint = getClosestWall(
              other.position,
              roomDimensions
            );

            if (otherWallConstraint.wallIndex === wallConstraint.wallIndex) {
              // Same wall - check distance along the sliding axis
              const currentWidth = currentInstance.product.width / 100;
              const otherWidth = other.product.width / 100;

              if (isVerticalWall) {
                // Sliding along Z-axis
                const currentZ = targetPosition.z;
                const otherZ = other.position[2];

                // Calculate snap positions (left and right edges of the other wardrobe)
                const snapToLeft = otherZ - otherWidth / 2 - currentWidth / 2;
                const snapToRight = otherZ + otherWidth / 2 + currentWidth / 2;

                // Check distance to left edge
                const distToLeft = Math.abs(currentZ - snapToLeft);
                if (distToLeft < minSnapDistance) {
                  minSnapDistance = distToLeft;
                  closestSnapPosition = snapToLeft;
                  closestSnapWardrobeId = other.id;
                }

                // Check distance to right edge
                const distToRight = Math.abs(currentZ - snapToRight);
                if (distToRight < minSnapDistance) {
                  minSnapDistance = distToRight;
                  closestSnapPosition = snapToRight;
                  closestSnapWardrobeId = other.id;
                }
              } else {
                // Sliding along X-axis
                const currentX = targetPosition.x;
                const otherX = other.position[0];

                // Calculate snap positions (left and right edges of the other wardrobe)
                const snapToLeft = otherX - otherWidth / 2 - currentWidth / 2;
                const snapToRight = otherX + otherWidth / 2 + currentWidth / 2;

                // Check distance to left edge
                const distToLeft = Math.abs(currentX - snapToLeft);
                if (distToLeft < minSnapDistance) {
                  minSnapDistance = distToLeft;
                  closestSnapPosition = snapToLeft;
                  closestSnapWardrobeId = other.id;
                }

                // Check distance to right edge
                const distToRight = Math.abs(currentX - snapToRight);
                if (distToRight < minSnapDistance) {
                  minSnapDistance = distToRight;
                  closestSnapPosition = snapToRight;
                  closestSnapWardrobeId = other.id;
                }
              }
            }
          }

          // Hysteresis logic to prevent flip-flopping
          let shouldSnap = false;

          if (isCurrentlySnapped && snappedToWardrobeId) {
            // Currently snapped - only release if we move far enough away
            if (closestSnapWardrobeId === snappedToWardrobeId) {
              // Still near the same wardrobe
              if (minSnapDistance < SNAP_RELEASE_DISTANCE) {
                shouldSnap = true; // Stay snapped
              } else {
                // Moved far enough away - release snap
                setSnappedToWardrobeId(null);
                setIsCurrentlySnapped(false);
              }
            } else {
              // Different wardrobe is closer
              if (minSnapDistance < SNAP_ENGAGE_DISTANCE) {
                // Close enough to new wardrobe - switch snap
                shouldSnap = true;
                setSnappedToWardrobeId(closestSnapWardrobeId);
              } else {
                // Not close enough to any - release snap
                setSnappedToWardrobeId(null);
                setIsCurrentlySnapped(false);
              }
            }
          } else {
            // Not currently snapped - engage if close enough
            if (minSnapDistance < SNAP_ENGAGE_DISTANCE) {
              shouldSnap = true;
              setSnappedToWardrobeId(closestSnapWardrobeId);
              setIsCurrentlySnapped(true);
            }
          }

          // Apply snapping if conditions are met
          if (shouldSnap && closestSnapPosition !== null) {
            if (isVerticalWall) {
              targetPosition.z = closestSnapPosition;
            } else {
              targetPosition.x = closestSnapPosition;
            }
          }
        }
      }

      // SNAPPING for L-shaped wardrobes: Snap to nearby corner wardrobes during drag
      if (isCornerConstrained && roomDimensions && wardrobeInstances) {
        const currentInstance = wardrobeInstances.find((w) => w.id === id);
        if (currentInstance) {
          // Use hysteresis for L-shaped wardrobes too
          const SNAP_ENGAGE_DISTANCE = 0.3; // 30cm - slightly larger for corner wardrobes
          const SNAP_RELEASE_DISTANCE = 0.5; // 50cm - distance to release snap

          // Find other corner-constrained wardrobes
          const otherCornerWardrobes = wardrobeInstances.filter(
            (w) => w.id !== id && requiresCornerPlacement(w.product.model)
          );

          let closestSnapPosition: [number, number, number] | null = null;
          let closestSnapWardrobeId: string | null = null;
          let minSnapDistance = Infinity;

          // Check distance to each other corner wardrobe
          for (const other of otherCornerWardrobes) {
            const dx = targetPosition.x - other.position[0];
            const dz = targetPosition.z - other.position[2];
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance < minSnapDistance) {
              minSnapDistance = distance;
              // Calculate snap position near the other wardrobe
              // Snap to a position offset by the combined dimensions
              const currentWidth = currentInstance.product.width / 100;
              const currentDepth = currentInstance.product.depth / 100;
              const otherWidth = other.product.width / 100;
              const otherDepth = other.product.depth / 100;

              // Determine snap direction based on relative position
              // Snap to the edge that's closest
              const offsetDist =
                Math.max(currentWidth, currentDepth) / 2 +
                Math.max(otherWidth, otherDepth) / 2 +
                0.1;

              // Calculate normalized direction
              const dirX = dx / distance;
              const dirZ = dz / distance;

              // Snap position: place current wardrobe offset from other wardrobe
              closestSnapPosition = [
                other.position[0] + dirX * offsetDist,
                targetPosition.y,
                other.position[2] + dirZ * offsetDist,
              ];
              closestSnapWardrobeId = other.id;
            }
          }

          // Hysteresis logic for corner wardrobes
          let shouldSnap = false;

          if (isCurrentlySnapped && snappedToWardrobeId) {
            // Currently snapped - only release if we move far enough away
            if (closestSnapWardrobeId === snappedToWardrobeId) {
              // Still near the same wardrobe
              if (minSnapDistance < SNAP_RELEASE_DISTANCE) {
                shouldSnap = true; // Stay snapped
              } else {
                // Moved far enough away - release snap
                setSnappedToWardrobeId(null);
                setIsCurrentlySnapped(false);
              }
            } else {
              // Different wardrobe is closer
              if (minSnapDistance < SNAP_ENGAGE_DISTANCE) {
                // Close enough to new wardrobe - switch snap
                shouldSnap = true;
                setSnappedToWardrobeId(closestSnapWardrobeId);
              } else {
                // Not close enough to any - release snap
                setSnappedToWardrobeId(null);
                setIsCurrentlySnapped(false);
              }
            }
          } else {
            // Not currently snapped - engage if close enough
            if (minSnapDistance < SNAP_ENGAGE_DISTANCE) {
              shouldSnap = true;
              setSnappedToWardrobeId(closestSnapWardrobeId);
              setIsCurrentlySnapped(true);
            }
          }

          // Apply snapping if conditions are met
          if (shouldSnap && closestSnapPosition !== null) {
            targetPosition.set(
              closestSnapPosition[0],
              closestSnapPosition[1],
              closestSnapPosition[2]
            );
          }
        }
      }

      // Get current position
      const currentPos = rigidBodyRef.current.translation();
      const direction = new THREE.Vector3(
        targetPosition.x - currentPos.x,
        0,
        targetPosition.z - currentPos.z
      );

      // Use distance to determine if we should move directly or use velocity
      const distance = direction.length();

      // Adjust movement speed based on constraint type
      let moveSpeedMultiplier = 1;
      let dampingFactor = 1;

      if (isWallConstrained) {
        // Wall-constrained wardrobes: MUCH faster sliding along the wall for better UX
        // Since they can only move in one direction, higher speed is safe and feels responsive
        moveSpeedMultiplier = 1.3; // default is 2.5, I think 2.5 is too fast
        dampingFactor = 0.3; // Lower damping for snappier response, default is 0.5
      } else if (isCornerConstrained) {
        // For L-shaped wardrobes, use faster movement to snap quickly to corners
        moveSpeedMultiplier = 1.3;
        dampingFactor = 0.3; // Higher damping for quicker settling
      }

      if (distance > 0.1) {
        // For larger distances, use velocity-based movement
        const baseMoveSpeed = 12 * moveSpeedMultiplier;
        const moveSpeed = Math.max(
          distance * 14 * moveSpeedMultiplier,
          baseMoveSpeed
        );

        direction.normalize();
        rigidBodyRef.current.setLinvel(
          {
            x: direction.x * moveSpeed,
            y: 0,
            z: direction.z * moveSpeed,
          },
          true
        );

        // Apply damping based on constraint type
        if (dampingFactor !== 1) {
          rigidBodyRef.current.setLinearDamping(10 * dampingFactor);
        }
      } else {
        // For very small distances, move directly for precision
        rigidBodyRef.current.setTranslation(
          {
            x: targetPosition.x,
            y: currentPos.y,
            z: targetPosition.z,
          },
          true
        );
        // Stop any residual movement
        rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      }

      // Real-time position update during drag for measurements (with threshold)
      if (onPositionChange && !wasClick) {
        const currentPosition = rigidBodyRef.current.translation();
        // Avoid spamming updates if the movement is extremely small frame-to-frame
        setLastReportedPosition((prev) => {
          const threshold = 0.005; // ~5mm in R3F units if meters
          if (
            !prev ||
            Math.abs(prev[0] - currentPosition.x) > threshold ||
            Math.abs(prev[1] - currentPosition.y) > threshold ||
            Math.abs(prev[2] - currentPosition.z) > threshold
          ) {
            onPositionChange(id, [
              currentPosition.x,
              currentPosition.y,
              currentPosition.z,
            ]);
            return [
              currentPosition.x,
              currentPosition.y,
              currentPosition.z,
            ] as [number, number, number];
          }
          return prev;
        });
      }
    },
    [
      isDragging,
      mouseDownPos.x,
      mouseDownPos.y,
      gl.domElement,
      camera,
      dragOffset.x,
      dragOffset.z,
      selectedObjectId,
      setSelectedObjectId,
      id,
      onPositionChange,
      onRotationChange,
      wasClick,
      isWallConstrained,
      wallConstraint,
      roomDimensions,
      wardrobeInstances,
      isTransitioning,
      setIsTransitioning,
      customizeMode,
    ]
  );

  const handlePointerUp = useCallback(
    (event: MouseEvent | TouchEvent) => {
      // Allow pointer up to reset state even in customize mode, but don't process interactions
      if (!isDragging || !rigidBodyRef.current) return;

      event.stopPropagation();
      setIsDragging(false);
      setGlobalHasDragging(false);
      setDraggedObjectId(null);
      setLastReportedPosition(null);

      // Reset snapping state when drag ends
      setSnappedToWardrobeId(null);
      setIsCurrentlySnapped(false);

      // Completely stop all movement immediately
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

      // Set very high damping temporarily to prevent any residual movement
      rigidBodyRef.current.setLinearDamping(20);
      rigidBodyRef.current.setAngularDamping(20);

      // Handle transition completion more smoothly
      setTimeout(() => {
        if (isTransitioning) {
          setIsTransitioning(false);
        }
      }, 50); // Small delay to ensure smooth transition

      // After a short delay, restore normal physics properties
      setTimeout(() => {
        if (rigidBodyRef.current) {
          rigidBodyRef.current.setGravityScale(1, true);
          rigidBodyRef.current.setLinearDamping(0.1);
          rigidBodyRef.current.setAngularDamping(0.1);
        }
      }, 100);

      // Handle wall snapping for traditional wardrobes when drag ends
      if (
        isWallConstrained &&
        wallConstraint &&
        roomDimensions &&
        wardrobeInstances &&
        !wasClick
      ) {
        const currentInstance = wardrobeInstances.find((w) => w.id === id);
        if (currentInstance) {
          const currentPos = rigidBodyRef.current.translation();
          const snapResult = handleWallTransition(
            {
              ...currentInstance,
              position: [currentPos.x, currentPos.y, currentPos.z],
            },
            wallConstraint,
            roomDimensions
          );

          // Apply the snapped position and rotation
          rigidBodyRef.current.setTranslation(
            {
              x: snapResult.position[0],
              y: snapResult.position[1],
              z: snapResult.position[2],
            },
            true
          );

          // Update rotation
          setCurrentRotation(snapResult.rotation);
          if (onRotationChange) {
            onRotationChange(id, snapResult.rotation);
          }

          if (onPositionChange) {
            onPositionChange(id, snapResult.position);
          }
        }
      }
      // Handle corner snapping for L-shaped wardrobes when drag ends
      else if (
        isCornerConstrained &&
        roomDimensions &&
        wardrobeInstances &&
        !wasClick
      ) {
        const currentInstance = wardrobeInstances.find((w) => w.id === id);
        if (currentInstance) {
          const currentPos = rigidBodyRef.current.translation();
          const otherInstances = wardrobeInstances.filter((w) => w.id !== id);

          // Get all corner positions
          const wardrobeWidth = currentInstance.product.width / 100;
          const wardrobeDepth = currentInstance.product.depth / 100;
          const corners = getCornerPositions(
            roomDimensions,
            wardrobeWidth,
            wardrobeDepth
          );

          // Find the corner closest to current wardrobe position (where it was dragged to)
          let closestCorner: CornerConstraint | null = null;
          let minDistance = Infinity;

          for (const corner of corners) {
            const distance = Math.sqrt(
              Math.pow(currentPos.x - corner.position[0], 2) +
                Math.pow(currentPos.z - corner.position[2], 2)
            );

            if (distance < minDistance) {
              minDistance = distance;
              closestCorner = corner;
            }
          }

          if (
            closestCorner &&
            isCornerAvailable(closestCorner, currentInstance, otherInstances)
          ) {
            // Apply the closest corner position and rotation
            rigidBodyRef.current.setTranslation(
              {
                x: closestCorner.position[0],
                y: closestCorner.position[1],
                z: closestCorner.position[2],
              },
              true
            );

            // Update rotation to match the corner
            setCurrentRotation(closestCorner.rotation);
            if (onRotationChange) {
              onRotationChange(id, closestCorner.rotation);
            }

            if (onPositionChange) {
              onPositionChange(id, closestCorner.position);
            }
          } else {
            // If closest corner is not available, find any available corner as fallback
            const availableCorner = findAvailableCorner(
              currentInstance,
              roomDimensions,
              otherInstances
            );

            if (availableCorner) {
              rigidBodyRef.current.setTranslation(
                {
                  x: availableCorner.position[0],
                  y: availableCorner.position[1],
                  z: availableCorner.position[2],
                },
                true
              );

              setCurrentRotation(availableCorner.rotation);
              if (onRotationChange) {
                onRotationChange(id, availableCorner.rotation);
              }

              if (onPositionChange) {
                onPositionChange(id, availableCorner.position);
              }
            } else {
              // If no corner is available, keep current position but still update store
              if (onPositionChange) {
                onPositionChange(id, [
                  currentPos.x,
                  currentPos.y,
                  currentPos.z,
                ]);
              }
            }
          }
        }
      } else if (onPositionChange && !wasClick) {
        // Final position update for non-wall-constrained objects
        const finalPosition = rigidBodyRef.current.translation();
        onPositionChange(id, [
          finalPosition.x,
          finalPosition.y,
          finalPosition.z,
        ]);
      }

      // Handle selection/deselection on click (not drag)
      // Use both wasClick flag and time-based detection for better reliability
      const clickDuration = Date.now() - mouseDownTime;
      const wasActualClick = wasClick && clickDuration < 300; // Click should be under 300ms

      if (wasActualClick) {
        const isCurrentlySelected = selectedObjectId === id;

        if (isCurrentlySelected) {
          // If already selected, deselect and unfocus
          setSelectedObjectId(null);
          if (setFocusedWardrobeInstance) {
            setFocusedWardrobeInstance(null);
          }
        } else {
          // If not selected, select and focus
          setSelectedObjectId(id);
          // Find the wardrobe instance for this id
          if (wardrobeInstances && setFocusedWardrobeInstance) {
            const wardrobeInstance = wardrobeInstances.find((w) => w.id === id);
            if (wardrobeInstance) {
              setFocusedWardrobeInstance(wardrobeInstance);
            }
          }
        }
      }

      gl.domElement.style.cursor = "auto";
    },
    [
      isDragging,
      setGlobalHasDragging,
      setDraggedObjectId,
      wasClick,
      mouseDownTime,
      gl.domElement.style,
      setSelectedObjectId,
      selectedObjectId,
      id,
      onPositionChange,
      setFocusedWardrobeInstance,
      wardrobeInstances,
      isWallConstrained,
      wallConstraint,
      roomDimensions,
      isTransitioning,
      setIsTransitioning,
      onRotationChange,
      currentRotation,
    ]
  );

  // Add global event listeners for mouse move and up when dragging
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMove = (e: MouseEvent | TouchEvent) =>
        handlePointerMove(e);
      const handleGlobalUp = (e: MouseEvent | TouchEvent) => handlePointerUp(e);

      document.addEventListener("mousemove", handleGlobalMove);
      document.addEventListener("mouseup", handleGlobalUp);
      document.addEventListener("touchmove", handleGlobalMove);
      document.addEventListener("touchend", handleGlobalUp);

      return () => {
        document.removeEventListener("mousemove", handleGlobalMove);
        document.removeEventListener("mouseup", handleGlobalUp);
        document.removeEventListener("touchmove", handleGlobalMove);
        document.removeEventListener("touchend", handleGlobalUp);
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Register the appropriate ref in objectRefs
  useEffect(() => {
    // If we have children with a ref, use that ref for outline
    if (objectRefs) {
      if (childRef.current) {
        objectRefs.current[id] = childRef.current;
      } else if (meshRef.current) {
        objectRefs.current[id] = meshRef.current;
      }
    }

    return () => {
      if (objectRefs) {
        delete objectRefs.current[id];
      }
    };
  }, [id, objectRefs]);

  // Determine the body type based on dragging state
  const bodyType = draggedObjectId === id ? "dynamic" : "kinematicPosition";

  // Clone the child element and add our ref
  const childWithRef =
    children && isValidElement(children)
      ? //@ts-ignore
        cloneElement(children, { ref: childRef })
      : children;

  return (
    <>
      <RigidBody
        ref={rigidBodyRef}
        position={position}
        rotation={[0, currentRotation, 0]}
        colliders="cuboid"
        type={bodyType}
        restitution={0.3}
        friction={0.8}
        ccd={true}
        lockRotations={true}
        collisionGroups={isWallConstrained ? 0x00040006 : 0x00020007}
        // Wall-constrained (bit 2): collides with groups 1,2 but NOT walls (bit 0)
        // Normal wardrobes (bit 1): collides with walls (bit 0), and other wardrobes (bits 1,2)
      >
        <mesh
          castShadow
          receiveShadow
          ref={meshRef}
          scale={scale}
          onPointerDown={handlePointerDown}
          onClick={(event) => {
            // Handle click selection as backup if child components don't handle it
            // Disable click interactions when in customize mode
            if (customizeMode) return;

            if (!isDragging && wasClick) {
              event.stopPropagation();

              const isCurrentlySelected = selectedObjectId === id;

              if (isCurrentlySelected) {
                // If already selected, deselect and unfocus
                setSelectedObjectId(null);
                if (setFocusedWardrobeInstance) {
                  setFocusedWardrobeInstance(null);
                }
              } else {
                // If not selected, select and focus
                setSelectedObjectId(id);
                // Find the wardrobe instance for this id
                if (wardrobeInstances && setFocusedWardrobeInstance) {
                  const wardrobeInstance = wardrobeInstances.find(
                    (w) => w.id === id
                  );
                  if (wardrobeInstance) {
                    setFocusedWardrobeInstance(wardrobeInstance);
                  }
                }
              }
            }
          }}
          onPointerOver={() =>
            !isDragging &&
            !customizeMode &&
            (gl.domElement.style.cursor = "grab")
          }
          onPointerOut={() =>
            !isDragging &&
            !customizeMode &&
            (gl.domElement.style.cursor = "auto")
          }
        >
          {children ? (
            childWithRef
          ) : (
            <>
              <boxGeometry />
              <meshStandardMaterial
                color={
                  isDragging
                    ? isTransitioning && isWallConstrained
                      ? "#ffaa00" // Orange when transitioning between walls
                      : "#ff6b6b" // Red when normally dragging
                    : color
                }
                transparent
                opacity={
                  isDragging
                    ? isTransitioning && isWallConstrained
                      ? 0.6 // More transparent during wall transition
                      : 0.8
                    : 1.0
                }
              />
            </>
          )}
        </mesh>
      </RigidBody>
    </>
  );
};

const Experience: React.FC = () => {
  const {
    globalHasDragging,
    setGlobalHasDragging,
    draggedObjectId,
    setDraggedObjectId,
    selectedObjectId,
    setSelectedObjectId,
    customizeMode,
    wardrobeInstances,
    updateWardrobePosition,
    updateWardrobeRotation,
    focusedWardrobeInstance,
    setFocusedWardrobeInstance,
  } = useStore();

  // Store refs for all draggable objects
  const objectRefs = useRef<{ [key: string]: THREE.Object3D }>({});

  // State for hidden walls
  const [hiddenWalls, setHiddenWalls] = useState<number[]>([]);

  // State for camera transitions
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // Note: Wardrobe objects are now managed in the store as wardrobeInstances

  // Get camera reference
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  // Animation function for smooth camera transitions
  const animateCamera = useCallback(
    (
      targetPosition: THREE.Vector3,
      targetLookAt: THREE.Vector3,
      duration: number = 1000,
      onComplete?: () => void
    ) => {
      // Start transition
      setIsTransitioning(true);

      const startPosition = camera.position.clone();
      const startLookAt = new THREE.Vector3();

      // Get current lookAt from controls if available, otherwise default to origin
      if (controlsRef.current && controlsRef.current.target) {
        startLookAt.copy(controlsRef.current.target);
      } else {
        startLookAt.set(0, 0, 0);
      }

      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-in-out)
        const easeInOut = (t: number) =>
          t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const easedProgress = easeInOut(progress);

        // Interpolate position
        camera.position.lerpVectors(
          startPosition,
          targetPosition,
          easedProgress
        );

        // Interpolate lookAt target
        const currentLookAt = new THREE.Vector3().lerpVectors(
          startLookAt,
          targetLookAt,
          easedProgress
        );
        camera.lookAt(currentLookAt);

        // Update controls if available
        if (controlsRef.current) {
          controlsRef.current.target.copy(currentLookAt);
          controlsRef.current.update();
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // End transition
          setIsTransitioning(false);
          if (onComplete) {
            onComplete();
          }
        }
      };

      animate();
    },
    [camera]
  );

  // Effect to handle camera position when customizeMode changes
  useEffect(() => {
    if (customizeMode && controlsRef.current) {
      // Smooth transition to top view
      const topPosition = new THREE.Vector3(0, 25, 0);
      const topLookAt = new THREE.Vector3(0, 0, 0);

      animateCamera(topPosition, topLookAt, 1200, () => {
        // Always show all walls in customize mode after animation completes
        setHiddenWalls([]);
      });
    } else if (controlsRef.current) {
      // Smooth transition back to default view
      //FIXME: modify the camera position and lookAt position
      const defaultPosition = new THREE.Vector3(0, 5.5, -6);
      const defaultLookAt = new THREE.Vector3(0, 0, 0);

      animateCamera(defaultPosition, defaultLookAt, 1200);
    }
  }, [customizeMode, camera, animateCamera]);

  // Calculate room dimensions and wall positions from store
  const { wallsDimensions } = useStore();

  const roomDimensions = useMemo(() => {
    const roomWidth = wallsDimensions.front.length; // Front wall length = room width
    const roomDepth = wallsDimensions.left.length; // Left wall length = room depth
    const roomHeight = wallsDimensions.front.height; // Wall height
    const wallThickness = wallsDimensions.front.depth; // Wall thickness

    // Convert to R3F units
    const width = cmToR3F(roomWidth);
    const depth = cmToR3F(roomDepth);
    const height = cmToR3F(roomHeight);
    const thickness = cmToR3F(wallThickness);

    return {
      width,
      depth,
      height,
      thickness,
      roomWidth,
      roomDepth,
      roomHeight,
    };
  }, [wallsDimensions]);

  // Calculate wall positions and sizes
  const wallConfigs = useMemo(() => {
    const { width, depth, height, thickness } = roomDimensions;
    const halfWidth = width / 2;
    const halfDepth = depth / 2;
    const halfHeight = height / 2;

    return {
      right: {
        position: [halfWidth, halfHeight, 0] as [number, number, number],
        args: [thickness, height, depth] as [number, number, number],
      },
      left: {
        position: [-halfWidth, halfHeight, 0] as [number, number, number],
        args: [thickness, height, depth] as [number, number, number],
      },
      back: {
        position: [0, halfHeight, halfDepth] as [number, number, number],
        args: [width, height, thickness] as [number, number, number],
      },
      front: {
        position: [0, halfHeight, -halfDepth] as [number, number, number],
        args: [width, height, thickness] as [number, number, number],
      },
    };
  }, [roomDimensions]);

  // Create walls array for detection (matches the detectClosestWalls interface)
  const wallsForDetection = useMemo(() => {
    return [
      {
        position: wallConfigs.right.position,
        args: wallConfigs.right.args,
      },
      {
        position: wallConfigs.left.position,
        args: wallConfigs.left.args,
      },
      {
        position: wallConfigs.back.position,
        args: wallConfigs.back.args,
      },
      {
        position: wallConfigs.front.position,
        args: wallConfigs.front.args,
      },
    ];
  }, [wallConfigs]);

  // Handle background clicks to deselect objects
  const handleBackgroundClick = useCallback(() => {
    // Always reset selection and dragging state when clicking background
    setSelectedObjectId(null);
    setFocusedWardrobeInstance(null);

    // Ensure dragging state is properly reset (in case it wasn't reset properly)
    if (globalHasDragging) {
      setGlobalHasDragging(false);
    }

    // Also reset dragged object ID (in case it wasn't reset properly)
    setDraggedObjectId(null);
  }, [
    globalHasDragging,
    setSelectedObjectId,
    setFocusedWardrobeInstance,
    setGlobalHasDragging,
    setDraggedObjectId,
  ]);

  // Helper to avoid unnecessary state updates when hidden walls didn't change
  const arraysContainSameNumbers = useCallback((a: number[], b: number[]) => {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    // Order-insensitive shallow equality
    for (let i = 0; i < a.length; i += 1) {
      if (!b.includes(a[i])) return false;
    }
    return true;
  }, []);

  // Handle camera controls change - separate from the main effect
  const handleControlsChange = useCallback(() => {
    if (customizeMode || isTransitioning) return;

    const nextHidden = detectClosestWalls(camera, wallsForDetection);
    setHiddenWalls((prev) =>
      arraysContainSameNumbers(prev, nextHidden) ? prev : nextHidden
    );
  }, [
    camera,
    wallsForDetection,
    customizeMode,
    isTransitioning,
    arraysContainSameNumbers,
  ]);

  // Set up and clean up controls change event listener
  useEffect(() => {
    // Initial wall visibility update
    if (customizeMode) {
      setHiddenWalls([]);
    } else if (!isTransitioning) {
      handleControlsChange();
    }

    // Add event listener only if not in customize mode, not dragging, and not transitioning
    if (
      !customizeMode &&
      !globalHasDragging &&
      !isTransitioning &&
      controlsRef.current
    ) {
      controlsRef.current.addEventListener("change", handleControlsChange);

      return () => {
        if (controlsRef.current) {
          controlsRef.current.removeEventListener(
            "change",
            handleControlsChange
          );
        }
      };
    }
  }, [customizeMode, handleControlsChange, globalHasDragging, isTransitioning]);

  // Additional effect to ensure event listener is reattached when OrbitControls become available
  useEffect(() => {
    if (
      !customizeMode &&
      !globalHasDragging &&
      !isTransitioning &&
      controlsRef.current
    ) {
      // Small delay to ensure OrbitControls are fully initialized
      const timeoutId = setTimeout(() => {
        if (controlsRef.current) {
          // Remove any existing listener first (to avoid duplicates)
          controlsRef.current.removeEventListener(
            "change",
            handleControlsChange
          );
          // Add the listener
          controlsRef.current.addEventListener("change", handleControlsChange);
        }
      }, 100);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [globalHasDragging, customizeMode, handleControlsChange, isTransitioning]);

  // Note: Wardrobe addition is now handled directly in ProductSelection via store.addWardrobeInstance

  // Helper function to determine which wardrobe component to render
  const getWardrobeComponent = (
    modelPath: string,
    onClick?: (event: any) => void
  ) => {
    // Map model paths to their corresponding React components
    switch (modelPath) {
      // Core Wardrobe Range
      case "components/W-01684":
        return <ClassicWardrobe onClick={onClick} />;
      case "components/W-01685":
        return <W01685 onClick={onClick} />;
      case "components/W-01686":
        return <W01686 onClick={onClick} />;
      case "components/W-01687":
        return <W01687 onClick={onClick} />;

      // Bundle Models
      case "components/W-01685-bundle-A":
        return <W01685BundleA onClick={onClick} />;
      case "components/W-01685-bundle-B":
        return <W01685BundleB onClick={onClick} />;
      case "components/W-01685-bundle-C":
        return <W01685BundleC onClick={onClick} />;

      // 400mm Wardrobe Range
      case "components/w-04140":
        return <W04140 onClick={onClick} />;
      case "components/w-04141":
        return <W04141 onClick={onClick} />;
      case "components/w-04142":
        return <W04142 onClick={onClick} />;
      case "components/w-04143":
        return <W04143 onClick={onClick} />;
      case "components/w-04144":
        return <W04144 onClick={onClick} />;
      case "components/w-04145":
        return <W04145 onClick={onClick} />;

      default:
        return <ClassicWardrobe onClick={onClick} />; // Fallback to a known working component
    }
  };

  return (
    <>
      {/* Invisible background plane to catch clicks on empty space */}
      <mesh
        position={[0, 0, -12]}
        onClick={handleBackgroundClick}
        visible={false}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial />
      </mesh>

      {/* Grid helper for customize mode */}
      {customizeMode && (
        <Grid
          position={[0, 0, 0]}
          args={[96, 96]}
          cellSize={6}
          cellThickness={1}
          cellColor="#c9c7c1"
          sectionSize={0}
          sectionThickness={0}
          followCamera={false}
          infiniteGrid={false}
        />
      )}

      <Physics
        gravity={[0, -9.81, 0]}
        timeStep={1 / 60}
        numSolverIterations={12}
        numAdditionalFrictionIterations={4}
      >
        {/* Floor */}
        <RigidBody type="fixed" position={[0, 0, 0]}>
          {/* Explicit collider that matches floor dimensions */}
          <CuboidCollider
            args={[roomDimensions.width / 2, 0.01, roomDimensions.depth / 2]}
            position={[0, 0, 0]}
          />
          <mesh onClick={handleBackgroundClick}>
            <FloorRenderer />
          </mesh>
        </RigidBody>

        {/* Walls for boundaries */}
        {/* Right wall (index 0) */}
        <RigidBody type="fixed" position={wallConfigs.right.position}>
          {/* Explicit collider that matches wall dimensions */}
          <CuboidCollider
            args={[
              roomDimensions.thickness / 2,
              roomDimensions.height / 2,
              roomDimensions.depth / 2,
            ]}
            position={[0, 0, 0]}
            collisionGroups={0x00010002}
            // Walls (bit 0): only collide with normal wardrobes (bit 1), not wall-constrained (bit 2)
          />
          {!hiddenWalls.includes(0) && (
            <WallPaper position={[0, 0, 0]} args={wallConfigs.right.args} />
          )}
        </RigidBody>

        {/* Left wall (index 1) */}
        <RigidBody type="fixed" position={wallConfigs.left.position}>
          {/* Explicit collider that matches wall dimensions */}
          <CuboidCollider
            args={[
              roomDimensions.thickness / 2,
              roomDimensions.height / 2,
              roomDimensions.depth / 2,
            ]}
            position={[0, 0, 0]}
            collisionGroups={0x00010002}
          />
          {!hiddenWalls.includes(1) && (
            <WallPaper position={[0, 0, 0]} args={wallConfigs.left.args} />
          )}
        </RigidBody>

        {/* Back wall (index 2) */}
        <RigidBody type="fixed" position={wallConfigs.back.position}>
          {/* Explicit collider that matches wall dimensions */}
          <CuboidCollider
            args={[
              roomDimensions.width / 2,
              roomDimensions.height / 2,
              roomDimensions.thickness / 2,
            ]}
            position={[0, 0, 0]}
            collisionGroups={0x00010002}
          />
          {!hiddenWalls.includes(2) && (
            <WallPaper position={[0, 0, 0]} args={wallConfigs.back.args} />
          )}
        </RigidBody>

        {/* Front wall (index 3) */}
        <RigidBody type="fixed" position={wallConfigs.front.position}>
          {/* Explicit collider that matches wall dimensions */}
          <CuboidCollider
            args={[
              roomDimensions.width / 2,
              roomDimensions.height / 2,
              roomDimensions.thickness / 2,
            ]}
            position={[0, 0, 0]}
            collisionGroups={0x00010002}
          />
          {!hiddenWalls.includes(3) && (
            <WallPaper position={[0, 0, 0]} args={wallConfigs.front.args} />
          )}
        </RigidBody>

        {/* Ceiling */}
        <RigidBody type="fixed" position={[0, roomDimensions.height, 0]}>
          {/* Explicit collider that matches ceiling dimensions */}
          <CuboidCollider
            args={[
              roomDimensions.width / 2,
              roomDimensions.thickness / 2,
              roomDimensions.depth / 2,
            ]}
            position={[0, 0, 0]}
          />
          <Ceiling
            position={[0, 0, 0]}
            args={[roomDimensions.width, roomDimensions.depth]}
            camera={camera}
            roomHeight={roomDimensions.height}
          />
        </RigidBody>

        <EffectComposer autoClear={false}>
          <Outline
            selection={
              selectedObjectId && objectRefs.current[selectedObjectId]
                ? (() => {
                    const selection = [objectRefs.current[selectedObjectId]];
                    return selection;
                  })()
                : []
            }
            blur={false}
            visibleEdgeColor={(() => {
              const primaryColor = getComputedStyle(document.documentElement)
                .getPropertyValue("--primary")
                .trim();
              return parseInt(primaryColor.replace("#", ""), 16);
            })()}
            hiddenEdgeColor={(() => {
              const primaryColor = getComputedStyle(document.documentElement)
                .getPropertyValue("--primary")
                .trim();
              return parseInt(primaryColor.replace("#", ""), 16);
            })()}
            edgeStrength={50}
            pulseSpeed={0}
            xRay={true}
          />
        </EffectComposer>

        {/* Dynamically added wardrobe objects */}
        {wardrobeInstances.map((instance) => (
          <DraggableObject
            key={instance.id}
            id={instance.id}
            position={instance.position}
            rotation={instance.rotation || 0}
            objectRefs={objectRefs}
            scale={[1, 1, 1]} // Use real wardrobe scale - wardrobes should handle their own scaling
            onPositionChange={(id, newPosition) => {
              updateWardrobePosition(id, newPosition);
            }}
            onRotationChange={(id, newRotation) => {
              updateWardrobeRotation(id, newRotation);
            }}
            setFocusedWardrobeInstance={setFocusedWardrobeInstance}
            wardrobeInstances={wardrobeInstances}
            modelPath={instance.product.model}
            roomDimensions={roomDimensions}
            customizeMode={customizeMode}
          >
            {getWardrobeComponent(instance.product.model, (event) => {
              // Simple click handler - main logic is now in DraggableObject
              event.stopPropagation();
              // Let the DraggableObject handle the selection logic
            })}
          </DraggableObject>
        ))}

        {/* Grouped Wardrobe measurements - intelligent grouping by wall */}
        <GroupedWardrobeMeasurements wardrobeInstances={wardrobeInstances} />

        {/* Test Models - Window and Door */}
        {/* <RigidBody type="fixed" position={[15, 0, 0]}>
          <WindowModel />
        </RigidBody>

        <RigidBody type="fixed" position={[20, 0, 0]}>
          <DoorModel />
        </RigidBody> */}

        {/* <RigidBody type="fixed" position={[-4, 0, 4]}>
          <TreeModel scale={[0.5, 0.5, 0.5]} />
        </RigidBody> */}

        {/* <RigidBody type="dynamic" position={[0, 1, 0]} scale={[1.5, 1.5, 1.5]}>
          <CabinetModel />
        </RigidBody> */}

        {/* Wall Measurements - only shown in customize mode */}
        {/* <WallMeasurements walls={walls} /> */}
      </Physics>

      {/* ToolPanel and CustomiseRoomPanel moved to Planner.tsx for fixed positioning */}

      {!globalHasDragging && (
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enablePan={true}
          enableZoom={true}
          enableRotate={!customizeMode}
          minPolarAngle={customizeMode ? 0 : 0}
          maxPolarAngle={customizeMode ? 0.1 : Math.PI / 2}
          enableDamping={true}
          dampingFactor={0.05}
          // Reduce click sensitivity to prevent interference
          rotateSpeed={0.5}
          panSpeed={0.8}
          zoomSpeed={0.8}
        />
      )}
    </>
  );
};

export default Experience;
