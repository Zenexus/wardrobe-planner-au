import { ProductCard } from "./ui/product-card";
import productsData from "../products.json";
import { useStore } from "../store";
import { Product } from "../types";

const ProductSelection = () => {
  // Filter products for Core Wardrobe Range
  const coreWardrobeProducts = productsData.products.filter(
    (product) => product.category === "Core Wardrobe Range"
  );

  const { addWardrobeInstance, checkSpaceAvailability, wardrobeInstances } =
    useStore();

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
      <div className="font-bold">400mm Wardrobe Range</div>
    </>
  );
};

export default ProductSelection;
