import React, { useState, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useDrop } from "react-dnd";
import * as THREE from "three";
import Experience from "@/components/Experience";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store";
import ProductSelection from "@/components/ProductSelection";
import WallHeightSlider from "@/components/WallHeightSlider";
import RoomDimensionSliders from "@/components/RoomDimensionSliders";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Menu, Save, CheckCircle, ArrowLeft } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import WardrobeDetailSheet from "@/components/WardrobeDetailSheet";
import MenuSheetContent from "@/components/MenuSheetContent";
import { useAutoSave } from "@/hooks/useAutoSave";
import {
  saveDesignStateWithSync,
  generateShoppingCart,
  hasSavedDesign,
  loadDesignState,
  clearSavedDesign,
} from "@/utils/memorySystem";
import { generateDesignCode } from "@/utils/generateCode";
import DesignMemoryModal from "@/components/DesignMemoryModal";
import { shouldTriggerSheet } from "@/constants/wardrobeConfig";
import { calculateBundlePrice } from "@/utils/bundlePricing";
import productsData from "@/products.json";

import Lottie from "lottie-react";

// Loading component with Lottie animation
const CanvasLoader = () => {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    // Load the animation data from public folder
    fetch("/loading_animation.json")
      .then((response) => response.json())
      .then((data) => setAnimationData(data))
      .catch((error) => console.error("Error loading animation:", error));
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#f0f0f0]">
      <Lottie
        animationData={animationData}
        className="w-50 h-50"
        loop={true}
        autoplay={true}
      />
    </div>
  );
};

// Helper component to handle raycasting within Canvas context
const DropPositionCalculator = () => {
  const { camera, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)); // Ground plane at y=0

  const calculateDropPosition = (clientX: number, clientY: number) => {
    // Convert screen coordinates to normalized device coordinates
    const rect = gl.domElement.getBoundingClientRect();
    mouse.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    // Set up raycaster
    raycaster.current.setFromCamera(mouse.current, camera);

    // Intersect with ground plane
    const intersectionPoint = new THREE.Vector3();
    const intersects = raycaster.current.ray.intersectPlane(
      plane.current,
      intersectionPoint
    );

    if (intersects) {
      return [intersectionPoint.x, 0, intersectionPoint.z] as [
        number,
        number,
        number
      ];
    }

    return null;
  };

  // Expose the calculation function
  React.useEffect(() => {
    (window as any).calculateDropPosition = calculateDropPosition;
    return () => {
      delete (window as any).calculateDropPosition;
    };
  }, [camera, gl]);

  return null;
};

// Canvas wrapper with external loading state
const CanvasWrapper = ({
  onCloseDetailSheet,
}: {
  onCloseDetailSheet: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const lightsOn = useStore((state) => state.lightsOn);
  const addWardrobeInstance = useStore((state) => state.addWardrobeInstance);
  const updateWardrobeInstance = useStore(
    (state) => state.updateWardrobeInstance
  );
  const focusedWardrobeInstance = useStore(
    (state) => state.focusedWardrobeInstance
  );

  // Set up drop functionality
  const [{ isOver }, drop] = useDrop({
    accept: ["PRODUCT", "BUNDLE"],
    drop: (item: any, monitor) => {
      // Get the drop position from the monitor
      const clientOffset = monitor.getClientOffset();
      let dropPosition: [number, number, number] | undefined = undefined;

      // Calculate 3D position from screen coordinates
      if (clientOffset && (window as any).calculateDropPosition) {
        dropPosition = (window as any).calculateDropPosition(
          clientOffset.x,
          clientOffset.y
        );
      }
      if (item.product) {
        // Handle product drop - always add new wardrobe at drop position
        addWardrobeInstance(item.product, dropPosition, true); // Force exact position
      } else if (item.bundle) {
        // Handle bundle drop - replace focused wardrobe if exists, otherwise add new
        if (focusedWardrobeInstance) {
          // Replace the focused wardrobe with the bundle
          let targetProduct;

          // Handle original wardrobe selection
          if (item.bundle.ItemName === "2583987-Original") {
            const originalProduct = productsData.products.find(
              (p) => p.itemNumber === "2583987"
            );
            if (originalProduct) {
              targetProduct = originalProduct;
            }
          } else {
            // Convert bundle to Product format with calculated price
            const calculatedPrice = calculateBundlePrice(item.bundle);
            targetProduct = {
              itemNumber: item.bundle.ItemName,
              name: item.bundle.name,
              width: focusedWardrobeInstance.product.width, // Keep original dimensions
              height: focusedWardrobeInstance.product.height,
              depth: focusedWardrobeInstance.product.depth,
              color: focusedWardrobeInstance.product.color,
              desc: item.bundle.description,
              intro: item.bundle.intro || item.bundle.description,
              price: calculatedPrice, // Use calculated price
              type: focusedWardrobeInstance.product.type,
              category: focusedWardrobeInstance.product.category,
              thumbnail: item.bundle.thumbnail,
              model: item.bundle.model, // This is the key change - bundle model path
              images: [item.bundle.thumbnail], // Use bundle thumbnail as image
            };
          }

          if (targetProduct) {
            // Replace the current wardrobe with the selected option
            updateWardrobeInstance(focusedWardrobeInstance.id, {
              product: targetProduct,
            });

            // Close the detail sheet after successful replacement
            onCloseDetailSheet();
          }
        } else {
          // No focused wardrobe, add as new wardrobe
          const calculatedPrice = calculateBundlePrice(item.bundle);
          const bundleProduct = {
            itemNumber: item.bundle.ItemName,
            name: item.bundle.name,
            width: 60.6, // Default wardrobe dimensions
            height: 200,
            depth: 48,
            color: "White",
            desc: item.bundle.description,
            intro: item.bundle.intro || item.bundle.description,
            price: calculatedPrice,
            type: "normal",
            category: "Core Wardrobe Range",
            thumbnail: item.bundle.thumbnail,
            model: item.bundle.model,
            images: [item.bundle.thumbnail],
          };
          addWardrobeInstance(bundleProduct, dropPosition, true); // Force exact position
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop as any}
      className={`w-7/10 h-screen relative overflow-hidden border-2 border-dashed ${
        isOver ? "bg-primary-500 border-primary" : "border-transparent"
      }`}
    >
      {isLoading && <CanvasLoader />}

      <Canvas
        shadows
        gl={{ preserveDrawingBuffer: true }}
        camera={{ position: [5, 5, 5], fov: 60 }}
        onCreated={() => {
          // Hide loading when Canvas is created and ready
          setTimeout(() => setIsLoading(false), 1000); // Small delay to ensure everything is loaded
        }}
      >
        {/* Main directional light (sun) */}
        <directionalLight
          castShadow
          position={[4, 4, 1]}
          intensity={lightsOn ? 1.5 : 0.2}
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={1}
          shadow-camera-far={50}
          shadow-camera-top={15}
          shadow-camera-right={15}
          shadow-camera-bottom={-15}
          shadow-camera-left={-15}
        />

        {/* Secondary directional light for fill lighting */}
        <directionalLight
          position={[-2, 3, -2]}
          intensity={lightsOn ? 0.8 : 0.1}
          color="#cfe8ff"
        />

        {/* Ambient light for overall illumination */}
        <ambientLight intensity={lightsOn ? 0.4 : 0.08} color="#dbeafe" />

        {/* Moonlight / sky fill for night */}
        <hemisphereLight
          args={["#20304a", "#0f1014"]}
          intensity={lightsOn ? 0 : 0.15}
        />

        {/* Point lights inside the room for wardrobe details */}
        <pointLight
          position={[0, 2, 0]}
          intensity={lightsOn ? 1.2 : 0}
          distance={8}
          decay={1}
          color="#ffffff"
        />

        <pointLight
          position={[1.5, 1.8, 1.5]}
          intensity={lightsOn ? 0.8 : 0}
          distance={6}
          decay={1.5}
          color="#fff8e1"
        />

        <pointLight
          position={[-1.5, 1.8, -1.5]}
          intensity={lightsOn ? 0.8 : 0}
          distance={6}
          decay={1.5}
          color="#fff8e1"
        />

        {/* Spot lights for accent lighting */}
        <spotLight
          position={[2, 3, 2]}
          angle={0.5}
          penumbra={0.5}
          intensity={lightsOn ? 1 : 0}
          distance={10}
          decay={1}
          target-position={[0, 0, 0]}
          color="#ffffff"
        />

        <spotLight
          position={[-2, 3, -2]}
          angle={0.5}
          penumbra={0.5}
          intensity={lightsOn ? 1 : 0}
          distance={10}
          decay={1}
          target-position={[0, 0, 0]}
          color="#ffffff"
        />

        {/* Rim lighting for wardrobe edges */}
        <directionalLight
          position={[0, 1, 4]}
          intensity={lightsOn ? 0.6 : 0.12}
          color="#cfe8ff"
        />

        <directionalLight
          position={[0, 1, -4]}
          intensity={lightsOn ? 0.6 : 0.12}
          color="#cfe8ff"
        />
        <DropPositionCalculator />
        <Experience />
      </Canvas>
    </div>
  );
};

// Auto-save indicator component
const AutoSaveIndicator = () => {
  const [showSaved, setShowSaved] = useState(false);
  const wardrobeInstances = useStore((state) => state.wardrobeInstances);
  const wallsDimensions = useStore((state) => state.wallsDimensions);
  const customizeMode = useStore((state) => state.customizeMode);
  const autoSaveEnabled = useStore((state) => state.autoSaveEnabled);

  useEffect(() => {
    // Only show "saved" indicator if auto-save is enabled and state changes
    if (autoSaveEnabled) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [wardrobeInstances, wallsDimensions, customizeMode, autoSaveEnabled]);

  if (!autoSaveEnabled) {
    return (
      <div className="flex items-center text-xs text-gray-400">
        <Save size={14} className="mr-1" />
        <span>Auto-save disabled</span>
      </div>
    );
  }

  return (
    <div className="flex items-center text-xs text-secondary-foreground">
      {showSaved ? (
        <>
          <CheckCircle size={14} className="mr-1 text-primary" />
          <span className="text-primary">Saved</span>
        </>
      ) : (
        <>
          <Save size={14} className="mr-1" />
          <span>Auto-save enabled</span>
        </>
      )}
    </div>
  );
};

export default function Planner() {
  const { customizeMode, wardrobeInstances } = useStore();
  const setCanvasScreenshotDataUrl = useStore(
    (s) => s.setCanvasScreenshotDataUrl
  );
  const setCurrentDesignCode = useStore((s) => s.setCurrentDesignCode);
  const focusedWardrobeInstance = useStore((s) => s.focusedWardrobeInstance);
  const [disableFinalise, setDisableFinalise] = useState(true);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  // Removed unused state variables: isSaving, saveError
  const navigate = useNavigate();

  // Modal state for saved design
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [isCheckingMemory, setIsCheckingMemory] = useState(true);
  const loadSavedState = useStore((state) => state.loadSavedState);
  const resetToDefaultState = useStore((state) => state.resetToDefaultState);
  const setAutoSaveEnabled = useStore((state) => state.setAutoSaveEnabled);

  // Enable auto-save for this component
  useAutoSave();

  // Check for saved design on planner page load
  useEffect(() => {
    const checkForSavedDesign = async () => {
      try {
        const hasSaved = hasSavedDesign();

        if (hasSaved) {
          setShowMemoryModal(true);
        } else {
          // No saved design, start with default state
          resetToDefaultState();
          // Enable auto-save immediately since there's no conflict
          setAutoSaveEnabled(true);
        }
      } catch (error) {
        resetToDefaultState();
      } finally {
        setIsCheckingMemory(false);
      }
    };

    checkForSavedDesign();
  }, [resetToDefaultState, setAutoSaveEnabled]);

  const handleResumeDesign = () => {
    const savedState = loadDesignState();

    if (savedState) {
      const success = loadSavedState(savedState);
      if (success) {
        // Enable auto-save after successful load
        setTimeout(() => {
          setAutoSaveEnabled(true);
        }, 2000); // Wait 2 seconds before enabling auto-save
      } else {
        resetToDefaultState();
        setAutoSaveEnabled(true);
      }
    } else {
      resetToDefaultState();
      setAutoSaveEnabled(true);
    }
    setShowMemoryModal(false);
  };

  const handleNewDesign = () => {
    resetToDefaultState();
    // Optionally clear the saved design
    clearSavedDesign();
    // Enable auto-save immediately for new designs
    setAutoSaveEnabled(true);
    setShowMemoryModal(false);
  };

  const handleCloseModal = () => {
    // If user closes modal without choosing, default to new design
    handleNewDesign();
  };

  // Calculate total price
  const totalPrice = wardrobeInstances.reduce((sum, instance) => {
    return sum + instance.product.price;
  }, 0);

  useEffect(() => {
    if (wardrobeInstances.length > 0) {
      setDisableFinalise(false);
    }
    if (customizeMode) {
      setDisableFinalise(true);
    }
  }, [wardrobeInstances, customizeMode]);

  // Auto open/close detail sheet when focus changes (only for specific wardrobe types)
  useEffect(() => {
    if (
      focusedWardrobeInstance &&
      shouldTriggerSheet(focusedWardrobeInstance.product.itemNumber)
    ) {
      setIsDetailOpen(true);
    } else {
      setIsDetailOpen(false);
    }
  }, [focusedWardrobeInstance]);

  const handleFinaliseClick = async () => {
    try {
      const canvas = document.querySelector("canvas");
      const dataUrl = canvas?.toDataURL("image/png");
      if (dataUrl) {
        setCanvasScreenshotDataUrl(dataUrl);
      }
    } catch (e) {
      // ignore capture failures
    }

    // Save current design to DB with a generated design code
    try {
      const designCode = generateDesignCode();
      setCurrentDesignCode(designCode);
      const { shoppingCart, totalPrice } =
        generateShoppingCart(wardrobeInstances);

      await saveDesignStateWithSync({
        designId: designCode,
        designData: {
          wardrobeInstances,
          wallsDimensions: useStore.getState().wallsDimensions,
          customizeMode: useStore.getState().customizeMode,
          selectedColor: useStore.getState().selectedColor,
          depthTab: useStore.getState().depthTab,
        },
        shoppingCart,
        totalPrice,
      });
    } catch (err) {
      console.error("Failed to save design:", err);
    } finally {
      // Design saved, navigate to summary
    }

    navigate("/addon-organisors");
  };

  // Intercept attempts to leave the page to offer saving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // If there is content, offer to save via our dialog. Note: browsers restrict custom dialogs on unload.
      if (wardrobeInstances.length > 0) {
        e.preventDefault();
        e.returnValue = ""; // Triggers native confirm; our custom dialog won't show here.
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [wardrobeInstances.length]);

  // Note: Custom modals cannot be shown on browser/tab close; a native prompt will appear.

  // Show loading state while checking for saved design
  if (isCheckingMemory) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-border">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DesignMemoryModal
        isOpen={showMemoryModal}
        onClose={handleCloseModal}
        onNewDesign={handleNewDesign}
        onResumeDesign={handleResumeDesign}
      />
      <div className="flex w-full h-screen overflow-hidden">
        <CanvasWrapper onCloseDetailSheet={() => setIsDetailOpen(false)} />

        {/* Leave Planner Button - positioned at top left corner */}
        <div className="absolute top-[50px] left-[50px] z-[100] pointer-events-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="rounded-full flex items-center justify-center p-2 w-[50px] h-[50px] cursor-pointer"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Leave Planner</TooltipContent>
          </Tooltip>
        </div>

        <section className="w-3/10 h-screen bg-primary-foreground flex flex-col overflow-hidden">
          <div className="flex justify-end items-center gap-4 px-8 py-2 h-28 shadow-lg flex-shrink-0">
            <div className="flex items-start font-bold">
              <span className="text-lg">$</span>
              <span className="text-4xl">{Math.floor(totalPrice)}</span>
              <span className="text-lg">
                .{(totalPrice % 1).toFixed(2).substring(2)}
              </span>
            </div>
            <Button
              className="h-15 w-40 cursor-pointer text-lg rounded-full flex items-center justify-center"
              disabled={disableFinalise}
              onClick={handleFinaliseClick}
            >
              Finalise
              <ArrowRight />
            </Button>
            <Sheet>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SheetTrigger asChild>
                    <div className="flex items-center justify-center pl-4 cursor-pointer hover:bg-secondary rounded-full p-4">
                      <Menu />
                    </div>
                  </SheetTrigger>
                </TooltipTrigger>
                <TooltipContent>Menu</TooltipContent>
              </Tooltip>
              <SheetContent side="right">
                <MenuSheetContent />
              </SheetContent>
            </Sheet>
          </div>
          <div
            className="flex-1 overflow-y-auto flex flex-col gap-4 py-12 px-8"
            style={{ scrollbarGutter: "stable" }}
          >
            {/* Auto-save indicator */}
            {/* <div className="flex justify-end mb-2">
              <AutoSaveIndicator />
            </div> */}

            {!customizeMode ? (
              <ProductSelection />
            ) : (
              <div className="space-y-8">
                <div className="text-4xl font-bold">Room Design</div>

                {/* Room Dimensions */}
                <div className="space-y-6">
                  <div className="text-xl font-semibold">Room Dimensions</div>
                  <RoomDimensionSliders />
                </div>

                {/* Wall Height */}
                <div className="space-y-4">
                  <div className="text-xl font-semibold">Wall Height</div>
                  <WallHeightSlider />
                </div>
              </div>
            )}
          </div>
          {/* Right-side floating detail sheet that doesn't cover header */}
          <WardrobeDetailSheet
            open={isDetailOpen}
            onOpenChange={setIsDetailOpen}
          />
        </section>
      </div>
    </>
  );
}
