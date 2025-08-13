import React, { useEffect, useState } from "react";
import { useStore, DIMENSION_LIMITS } from "../store";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";

const RoomDimensionSliders = () => {
  const { wallsDimensions, setWallDimensions, recalcPositionsForRoomResize } =
    useStore();
  const [widthInputFocused, setWidthInputFocused] = useState(false);
  const [depthInputFocused, setDepthInputFocused] = useState(false);

  // Get current room dimensions
  const currentWidth = wallsDimensions.front.length; // Front wall length = room width
  const currentDepth = wallsDimensions.left.length; // Left wall length = room depth

  // Local input state (strings) to allow free typing, including empty/partial values
  const [widthInputValue, setWidthInputValue] = useState<string>(
    String(Math.round(currentWidth))
  );
  const [depthInputValue, setDepthInputValue] = useState<string>(
    String(Math.round(currentDepth))
  );

  // Use real CM values from constants
  const MIN_SIZE = DIMENSION_LIMITS.WIDTH_LENGTH.MIN; // 400cm
  const MAX_SIZE = DIMENSION_LIMITS.WIDTH_LENGTH.MAX; // 2000cm

  const handleWidthChange = (value: number[]) => {
    const newWidth = value[0];

    // Update front and back walls (they span the room width)
    const frontWall = wallsDimensions.front;
    const backWall = wallsDimensions.back;

    setWallDimensions("front", { ...frontWall, length: newWidth });
    setWallDimensions("back", { ...backWall, length: newWidth });
    recalcPositionsForRoomResize();
    // Keep input in sync when change comes from slider
    if (!widthInputFocused) {
      setWidthInputValue(String(Math.round(newWidth)));
    }
  };

  const handleDepthChange = (value: number[]) => {
    const newDepth = value[0];

    // Update left and right walls (they span the room depth)
    const leftWall = wallsDimensions.left;
    const rightWall = wallsDimensions.right;

    setWallDimensions("left", { ...leftWall, length: newDepth });
    setWallDimensions("right", { ...rightWall, length: newDepth });
    recalcPositionsForRoomResize();
    if (!depthInputFocused) {
      setDepthInputValue(String(Math.round(newDepth)));
    }
  };

  // Sync inputs from store when not focused
  useEffect(() => {
    if (!widthInputFocused) {
      setWidthInputValue(String(Math.round(currentWidth)));
    }
  }, [currentWidth, widthInputFocused]);

  useEffect(() => {
    if (!depthInputFocused) {
      setDepthInputValue(String(Math.round(currentDepth)));
    }
  }, [currentDepth, depthInputFocused]);

  const commitWidthInput = () => {
    const parsed = parseFloat(widthInputValue);
    if (!isNaN(parsed)) {
      const clamped = Math.max(MIN_SIZE, Math.min(MAX_SIZE, parsed));
      handleWidthChange([clamped]);
      setWidthInputValue(String(Math.round(clamped)));
    } else {
      // Revert to current if invalid
      setWidthInputValue(String(Math.round(currentWidth)));
    }
  };

  const commitDepthInput = () => {
    const parsed = parseFloat(depthInputValue);
    if (!isNaN(parsed)) {
      const clamped = Math.max(MIN_SIZE, Math.min(MAX_SIZE, parsed));
      handleDepthChange([clamped]);
      setDepthInputValue(String(Math.round(clamped)));
    } else {
      setDepthInputValue(String(Math.round(currentDepth)));
    }
  };

  const handleWidthInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWidthInputValue(e.target.value);
  };

  const handleDepthInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDepthInputValue(e.target.value);
  };

  // Temporary slider values reflecting input while focused
  const parsedWidth = parseFloat(widthInputValue);
  const sliderWidthValue =
    widthInputFocused && !isNaN(parsedWidth)
      ? Math.max(MIN_SIZE, Math.min(MAX_SIZE, parsedWidth))
      : currentWidth;

  const parsedDepth = parseFloat(depthInputValue);
  const sliderDepthValue =
    depthInputFocused && !isNaN(parsedDepth)
      ? Math.max(MIN_SIZE, Math.min(MAX_SIZE, parsedDepth))
      : currentDepth;

  return (
    <div className="space-y-6">
      {/* Width Slider */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="width-input" className="text-sm font-medium">
            Width
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="width-input"
              type="number"
              min={MIN_SIZE}
              max={MAX_SIZE}
              step="10"
              value={widthInputValue}
              onChange={handleWidthInputChange}
              onFocus={() => setWidthInputFocused(true)}
              onBlur={() => {
                setWidthInputFocused(false);
                commitWidthInput();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  commitWidthInput();
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="w-20 text-right"
            />
            <span className="text-sm text-muted-foreground">cm</span>
          </div>
        </div>

        <div className="space-y-2">
          <Slider
            value={[sliderWidthValue]}
            onValueChange={handleWidthChange}
            min={MIN_SIZE}
            max={MAX_SIZE}
            step={10}
            className={`w-full ${widthInputFocused ? "opacity-50" : ""}`}
          />

          {widthInputFocused && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{MIN_SIZE}cm</span>
              <span>{MAX_SIZE}cm</span>
            </div>
          )}
        </div>
      </div>

      {/* Depth Slider */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="depth-input" className="text-sm font-medium">
            Depth
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="depth-input"
              type="number"
              min={MIN_SIZE}
              max={MAX_SIZE}
              step="10"
              value={depthInputValue}
              onChange={handleDepthInputChange}
              onFocus={() => setDepthInputFocused(true)}
              onBlur={() => {
                setDepthInputFocused(false);
                commitDepthInput();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  commitDepthInput();
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="w-20 text-right"
            />
            <span className="text-sm text-muted-foreground">cm</span>
          </div>
        </div>

        <div className="space-y-2">
          <Slider
            value={[sliderDepthValue]}
            onValueChange={handleDepthChange}
            min={MIN_SIZE}
            max={MAX_SIZE}
            step={10}
            className={`w-full ${depthInputFocused ? "opacity-50" : ""}`}
          />

          {depthInputFocused && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{MIN_SIZE}cm</span>
              <span>{MAX_SIZE}cm</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomDimensionSliders;
