import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import Experience from "@/components/Experience";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store";
import ProductSelection from "@/components/ProductSelection";
import WallHeightSlider from "@/components/WallHeightSlider";
import RoomDimensionSliders from "@/components/RoomDimensionSliders";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Menu } from "lucide-react";

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

  return (
    <div className="w-7/10 relative">
      {isLoading && <CanvasLoader />}
      <Canvas
        shadows
        camera={{ position: [5, 5, 5], fov: 60 }}
        onCreated={() => {
          // Hide loading when Canvas is created and ready
          setTimeout(() => setIsLoading(false), 1000); // Small delay to ensure everything is loaded
        }}
      >
        {/* Basic lighting */}
        <directionalLight
          castShadow
          position={[4, 4, 1]}
          intensity={2}
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={1}
          shadow-camera-far={50}
          shadow-camera-top={15}
          shadow-camera-right={15}
          shadow-camera-bottom={-15}
          shadow-camera-left={-15}
        />
        <ambientLight intensity={1} />
        <Experience />
      </Canvas>
    </div>
  );
};

export default function Home() {
  const { customizeMode, wardrobeInstances } = useStore();
  const [disableFinalise, setDisableFinalise] = useState(true);
  const navigate = useNavigate();

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
    navigate("/summary");
  };

  return (
    <div className="flex w-full h-full">
      <CanvasWrapper />
      <section className="w-3/10 h-full bg-white">
        <div className="flex justify-end items-center gap-4 px-8 py-2 h-28 shadow-lg">
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
        <div className="flex flex-col gap-4 p-12">
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
