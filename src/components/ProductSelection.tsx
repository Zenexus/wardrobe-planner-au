import { useState } from "react";
import { ProductCard } from "./ui/product-card";
import productsData from "../products.json";
import { useStore } from "../store";
import { Product } from "../types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

const ProductSelection = () => {
  // Filter products for Core Wardrobe Range
  const coreWardrobeProducts = productsData.products.filter(
    (product) => product.category === "Core Wardrobe Range"
  );

  const { addWardrobeInstance, checkSpaceAvailability } = useStore();

  const [selectedColor, setSelectedColor] = useState<
    "White" | "White stained oak effect"
  >("White");
  const [depthTab, setDepthTab] = useState("core");

  const handleAddToDesign = (product: Product) => {
    // Add the wardrobe instance directly to the store
    const result = addWardrobeInstance(product);

    if (result.success) {
      console.log(
        `Added product to design: ${product.name} (ID: ${result.id})`
      );
    } else {
      // Show error toast when no space is available

      console.warn(`Failed to add ${product.name}: ${result.message}`);
    }
  };

  return (
    <>
      <div className="text-2xl font-semibold">Design your Flexi Wardrobe</div>

      {/* Change colour */}
      <div className="mt-4">
        <div className="text-sm font-medium text-gray-600">Change colour</div>
        <div className="text-sm text-gray-800 mt-1">{selectedColor}</div>
        <div className="flex items-center gap-4 mt-2">
          {/* White */}
          <div
            className={
              selectedColor === "White"
                ? "inline-flex w-14 h-14 items-center justify-center p-1 rounded-full border-2 border-black"
                : "inline-flex w-14 h-14 items-center justify-center p-1 rounded-full border-2 border-transparent"
            }
          >
            <button
              type="button"
              aria-pressed={selectedColor === "White"}
              onClick={() => setSelectedColor("White")}
              className="w-12 h-12 rounded-full border border-black shadow-sm hover:shadow cursor-pointer"
              style={{ background: "#ffffff" }}
              title="White"
            />
          </div>

          {/* White stained oak effect */}
          <div
            className={
              selectedColor === "White stained oak effect"
                ? "inline-flex w-14 h-14 items-center justify-center p-1 rounded-full border-2 border-black"
                : "inline-flex w-14 h-14 items-center justify-center p-1 rounded-full border-2 border-transparent"
            }
          >
            <button
              type="button"
              aria-pressed={selectedColor === "White stained oak effect"}
              onClick={() => setSelectedColor("White stained oak effect")}
              className="w-12 h-12 rounded-full border border-black shadow-sm hover:shadow cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #f7f2e7 0%, #e6d6b8 100%)",
              }}
              title="White stained oak effect"
            />
          </div>
        </div>
      </div>

      {/* Depth */}
      <div className="mt-6">
        <div className="text-sm font-medium text-gray-600 mb-2">Depth</div>
        <Tabs value={depthTab} onValueChange={setDepthTab} className="w-full">
          <TabsList>
            <TabsTrigger value="core">Core</TabsTrigger>
            <TabsTrigger value="400mm">400mm</TabsTrigger>
          </TabsList>
          <TabsContent value="core" className="mt-2">
            <div className="font-bold">Core Wardrobe Range</div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              {coreWardrobeProducts.map((product) => {
                const hasSpace = checkSpaceAvailability(product.model);
                return (
                  <ProductCard
                    key={product.itemNumber}
                    product={product}
                    onAddToDesign={handleAddToDesign}
                    hasSpace={hasSpace}
                  />
                );
              })}
            </div>
          </TabsContent>
          <TabsContent value="400mm" className="mt-2">
            <div className="font-bold">400mm Wardrobe Range</div>
            <div className="text-sm text-gray-500 mt-2">
              No products available yet.
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default ProductSelection;
