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
import { WoodFloor } from "./WoodFloor";
import { WallPaper, Ceiling } from "./WallPaper";
import { detectClosestWalls, Wall } from "../helper/closestWallDetector";
import { ClassicWardrobe } from "./W-01684";
import { ModernWardrobe } from "./W-01687";
import { BundleWardrobe } from "./W-01685-bundle";
import CustomiseRoomPanel from "@/components/CustomiseRoomPanel";
import ToolPanel from "@/components/ToolPanel";
import WallMeasurements from "@/components/WallMeasurements";
import WardrobeMeasurements from "@/components/WardrobeMeasurements";
import FocusedWardrobePanel from "./FocusedWardrobePanel";
import {
  getClosestWall,
  snapToWall,
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

  const handlePointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (!rigidBodyRef.current || !meshRef.current) return;

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
    [camera, gl.domElement, id, setDraggedObjectId, setGlobalHasDragging]
  );

  const handlePointerMove = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!isDragging || !rigidBodyRef.current) return;

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
          if (wardrobeInstances && setFocusedWardrobeInstance) {
            const wardrobeInstance = wardrobeInstances.find((w) => w.id === id);
            if (wardrobeInstance) {
              setFocusedWardrobeInstance(wardrobeInstance);
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

      // Find intersection with drag plane
      if (
        raycaster.current.ray.intersectPlane(
          dragPlane.current,
          intersectionPoint.current
        )
      ) {
        // Calculate target position more precisely
        let targetPosition = new THREE.Vector3(
          intersectionPoint.current.x - dragOffset.x,
          rigidBodyRef.current.translation().y, // Keep same Y
          intersectionPoint.current.z - dragOffset.z
        );

        // Apply wall constraints for traditional wardrobes
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

            // Update wall constraint if transitioning
            if (
              constraintResult.shouldTransition &&
              constraintResult.newWallConstraint
            ) {
              const wallNames = ["Right", "Left", "Back", "Front"];
              console.log(
                `Starting transition to ${
                  wallNames[constraintResult.newWallConstraint.wallIndex]
                } wall`
              );
              setWallConstraint(constraintResult.newWallConstraint);

              // Update rotation immediately for smooth transition
              const newRotation = constraintResult.newWallConstraint.rotation;
              setCurrentRotation(newRotation);
              if (onRotationChange) {
                onRotationChange(id, newRotation);
              }

              setIsTransitioning(true);
            } else if (isTransitioning && !constraintResult.shouldTransition) {
              // Transition completed, wardrobe is now attached to the new wall
              console.log("Transition completed, wardrobe attached to wall");
              setIsTransitioning(false);
            }

            targetPosition.set(
              constraintResult.position[0],
              constraintResult.position[1],
              constraintResult.position[2]
            );
          }
        }

        // Do not snap L-shaped wardrobes to corners during drag.
        // Let the object follow the cursor; snapping happens on pointer up.
        // (Keep block intentionally empty to preserve free movement.)
        if (isCornerConstrained && roomDimensions && wardrobeInstances) {
          // no-op during drag
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

        // Adjust movement speed based on wall constraint state
        let moveSpeedMultiplier = 1;
        let dampingFactor = 1;

        if (isWallConstrained) {
          if (isTransitioning) {
            // During wall transitions, allow smoother, slower movement
            moveSpeedMultiplier = 0.6;
            dampingFactor = 2;
          } else {
            // When constrained to a wall, allow faster movement along the wall
            moveSpeedMultiplier = 1.2;
          }
        } else if (isCornerConstrained) {
          // For L-shaped wardrobes, use faster movement to snap quickly to corners
          moveSpeedMultiplier = 2.0;
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

          // Apply additional damping during transitions
          if (isTransitioning && isWallConstrained) {
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
    ]
  );

  const handlePointerUp = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!isDragging || !rigidBodyRef.current) return;

      event.stopPropagation();
      setIsDragging(false);
      setGlobalHasDragging(false);
      setDraggedObjectId(null);
      setLastReportedPosition(null);

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

          console.log(
            `Drop: wardrobe at [${currentPos.x.toFixed(
              2
            )}, ${currentPos.z.toFixed(2)}], closest corner: ${
              closestCorner?.cornerIndex
            }`
          );

          if (
            closestCorner &&
            isCornerAvailable(closestCorner, currentInstance, otherInstances)
          ) {
            console.log(
              `Drop: snapping to closest corner ${closestCorner.cornerIndex}`
            );

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
            console.log(`Drop: closest corner not available, finding fallback`);

            const availableCorner = findAvailableCorner(
              currentInstance,
              roomDimensions,
              otherInstances
            );

            if (availableCorner) {
              console.log(
                `Drop: using fallback corner ${availableCorner.cornerIndex}`
              );

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
              console.log(
                `Drop: no corners available, keeping current position`
              );
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
        console.log(`Wardrobe clicked and selected: ${id}`);
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

      // Log wall transition info for debugging
      if (isWallConstrained && wallConstraint) {
        const wallNames = ["Right", "Left", "Back", "Front"];
        console.log(
          `Traditional wardrobe ${
            isTransitioning ? "transitioning to" : "attached to"
          } ${wallNames[wallConstraint.wallIndex]} wall`
        );
      }
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
      >
        <mesh
          castShadow
          receiveShadow
          ref={meshRef}
          scale={scale}
          onPointerDown={handlePointerDown}
          onClick={(event) => {
            // Handle click selection as backup if child components don't handle it
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
            !isDragging && (gl.domElement.style.cursor = "grab")
          }
          onPointerOut={() =>
            !isDragging && (gl.domElement.style.cursor = "auto")
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
      const defaultPosition = new THREE.Vector3(5, 5, 5);
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
    //FIXME: here we need change later on
    // Based on the model path, return the appropriate wardrobe component
    switch (modelPath) {
      case "components/W-01684":
        return <ClassicWardrobe onClick={onClick} />;
      case "components/W-01687":
        return <ModernWardrobe onClick={onClick} />;
      case "components/W-01685-bundle":
        return <BundleWardrobe onClick={onClick} />;
      default:
        console.warn(`Unknown model path: ${modelPath}`);
        return <ModernWardrobe onClick={onClick} />;
    }
  };

  return (
    <>
      {/* Invisible background plane to catch clicks on empty space */}
      <mesh
        position={[0, 0, -15]}
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
            <WoodFloor />
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
              return 0x0000ff; // Blue for regular objects
            })()}
            hiddenEdgeColor={(() => {
              return 0x0000ff; // Blue for regular objects
            })()}
            edgeStrength={10}
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
          >
            {getWardrobeComponent(instance.product.model, (event) => {
              // Simple click handler - main logic is now in DraggableObject
              event.stopPropagation();
              // Let the DraggableObject handle the selection logic
            })}
          </DraggableObject>
        ))}

        {/* Wardrobe measurements - moved outside DraggableObject to avoid ref interference */}
        {wardrobeInstances.map((instance) => (
          <WardrobeMeasurements
            key={`measurements-${instance.id}`}
            wardrobeId={instance.id}
            position={instance.position} // Use absolute position since it's outside DraggableObject
            modelPath={instance.product.model}
          />
        ))}

        {/* Wall Measurements - only shown in customize mode */}
        {/* <WallMeasurements walls={walls} /> */}
      </Physics>

      {focusedWardrobeInstance ? (
        <FocusedWardrobePanel />
      ) : (
        <CustomiseRoomPanel />
      )}

      <ToolPanel />

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
