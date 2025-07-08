import { ProductCard } from "./ui/product-card";
import productsData from "../products.json";
import { useStore } from "../store";
import { Product } from "../types";

const ProductSelection = () => {
  // Filter products for Core Wardrobe Range
  const coreWardrobeProducts = productsData.products.filter(
    (product) => product.category === "Core Wardrobe Range"
  );

  const { setSelectedWardrobe } = useStore();

  const handleAddToDesign = (product: Product) => {
    // Set the selected wardrobe in the store
    setSelectedWardrobe(product);
    console.log(`Adding product to design: ${product.name}`);
  };

  return (
    <>
      <div className="text-4xl font-bold">Design your PAX</div>
      <div className="font-bold">Core Wardrobe Range</div>
      <div className="grid grid-cols-2 gap-4 mt-2">
        {coreWardrobeProducts.map((product) => (
          <ProductCard
            key={product.itemNumber}
            product={product}
            onAddToDesign={handleAddToDesign}
          />
        ))}
      </div>
      <div className="font-bold">400mm Wardrobe Range</div>
    </>
  );
};

export default ProductSelection;
