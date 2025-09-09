import { Button } from "./button";
import type { Bundle } from "@/types/bundle";

interface BundleCardProps {
  bundle: Bundle;
  onAddToDesign?: () => void;
}

export function BundleCard({ bundle, onAddToDesign }: BundleCardProps) {
  return (
    <div className="p-4 hover:shadow-sm flex flex-col h-full relative transition-all bg-white cursor-pointer">
      {/* Thumbnail - matching product card size */}
      <div className="relative w-full h-32">
        <img
          src={bundle.thumbnail}
          alt={bundle.name}
          className="w-full h-32 object-cover"
          onError={(e) => {
            e.currentTarget.src = "/images/placeholder.png"; // Fallback image
          }}
        />
      </div>

      {/* Bundle Info - compact like product cards */}
      <div className="font-semibold text-sm pt-4">{bundle.name}</div>

      {/* Bundle Details - compact */}
      <div className="text-xs text-gray-500 mt-1">
        Bundle: {bundle.ItemName}
      </div>

      {/* Price and Button */}
      <div className="mt-2 flex justify-between items-center">
        <span className="font-semibold">${bundle.price.toFixed(2)}</span>
        {onAddToDesign && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onAddToDesign();
            }}
            size="sm"
            className="text-xs px-2 py-1 h-6"
          >
            Upgrade
          </Button>
        )}
      </div>
    </div>
  );
}
