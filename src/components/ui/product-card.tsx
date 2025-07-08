import { Product } from "../../types";

interface ProductCardProps {
  product: Product;
  onAddToDesign?: (product: Product) => void;
}

export function ProductCard({ product, onAddToDesign }: ProductCardProps) {
  return (
    <div
      className="bg-white hover:bg-yellow-100 p-4 rounded-md shadow-md flex flex-col h-full cursor-grab"
      onClick={() => onAddToDesign?.(product)}
    >
      <div className="mb-3">
        <img
          src={product.thumbnail}
          alt={product.name}
          className="w-full h-32 object-cover rounded-md"
        />
      </div>
      <div className="font-semibold text-lg">{product.name}</div>

      <div className="mt-2 flex justify-between items-center">
        <span className="font-bold">${product.price.toFixed(2)}</span>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {product.width}mm × {product.depth}mm × {product.height}mm
      </div>
    </div>
  );
}
