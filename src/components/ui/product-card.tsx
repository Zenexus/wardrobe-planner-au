import { Info } from "lucide-react";
import { Product } from "../../types";
import { useState } from "react";
import { useDrag } from "react-dnd";
import ProductDetailSheet from "../ProductDetailSheet";
import { useStore } from "../../store";

type ProductCardProps = {
  product: Product;
  onAddToDesign?: (product: Product) => void;
  hasSpace?: boolean;
};

export function ProductCard({
  product,
  onAddToDesign,
  hasSpace = true,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { globalSheetOpen } = useStore();

  // Set up drag functionality
  const [{ isDragging }, drag] = useDrag({
    type: "PRODUCT",
    item: { product },
    canDrag: hasSpace && !globalSheetOpen && !isDetailOpen,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDetailOpen(true);
  };

  const handleCardClick = () => {
    // Only add to design if no sheet is open and there's space
    if (!globalSheetOpen && !isDetailOpen && hasSpace) {
      onAddToDesign?.(product);
    }
  };

  const handleSheetClose = () => {
    // No delay needed - update state immediately
    setIsDetailOpen(false);
  };

  const handleSheetOpenChange = (newOpen: boolean) => {
    setIsDetailOpen(newOpen);

    // If sheet is closing, ensure we update the state immediately
    if (!newOpen) {
      setIsDetailOpen(false);
    }
  };

  return (
    <div
      ref={drag as any}
      className={`p-4 hover:shadow-sm flex flex-col h-full relative transition-all ${
        hasSpace
          ? "bg-background cursor-pointer"
          : "bg-secondary cursor-not-allowed opacity-75"
      } ${isDragging ? "opacity-50" : ""}`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full h-32">
        {/* Default image (first image) */}
        <img
          src={product.images?.[0] || product.thumbnail}
          alt={product.name}
          className={`w-full h-32 object-cover absolute inset-0 transition-opacity duration-300 ${
            isHovered && product.images && product.images.length > 1
              ? "opacity-0"
              : "opacity-100"
          }`}
        />

        {/* Hover image (second image) - only render if we have multiple images */}
        {product.images && product.images.length > 1 && (
          <img
            src={product.images[1]}
            alt={product.name}
            className={`w-full h-32 object-cover absolute inset-0 transition-opacity duration-300 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
      </div>

      <div className="text-sm font-semibold pt-4 h-20">{product.name}</div>
      <div className="mt-2 flex justify-between items-center">
        <span className="font-semibold">${product.price.toFixed(2)}</span>
        <ProductDetailSheet
          product={product}
          open={isDetailOpen}
          onOpenChange={handleSheetOpenChange}
          onSheetClose={handleSheetClose}
          trigger={
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
              aria-label="Product information"
              onClick={handleViewDetails}
            >
              <Info className="w-4 h-4 text-primary" />
            </button>
          }
        />
      </div>

      <div className="flex items-center gap-1 mt-2">
        <div className="grid grid-cols-3 gap-1 text-xs text-center">
          <div
            className={`p-1 transition-colors ${
              isHovered
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            <div>{product.width}</div>
            <div>W</div>
          </div>
          <div
            className={`p-1 transition-colors ${
              isHovered
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            <div>{product.depth}</div>
            <div>D</div>
          </div>
          <div
            className={`p-1 transition-colors ${
              isHovered
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            <div>{product.height}</div>
            <div>H</div>
          </div>
        </div>
        <span className="text-xs text-gray-400 ml-1">cm</span>
      </div>
      {/* No space indicator */}
      {!hasSpace && (
        <div className="absolute top-2 right-2 bg-destructive text-white text-xs px-2 py-1 rounded-full">
          No Space
        </div>
      )}
    </div>
  );
}
