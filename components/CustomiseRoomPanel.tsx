import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PencilRuler, Check } from "lucide-react";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";

const CustomiseRoomPanel = () => {
  const customizeMode = useStore((state) => state.customizeMode);
  const setCustomizeMode = useStore((state) => state.setCustomizeMode);

  const handleCustomizeClick = useCallback(() => {
    setCustomizeMode(!customizeMode);
  }, [customizeMode, setCustomizeMode]);

  return (
    <div className="absolute bottom-[50px] left-[35%] -translate-x-1/2 z-[90] flex gap-4 pointer-events-auto">
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
    </div>
  );
};

export default CustomiseRoomPanel;
