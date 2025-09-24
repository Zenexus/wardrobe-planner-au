import { Html } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { Ruler, Trash2, Lightbulb, Undo, Redo } from "lucide-react";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import FloorTextureSelector from "./FloorTextureSelector";

const ToolPanel = () => {
  const {
    customizeMode,
    showWardrobeMeasurements,
    setShowWardrobeMeasurements,
    lightsOn,
    setLightsOn,
    wardrobeInstances,
    clearAllWardrobes,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useStore();

  const handleMeasurementsClick = () => {
    setShowWardrobeMeasurements(!showWardrobeMeasurements);
  };

  const handleToggleLights = () => {
    setLightsOn(!lightsOn);
  };

  const handleUndo = () => {
    undo();
  };

  const handleRedo = () => {
    redo();
  };

  // Show the tool panel only when not in customize mode
  if (customizeMode) return null;

  return (
    <Html fullscreen prepend style={{ pointerEvents: "none" }}>
      {/* Floor Texture Selector - positioned above other buttons */}
      <div className="absolute bottom-[120px] left-[50px] z-[100] pointer-events-auto">
        <FloorTextureSelector />
      </div>

      <div className="absolute bottom-[50px] left-[50px] z-[100] flex gap-4 pointer-events-auto">
        {/* Undo Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="rounded-full flex items-center justify-center p-2 w-12 h-12 cursor-pointer"
              onClick={handleUndo}
              disabled={!canUndo()}
              variant="outline"
            >
              <Undo />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo</TooltipContent>
        </Tooltip>

        {/* Redo Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="rounded-full flex items-center justify-center p-2 w-12 h-12 cursor-pointer"
              onClick={handleRedo}
              disabled={!canRedo()}
              variant="outline"
            >
              <Redo />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo</TooltipContent>
        </Tooltip>

        {/* Show Measurements Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className={cn(
                "rounded-full flex items-center justify-center p-2 w-12 h-12 cursor-pointer",
                showWardrobeMeasurements
                  ? "bg-primary text-primary-foreground hover:bg-primary/80"
                  : ""
              )}
              onClick={handleMeasurementsClick}
              variant={showWardrobeMeasurements ? "default" : "outline"}
            >
              <Ruler />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {showWardrobeMeasurements
              ? "Hide measurements"
              : "Show measurements"}
          </TooltipContent>
        </Tooltip>

        {/* Toggle Lights Button : currently not used*/}

        {/* <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className={cn(
                "rounded-full flex items-center justify-center p-2 w-12 h-12 cursor-pointer",
                lightsOn
                  ? "bg-primary text-primary-foreground hover:bg-primary/80"
                  : ""
              )}
              onClick={handleToggleLights}
              variant={lightsOn ? "default" : "outline"}
            >
              <Lightbulb />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {lightsOn ? "Turn lights off" : "Turn lights on"}
          </TooltipContent>
        </Tooltip> */}

        {/* Clear All Wardrobes with confirmation */}
        {wardrobeInstances.length > 0 && (
          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button
                    className="rounded-full flex items-center justify-center p-2 w-12 h-12 cursor-pointer text-primary"
                    variant="outline"
                  >
                    <Trash2 />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>Clear all wardrobes</TooltipContent>
            </Tooltip>
            <AlertDialogContent className="w-[450px] rounded-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl! font-semibold! text-foreground!">
                  Clear all wardrobes?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all wardrobes from the scene. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="!flex !flex-col mt-10 space-y-2">
                <AlertDialogCancel className="cursor-pointer rounded-full w-full h-12 hover:bg-border">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={clearAllWardrobes}
                  className="bg-destructive hover:bg-destructive/80 text-primary-foreground cursor-pointer rounded-full w-full h-12"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </Html>
  );
};

export default ToolPanel;
