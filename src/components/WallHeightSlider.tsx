import React, { useState } from "react";
import { useStore, DIMENSION_LIMITS } from "../store";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";

const WallHeightSlider = () => {
  const { wallsDimensions, setWallDimensions } = useStore();
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Using the front wall height as the global height for all walls
  const currentHeight = wallsDimensions.front.height;

  // Use real CM values from constants
  const MIN_HEIGHT = DIMENSION_LIMITS.HEIGHT.MIN; // 240cm
  const MAX_HEIGHT = DIMENSION_LIMITS.HEIGHT.MAX; // 400cm

  const handleHeightChange = (value: number[]) => {
    const newHeight = value[0];

    // Update all walls with the new height
    Object.keys(wallsDimensions).forEach((wall) => {
      const wallKey = wall as keyof typeof wallsDimensions;
      const currentDimensions = wallsDimensions[wallKey];
      setWallDimensions(wallKey, {
        ...currentDimensions,
        height: newHeight,
      });
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= MIN_HEIGHT && value <= MAX_HEIGHT) {
      handleHeightChange([value]);
    }
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
  };

  return (
    <div className="space-y-4">
      {/* Height label and input row */}
      <div className="flex items-center justify-between">
        <Label htmlFor="height-input" className="text-sm font-medium">
          Height
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="height-input"
            type="number"
            min={MIN_HEIGHT}
            max={MAX_HEIGHT}
            step="1"
            value={Math.round(currentHeight)}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className="w-20 text-right"
          />
          <span className="text-sm text-muted-foreground">cm</span>
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-2">
        <Slider
          value={[currentHeight]}
          onValueChange={handleHeightChange}
          min={MIN_HEIGHT}
          max={MAX_HEIGHT}
          step={1}
          className={`w-full ${isInputFocused ? "opacity-50" : ""}`}
        />

        {/* Min/Max labels when input is focused */}
        {isInputFocused && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{MIN_HEIGHT}cm</span>
            <span>{MAX_HEIGHT}cm</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WallHeightSlider;
