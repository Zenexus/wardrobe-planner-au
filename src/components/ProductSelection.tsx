import { useState } from "react";
import { ProductCard } from "./ui/product-card";
import productsData from "../products.json";
import { useStore } from "../store";
import { Product } from "../types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import ColorSwatch from "./ColorSwatch";

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
        <div className="text-lg font-bold mb-4">Change colour</div>
        <div className="text-sm text-gray-800 mt-1">{selectedColor}</div>
        <div className="flex items-center gap-4 mt-2">
          {/* White */}
          <ColorSwatch
            isSelected={selectedColor === "White"}
            onClick={() => setSelectedColor("White")}
            title="White"
            background="#e6e6e6"
          />

          {/* White stained oak effect */}
          <ColorSwatch
            isSelected={selectedColor === "White stained oak effect"}
            onClick={() => setSelectedColor("White stained oak effect")}
            title="White stained oak effect"
            background="#c3b194"
          />
        </div>
      </div>

      {/* Depth */}
      <div className="mt-6">
        <div className="text-lg font-bold mb-4">Depth</div>
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
