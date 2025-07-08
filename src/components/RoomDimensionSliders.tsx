import React, { useState } from "react";
import { useStore, DIMENSION_LIMITS } from "../store";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";

const RoomDimensionSliders = () => {
  const { wallsDimensions, setWallDimensions } = useStore();
  const [widthInputFocused, setWidthInputFocused] = useState(false);
  const [depthInputFocused, setDepthInputFocused] = useState(false);

  // Get current room dimensions
  const currentWidth = wallsDimensions.front.length; // Front wall length = room width
  const currentDepth = wallsDimensions.left.length; // Left wall length = room depth

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
  };

  const handleDepthChange = (value: number[]) => {
    const newDepth = value[0];

    // Update left and right walls (they span the room depth)
    const leftWall = wallsDimensions.left;
    const rightWall = wallsDimensions.right;

    setWallDimensions("left", { ...leftWall, length: newDepth });
    setWallDimensions("right", { ...rightWall, length: newDepth });
  };

  const handleWidthInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= MIN_SIZE && value <= MAX_SIZE) {
      handleWidthChange([value]);
    }
  };

  const handleDepthInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= MIN_SIZE && value <= MAX_SIZE) {
      handleDepthChange([value]);
    }
  };

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
              value={Math.round(currentWidth)}
              onChange={handleWidthInputChange}
              onFocus={() => setWidthInputFocused(true)}
              onBlur={() => setWidthInputFocused(false)}
              className="w-20 text-right"
            />
            <span className="text-sm text-muted-foreground">cm</span>
          </div>
        </div>

        <div className="space-y-2">
          <Slider
            value={[currentWidth]}
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
              value={Math.round(currentDepth)}
              onChange={handleDepthInputChange}
              onFocus={() => setDepthInputFocused(true)}
              onBlur={() => setDepthInputFocused(false)}
              className="w-20 text-right"
            />
            <span className="text-sm text-muted-foreground">cm</span>
          </div>
        </div>

        <div className="space-y-2">
          <Slider
            value={[currentDepth]}
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
