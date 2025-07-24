import { Product } from "../../types";

interface ProductCardProps {
  product: Product;
  onAddToDesign?: (product: Product) => void;
  hasSpace?: boolean;
}

export function ProductCard({
  product,
  onAddToDesign,
  hasSpace = true,
}: ProductCardProps) {
  return (
    <div
      className={`p-4 hover:shadow-md flex flex-col h-full relative transition-all ${
        hasSpace
          ? "bg-white cursor-pointer"
          : "bg-gray-200 hover:bg-gray-300 cursor-not-allowed opacity-75"
      }`}
      onClick={() => onAddToDesign?.(product)}
    >
      <div>
        <img
          src={product.thumbnail}
          alt={product.name}
          className="w-full h-32 object-cover rounded-md"
        />
      </div>
      <div className="font-semibold text-sm pt-4">{product.name}</div>

      <div className="mt-2 flex justify-between items-center">
        <span className="font-semibold">${product.price.toFixed(2)}</span>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {product.width}cm × {product.depth}cm × {product.height}cm
      </div>

      {/* No space indicator */}
      {!hasSpace && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
          No Space
        </div>
      )}
    </div>
  );
}
