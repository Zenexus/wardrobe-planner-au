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
import CustomiseRoomPanel from "@/components/CustomiseRoomPanel";
import WallMeasurements from "@/components/WallMeasurements";
import WardrobeMeasurements from "@/components/WardrobeMeasurements";
import FocusedWardrobePanel from "./FocusedWardrobePanel";

interface DraggableObjectProps {
  position: [number, number, number];
  color?: string;
  id: string;
  objectRefs: MutableRefObject<{ [key: string]: THREE.Object3D }>;
  children?: ReactNode;
  scale?: [number, number, number];
  onPositionChange?: (
    id: string,
    newPosition: [number, number, number]
  ) => void;
  setFocusedWardrobeInstance?: (instance: WardrobeInstance | null) => void;
  wardrobeInstances?: WardrobeInstance[];
}

const DraggableObject: React.FC<DraggableObjectProps> = ({
  position,
  color = "#ffffff",
  id,
  objectRefs,
  children,
  scale = [1, 1, 1],
  onPositionChange,
  setFocusedWardrobeInstance,
  wardrobeInstances,
}) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const childRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
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
        const targetPosition = new THREE.Vector3(
          intersectionPoint.current.x - dragOffset.x,
          rigidBodyRef.current.translation().y, // Keep same Y
          intersectionPoint.current.z - dragOffset.z
        );

        // Get current position
        const currentPos = rigidBodyRef.current.translation();
        const direction = new THREE.Vector3(
          targetPosition.x - currentPos.x,
          0,
          targetPosition.z - currentPos.z
        );

        // Use distance to determine if we should move directly or use velocity
        const distance = direction.length();

        if (distance > 0.1) {
          // For larger distances, use velocity-based movement
          const maxMoveSpeed = 12;
          const moveSpeed = Math.max(distance * 14, maxMoveSpeed);

          direction.normalize();
          rigidBodyRef.current.setLinvel(
            {
              x: direction.x * moveSpeed,
              y: 0,
              z: direction.z * moveSpeed,
            },
            true
          );
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

        // Real-time position update during drag for measurements
        if (onPositionChange && !wasClick) {
          const currentPosition = rigidBodyRef.current.translation();
          onPositionChange(id, [
            currentPosition.x,
            currentPosition.y,
            currentPosition.z,
          ]);
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
      wasClick,
    ]
  );

  const handlePointerUp = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!isDragging || !rigidBodyRef.current) return;

      event.stopPropagation();
      setIsDragging(false);
      setGlobalHasDragging(false);
      setDraggedObjectId(null);

      // Completely stop all movement immediately
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

      // Set very high damping temporarily to prevent any residual movement
      rigidBodyRef.current.setLinearDamping(20);
      rigidBodyRef.current.setAngularDamping(20);

      // After a short delay, restore normal physics properties
      setTimeout(() => {
        if (rigidBodyRef.current) {
          rigidBodyRef.current.setGravityScale(1, true);
          rigidBodyRef.current.setLinearDamping(0.1);
          rigidBodyRef.current.setAngularDamping(0.1);
        }
      }, 100);

      // Final position update (optional since we update during drag)
      // This ensures we have the exact final position even if there's any physics settling
      if (onPositionChange && !wasClick) {
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
                color={isDragging ? "#ff6b6b" : color}
                transparent
                opacity={isDragging ? 0.8 : 1.0}
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
    setDraggedObjectId,
    selectedObjectId,
    setSelectedObjectId,
    customizeMode,
    wardrobeInstances,
    updateWardrobePosition,
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

  // Handle camera controls change - separate from the main effect
  const handleControlsChange = useCallback(() => {
    if (customizeMode || isTransitioning) return;

    const wallsToHide = detectClosestWalls(camera, wallsForDetection);
    setHiddenWalls(wallsToHide);
  }, [camera, wallsForDetection, customizeMode, isTransitioning]);

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
            visibleEdgeColor={0x0000ff}
            hiddenEdgeColor={0x0000ff}
            edgeStrength={10}
          />
        </EffectComposer>

        {/* Dynamically added wardrobe objects */}
        {wardrobeInstances.map((instance) => (
          <DraggableObject
            key={instance.id}
            id={instance.id}
            position={instance.position}
            objectRefs={objectRefs}
            scale={[1, 1, 1]} // Use real wardrobe scale - wardrobes should handle their own scaling
            onPositionChange={(id, newPosition) => {
              updateWardrobePosition(id, newPosition);
            }}
            setFocusedWardrobeInstance={setFocusedWardrobeInstance}
            wardrobeInstances={wardrobeInstances}
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
