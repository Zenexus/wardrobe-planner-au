import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import Experience from "@/components/Experience";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store";
import ProductSelection from "@/components/ProductSelection";
import WallHeightSlider from "@/components/WallHeightSlider";
import RoomDimensionSliders from "@/components/RoomDimensionSliders";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Menu, Save, CheckCircle } from "lucide-react";
import { useAutoSave } from "@/hooks/useAutoSave";

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

// Canvas wrapper with external loading state
const CanvasWrapper = () => {
  const [isLoading, setIsLoading] = useState(true);
  const lightsOn = useStore((state) => state.lightsOn);

  return (
    <div className="w-7/10 h-screen relative overflow-hidden">
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
        {/* Enhanced lighting setup */}

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
    <div className="flex items-center text-xs text-gray-500">
      {showSaved ? (
        <>
          <CheckCircle size={14} className="mr-1 text-green-500" />
          <span className="text-green-600">Saved</span>
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

export default function Home() {
  const { customizeMode, wardrobeInstances } = useStore();
  const setCanvasScreenshotDataUrl = useStore(
    (s) => s.setCanvasScreenshotDataUrl
  );
  const [disableFinalise, setDisableFinalise] = useState(true);
  const navigate = useNavigate();

  // Enable auto-save for this component
  useAutoSave();

  // Calculate total price
  const totalPrice = wardrobeInstances.reduce((sum, instance) => {
    return sum + instance.product.price;
  }, 0);

  useEffect(() => {
    if (wardrobeInstances.length > 0) {
      setDisableFinalise(false);
    }
  }, [wardrobeInstances]);

  const handleFinaliseClick = () => {
    try {
      const canvas = document.querySelector("canvas");
      const dataUrl = canvas?.toDataURL("image/png");
      if (dataUrl) {
        setCanvasScreenshotDataUrl(dataUrl);
      }
    } catch (e) {
      // ignore capture failures
    }
    navigate("/summary");
  };

  return (
    <div className="flex w-full h-screen overflow-hidden">
      <CanvasWrapper />
      <section className="w-3/10 h-screen bg-white flex flex-col overflow-hidden">
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
          <div className="flex items-center justify-center pl-4 cursor-pointer hover:bg-gray-200 rounded-full p-4">
            <Menu />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 p-12">
          {/* Auto-save indicator */}
          <div className="flex justify-end mb-2">
            <AutoSaveIndicator />
          </div>

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
      </section>
    </div>
  );
}
