import { Html } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { Ruler, Trash2, Lightbulb } from "lucide-react";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";

const ToolPanel = () => {
  const {
    customizeMode,
    showWardrobeMeasurements,
    setShowWardrobeMeasurements,
    lightsOn,
    setLightsOn,
    wardrobeInstances,
    clearAllWardrobes,
  } = useStore();

  const handleMeasurementsClick = () => {
    setShowWardrobeMeasurements(!showWardrobeMeasurements);
  };

  const handleToggleLights = () => {
    setLightsOn(!lightsOn);
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

  // Show the tool panel only when not in customize mode
  if (customizeMode) return null;

  return (
    <Html fullscreen prepend style={{ pointerEvents: "none" }}>
      <div className="absolute bottom-[50px] left-[50px] z-[100] flex gap-4 pointer-events-auto">
        {/* Show Measurements Button */}
        <Button
          className={cn(
            "rounded-full flex items-center justify-center p-2 w-[50px] h-[50px] cursor-pointer",
            showWardrobeMeasurements
              ? "bg-black text-white hover:bg-black/80"
              : ""
          )}
          onClick={handleMeasurementsClick}
          variant={showWardrobeMeasurements ? "default" : "outline"}
          title={
            showWardrobeMeasurements ? "Hide measurements" : "Show measurements"
          }
        >
          <Ruler />
        </Button>

        {/* Toggle Lights Button */}
        <Button
          className={cn(
            "rounded-full flex items-center justify-center p-2 w-[50px] h-[50px] cursor-pointer",
            lightsOn ? "bg-black text-white hover:bg-black/80" : ""
          )}
          onClick={handleToggleLights}
          variant={lightsOn ? "default" : "outline"}
          title={lightsOn ? "Turn lights off" : "Turn lights on"}
        >
          <Lightbulb />
        </Button>

        {/* Clear All Wardrobes Button */}
        {wardrobeInstances.length > 0 && (
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

export default ToolPanel;
