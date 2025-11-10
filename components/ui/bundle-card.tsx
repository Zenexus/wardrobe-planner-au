import { Button } from "./button";
import { useDrag } from "react-dnd";
import type { BundleWithPrice } from "@/types/bundle";
import { getBundlePriceBreakdown } from "@/utils/bundlePricing";

interface BundleCardProps {
  bundle: BundleWithPrice;
  productsData?: any[];
  accessoriesData?: any[];
  onAddToDesign?: () => void;
  isBlocked?: boolean;
  isOriginal?: boolean;
}

export function BundleCard({
  bundle,
  productsData,
  accessoriesData,
  onAddToDesign,
  isBlocked = false,
  isOriginal = false,
}: BundleCardProps) {
  // Get price breakdown for bundles (not for original)
  const priceBreakdown =
    !isOriginal && bundle.packDetails
      ? getBundlePriceBreakdown(bundle, productsData, accessoriesData)
      : null;

  // Set up drag functionality
  const [{ isDragging }, drag] = useDrag({
    type: "BUNDLE",
    item: { bundle },
    canDrag: !isBlocked,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag as any}
      className={`p-4 flex flex-col h-full relative transition-all ${
        isBlocked
          ? "bg-gray-100 cursor-not-allowed opacity-60"
          : "bg-white cursor-pointer hover:shadow-sm"
      } ${isDragging ? "opacity-50" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        if (!isBlocked && onAddToDesign) {
          onAddToDesign();
        }
      }}
    >
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
      <div className="font-semibold text-sm pt-4 flex-grow">{bundle.name}</div>

      {/* Bundle Details - compact */}
      <div className="text-xs text-gray-500 mt-1">
        {isOriginal ? "Item: 2583987" : `Bundle: ${bundle.ItemName}`}
      </div>

      {/* Price Breakdown for Bundles */}
      {priceBreakdown && (
        <div className="text-xs text-gray-600 mt-2 space-y-1">
          <div>Base: ${priceBreakdown.basePrice.toFixed(2)}</div>
          {priceBreakdown.accessories.length > 0 && (
            <div>
              + {priceBreakdown.accessories.length} accessory
              {priceBreakdown.accessories.length > 1 ? "ies" : ""}: $
              {priceBreakdown.accessoriesTotal.toFixed(2)}
            </div>
          )}
        </div>
      )}

      {/* Price and Button */}
      <div className="mt-2 flex justify-between items-center">
        <span className={`font-semibold ${isBlocked ? "text-gray-500" : ""}`}>
          ${bundle.price.toFixed(2)}
        </span>
        {isBlocked ? (
          <div className="text-xs text-gray-500 px-2 py-1 h-6 flex items-center">
            Selected
          </div>
        ) : onAddToDesign ? (
          <Button size="sm" className="text-xs px-2 py-1 h-6">
            {isOriginal ? "Basic Option" : "Bundle Option"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
