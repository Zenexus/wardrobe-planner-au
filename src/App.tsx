import { Canvas } from "@react-three/fiber";
import Experience from "@/components/Experience";
import { Button } from "./components/ui/button";
import { useStore } from "./store";
import ProductSelection from "./components/ProductSelection";
import WallHeightSlider from "./components/WallHeightSlider";
import RoomDimensionSliders from "./components/RoomDimensionSliders";

export default function App() {
  const { customizeMode } = useStore();

  return (
    <div className="flex justify-center items-center w-full h-full">
      <Canvas shadows camera={{ position: [5, 5, 5], fov: 60 }}>
        {/* Basic lighting */}
        <directionalLight
          castShadow
          position={[4, 4, 1]}
          intensity={3}
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={1}
          shadow-camera-far={50}
          shadow-camera-top={15}
          shadow-camera-right={15}
          shadow-camera-bottom={-15}
          shadow-camera-left={-15}
        />
        <ambientLight intensity={1.5} />
        <Experience />
      </Canvas>
      <section className="w-2xl h-full bg-slate-100">
        <div className="flex justify-end items-center gap-4 px-4 py-2 h-20 bg-amber-200">
          <span className="text-4xl font-bold">$126.33</span>
          <Button className="h-12 w-36 cursor-pointer text-2xl">
            Finalise
          </Button>
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
