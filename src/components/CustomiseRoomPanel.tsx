import { Html } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { PencilRuler, Check, Ruler, Trash2 } from "lucide-react";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";

const CustomiseRoomPanel = () => {
  const {
    customizeMode,
    setCustomizeMode,
    showWardrobeMeasurements,
    setShowWardrobeMeasurements,
    clearAllWardrobes,
    wardrobeInstances,
  } = useStore();

  const handleCustomizeClick = () => {
    setCustomizeMode(!customizeMode);
  };

  const handleMeasurementsClick = () => {
    setShowWardrobeMeasurements(!showWardrobeMeasurements);
  };

  const handleClearAllClick = () => {
    if (wardrobeInstances.length > 0) {
      const confirmed = window.confirm(
        "Are you sure you want to clear all wardrobes? This action cannot be undone."
      );
      if (confirmed) {
        clearAllWardrobes();
      }
    }
  };

  return (
    <Html fullscreen prepend>
      <div className="absolute bottom-[50px] left-1/2 -translate-x-1/2 z-[100] flex gap-4">
        {/* Customize Room Button */}
        <Button
          className={cn(
            "rounded-full flex items-center justify-center gap-3 px-8 py-6 cursor-pointer",
            customizeMode ? "w-[150px]" : "w-[200px]"
          )}
          onClick={handleCustomizeClick}
        >
          {customizeMode ? <Check size={24} /> : <PencilRuler size={24} />}
          {customizeMode ? "Done" : "Customise Room"}
        </Button>

        {/* Show Measurements Button */}
        {!customizeMode && (
          <Button
            className={cn(
              "rounded-full flex items-center justify-center p-2 w-[50px] h-[50px] cursor-pointer",
              showWardrobeMeasurements
                ? "bg-black text-white hover:bg-black/80"
                : ""
            )}
            onClick={handleMeasurementsClick}
            variant={showWardrobeMeasurements ? "default" : "outline"}
          >
            <Ruler />
          </Button>
        )}

        {/* Clear All Wardrobes Button */}
        {!customizeMode && wardrobeInstances.length > 0 && (
          <Button
            className="rounded-full flex items-center justify-center p-2 w-[50px] h-[50px] cursor-pointer text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
            onClick={handleClearAllClick}
            variant="outline"
            title="Clear all wardrobes"
          >
            <Trash2 />
          </Button>
        )}
      </div>
    </Html>
  );
};

export default CustomiseRoomPanel;
