import { Html } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { PencilRuler, Check } from "lucide-react";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";

const CustomiseRoomPanel = () => {
  const { customizeMode, setCustomizeMode } = useStore();

  const handleCustomizeClick = () => {
    setCustomizeMode(!customizeMode);
  };

  return (
    <Html fullscreen prepend style={{ pointerEvents: "none" }}>
      <div className="absolute bottom-[50px] left-1/2 -translate-x-1/2 z-[90] flex gap-4 pointer-events-auto">
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

        {/* Tool controls moved to ToolPanel */}
      </div>
    </Html>
  );
};

export default CustomiseRoomPanel;
