import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const FloorTextureSelector = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { floorTexture, setFloorTexture } = useStore();

  const textureOptions = [
    {
      id: "wood" as const,
      name: "Wood Floor",
      image: "/Textures/WoodFloor/WoodFloor062.png",
      color: "#8B4513",
    },
    {
      id: "carpet" as const,
      name: "Carpet",
      image: "/Textures/Carpet/Carpet016.png",
      color: "#8B7355",
    },
    {
      id: "tile" as const,
      name: "Tiles",
      image: "/Textures/Tiles/Tiles110.png",
      color: "#D3D3D3",
    },
  ];

  const currentTexture = textureOptions.find(
    (texture) => texture.id === floorTexture
  );

  const handleTextureSelect = (textureId: "wood" | "carpet" | "tile") => {
    setFloorTexture(textureId);
    setIsExpanded(false);
  };

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Invisible hover area that extends to cover the expanded buttons */}
      <div
        className={cn(
          "absolute top-0 left-0 h-12 transition-all duration-300",
          isExpanded ? "w-[170px]" : "w-[50px]"
        )}
      />

      {/* Main button - always visible */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="rounded-full flex items-center justify-center p-2 w-12 h-12 cursor-pointer relative overflow-hidden z-10"
            variant="outline"
          >
            {currentTexture?.image ? (
              <img
                src={currentTexture.image}
                alt={currentTexture.name}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div
                className="w-full h-full rounded-full"
                style={{ backgroundColor: currentTexture?.color }}
              />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Current floor: {currentTexture?.name}</TooltipContent>
      </Tooltip>

      {/* Expanded texture options */}
      <div
        className={cn(
          "absolute left-[60px] top-0 flex gap-2 transition-all duration-300 ease-out z-10",
          isExpanded
            ? "opacity-100 translate-x-0 pointer-events-auto"
            : "opacity-0 -translate-x-4 pointer-events-none"
        )}
      >
        {textureOptions
          .filter((texture) => texture.id !== floorTexture)
          .map((texture) => (
            <Tooltip key={texture.id}>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => handleTextureSelect(texture.id)}
                  className="rounded-full flex items-center justify-center p-2 w-12 h-12 cursor-pointer relative overflow-hidden"
                  variant="outline"
                >
                  {texture.image ? (
                    <img
                      src={texture.image}
                      alt={texture.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div
                      className="w-full h-full rounded-full"
                      style={{ backgroundColor: texture.color }}
                    />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Switch to {texture.name}</TooltipContent>
            </Tooltip>
          ))}
      </div>
    </div>
  );
};

export default FloorTextureSelector;
