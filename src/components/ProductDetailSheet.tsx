import { Sheet, SheetContent } from "@/components/ui/sheet";
import SheetThumbnailsCarousel from "./SheetThumbnailsCarousel";
import { Product } from "../types";
import { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { useStore } from "../store";

interface ProductDetailSheetProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  onSheetClose?: () => void; // Callback when sheet closes
}

const ProductDetailSheet = ({
  product,
  open,
  onOpenChange,
  trigger,
  onSheetClose,
}: ProductDetailSheetProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const { setGlobalSheetOpen } = useStore();

  const formatDimension = (cm: number) => {
    return `${cm}cm`;
  };

  // Manage global sheet state
  useEffect(() => {
    setGlobalSheetOpen(open);

    if (open) {
      // Add a class to the body to indicate sheet is open
      document.body.classList.add("sheet-open");

      return () => {
        document.body.classList.remove("sheet-open");
      };
    }
  }, [open, setGlobalSheetOpen]);

  // Cleanup global sheet state when component unmounts
  useEffect(() => {
    return () => {
      setGlobalSheetOpen(false);
    };
  }, [setGlobalSheetOpen]);

  const handleOpenChange = (newOpen: boolean) => {
    // Update global state immediately
    setGlobalSheetOpen(newOpen);

    // Call the parent's onOpenChange
    onOpenChange(newOpen);

    // If sheet is closing, call the callback to prevent wardrobe addition
    if (!newOpen && onSheetClose) {
      onSheetClose();
    }
  };

  return (
    <>
      {trigger}
      {/* @ts-ignore */}
      <Sheet open={open} onOpenChange={handleOpenChange} ref={sheetRef}>
        <SheetContent
          className="overflow-y-auto p-4"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div
            className="flex flex-col gap-6 p-4"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Product Images Carousel */}
            <SheetThumbnailsCarousel
              images={product.images || [product.thumbnail]}
              alt={product.name}
              className="w-full"
            />

            <div className="flex flex-col gap-2">
              <p className="text-2xl font-bold">{product.name}</p>
              <p className="text-sm text-gray-600">
                Item #{product.itemNumber} {product.category}
              </p>
            </div>

            {/* Product Details */}
            <div className="space-y-4">
              {/* Price */}
              <div className="flex items-start font-bold">
                <span className="text-lg">$</span>
                <span className="text-4xl">{Math.floor(product.price)}</span>
                <span className="text-lg">
                  .{(product.price % 1).toFixed(2).substring(2)}
                </span>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex items-center gap-2">
                  <p>Width: </p>
                  <p className="font-semibold">
                    {formatDimension(product.width)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <p>Depth: </p>
                  <p className="font-semibold">
                    {formatDimension(product.depth)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <p>Height: </p>
                  <p className="font-semibold">
                    {formatDimension(product.height)}
                  </p>
                </div>
              </div>

              {/* Description */}
              {product.desc && (
                <div>
                  <img
                    src="/danger_symbols.svg"
                    alt="danger symbols"
                    className="w-25 h-25"
                  />
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {product.desc}
                  </p>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default ProductDetailSheet;
