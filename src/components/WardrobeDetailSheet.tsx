//This component is used to display bundle if user clicks on a canvas wardrobe model

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useStore } from "@/store";
import { getBundlesForWardrobe } from "@/constants/wardrobeConfig";
import { BundleCard } from "@/components/ui/bundle-card";
import bundlesData from "@/bundles.json";
import type { Bundle } from "@/types/bundle";
import type { Product } from "@/types";

type WardrobeDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const WardrobeDetailSheet = ({
  open,
  onOpenChange,
}: WardrobeDetailSheetProps) => {
  const focusedWardrobeInstance = useStore((s) => s.focusedWardrobeInstance);
  const updateWardrobeInstance = useStore((s) => s.updateWardrobeInstance);

  if (!focusedWardrobeInstance) return null;

  const { product } = focusedWardrobeInstance;

  // Get bundles for this wardrobe
  const bundleItemNames = getBundlesForWardrobe(product.itemNumber);
  const bundles = bundlesData.bundles.filter((bundle) =>
    bundleItemNames.includes(bundle.ItemName)
  );

  const handleAddBundleToDesign = (bundle: Bundle) => {
    if (!focusedWardrobeInstance) return;

    // Convert bundle to Product format
    const bundleProduct: Product = {
      itemNumber: bundle.ItemName,
      name: bundle.name,
      width: focusedWardrobeInstance.product.width, // Keep original dimensions
      height: focusedWardrobeInstance.product.height,
      depth: focusedWardrobeInstance.product.depth,
      color: focusedWardrobeInstance.product.color,
      desc: bundle.description,
      price: bundle.price,
      type: focusedWardrobeInstance.product.type,
      category: focusedWardrobeInstance.product.category,
      thumbnail: bundle.thumbnail,
      model: bundle.model, // This is the key change - bundle model path
      images: [bundle.thumbnail], // Use bundle thumbnail as image
    };

    // Replace the current wardrobe with the bundle
    updateWardrobeInstance(focusedWardrobeInstance.id, {
      product: bundleProduct,
    });

    console.log(
      `Replaced wardrobe ${focusedWardrobeInstance.id} with bundle ${bundle.ItemName}`
    );

    // Provide user feedback
    // You could add a toast notification here if you have a toast system

    // Close the sheet after replacement
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        withOverlay={false}
        className="top-28 h-[calc(100%-7rem)] overflow-y-auto"
      >
        <div className="sticky top-0 h-4 bg-gradient-to-b from-black/10 to-transparent z-10" />
        <div className="p-4 space-y-6">
          {/* Wardrobe Details */}
          <div>
            <div className="text-xl font-bold mb-2">{product.name}</div>
            <div className="text-sm text-gray-600 mb-4">
              Item #{product.itemNumber}
            </div>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Price: </span>$
                {product.price.toFixed(2)}
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Width</span>
                  <div className="font-semibold">{product.width}cm</div>
                </div>
                <div>
                  <span className="text-gray-600">Depth</span>
                  <div className="font-semibold">{product.depth}cm</div>
                </div>
                <div>
                  <span className="text-gray-600">Height</span>
                  <div className="font-semibold">{product.height}cm</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bundle Products */}
          {bundles.length > 0 && (
            <div>
              <div className="text-lg font-semibold mb-3">
                Available Bundles ({bundles.length})
              </div>
              <div className="grid grid-cols-2 gap-4">
                {bundles.map((bundle, index) => (
                  <BundleCard
                    key={`${bundle.ItemName}-${index}`}
                    bundle={bundle}
                    onAddToDesign={() => handleAddBundleToDesign(bundle)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default WardrobeDetailSheet;
