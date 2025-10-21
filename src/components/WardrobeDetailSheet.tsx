// This component is used to display bundle
// if user clicks on a canvas wardrobe model

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useStore } from "@/store";
import { getBundlesForWardrobe } from "@/constants/wardrobeConfig";
import { BundleCard } from "@/components/ui/bundle-card";
import React, { useState, useEffect } from "react";
import type { Bundle, BundleWithPrice } from "@/types/bundle";
import type { Product } from "@/types";
import {
  calculateBundlePrice,
  calculateOriginalWardrobePrice,
} from "@/utils/bundlePricing";

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
  const getBundles = useStore((s) => s.getBundles);
  const getProducts = useStore((s) => s.getProducts);
  const getAccessories = useStore((s) => s.getAccessories);

  const [bundles, setBundles] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [accessories, setAccessories] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [bundlesData, productsData, accessoriesData] = await Promise.all([
          getBundles(),
          getProducts(),
          getAccessories(),
        ]);
        setBundles(bundlesData);
        setProducts(productsData);
        setAccessories(accessoriesData);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };
    loadData();
  }, [getBundles, getProducts, getAccessories]);

  if (!focusedWardrobeInstance) return null;

  const { product } = focusedWardrobeInstance;

  // Get bundles for this wardrobe
  const bundleItemNames = getBundlesForWardrobe(product.itemNumber);
  const filteredBundles = bundles.filter((bundle) =>
    bundleItemNames.includes(bundle.ItemName)
  );

  // Create original wardrobe as a bundle option
  const originalProduct = products.find((p) => p.itemNumber === "2583987");
  const originalBundle: BundleWithPrice | null = originalProduct
    ? {
        ItemName: "2583987-Original",
        code: "01685",
        name: originalProduct.name,
        description: "Original wardrobe without any bundles",
        intro: originalProduct.intro,
        thumbnail: originalProduct.images[0],
        model: "components/W-01685",
        price: calculateOriginalWardrobePrice(products),
        packDetails: [], // No accessories for original
      }
    : null;

  // Combine original + bundles, with original first
  // Ensure all bundles have calculated prices
  const bundlesWithPrices: BundleWithPrice[] = filteredBundles.map(
    (bundle) => ({
      ...bundle,
      price: calculateBundlePrice(bundle, products, accessories), // Always calculate price
    })
  );

  const allOptions = originalBundle
    ? [originalBundle, ...bundlesWithPrices]
    : bundlesWithPrices;

  // Determine which option is currently selected (blocked)
  const currentModelPath = focusedWardrobeInstance.product.model;
  const isOriginalSelected = currentModelPath === "components/W-01685";
  const selectedBundleItemName = isOriginalSelected
    ? "2583987-Original"
    : bundles.find((b) => b.model === currentModelPath)?.ItemName;

  const handleAddBundleToDesign = (bundle: Bundle) => {
    if (!focusedWardrobeInstance) return;

    let targetProduct: Product;

    // Handle original wardrobe selection
    if (bundle.ItemName === "2583987-Original" && originalProduct) {
      targetProduct = originalProduct;
    } else {
      // Convert bundle to Product format with calculated price
      const calculatedPrice = calculateBundlePrice(
        bundle,
        products,
        accessories
      );
      targetProduct = {
        itemNumber: bundle.ItemName,
        name: bundle.name,
        width: focusedWardrobeInstance.product.width, // Keep original dimensions
        height: focusedWardrobeInstance.product.height,
        depth: focusedWardrobeInstance.product.depth,
        color: focusedWardrobeInstance.product.color,
        desc: bundle.description,
        intro: (bundle as any).intro || bundle.description,
        price: calculatedPrice, // Use calculated price
        type: focusedWardrobeInstance.product.type,
        category: focusedWardrobeInstance.product.category,
        thumbnail: bundle.thumbnail,
        model: bundle.model, // This is the key change - bundle model path
        images: [bundle.thumbnail], // Use bundle thumbnail as image
      };
    }

    // Replace the current wardrobe with the selected option
    updateWardrobeInstance(focusedWardrobeInstance.id, {
      product: targetProduct,
    });

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
          <div className="mt-4">
            <div className="text-xl font-bold mb-2">{product.name}</div>
            <div className="text-sm text-gray-600 mb-4">
              Item #{product.itemNumber}
            </div>
            <div className="space-y-2">
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

          {/* All Options (Original + Bundles) */}
          {allOptions.length > 0 && (
            <div>
              <div className="text-lg font-semibold mb-3">
                Available Options ({allOptions.length})
              </div>
              <div className="grid grid-cols-2 gap-4">
                {allOptions.map((option, index) => {
                  const isBlocked = option.ItemName === selectedBundleItemName;
                  const isOriginal = option.ItemName === "2583987-Original";

                  return (
                    <BundleCard
                      key={`${option.ItemName}-${index}`}
                      bundle={option}
                      productsData={products}
                      accessoriesData={accessories}
                      onAddToDesign={
                        isBlocked
                          ? undefined
                          : () => handleAddBundleToDesign(option)
                      }
                      isBlocked={isBlocked}
                      isOriginal={isOriginal}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default WardrobeDetailSheet;
