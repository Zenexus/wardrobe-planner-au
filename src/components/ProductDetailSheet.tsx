import { SheetContent } from "@/components/ui/sheet";
import SheetThumbnailsCarousel from "./SheetThumbnailsCarousel";
import { Product } from "../types";
import { Check } from "lucide-react";

type ProductDetailSheetContentProps = {
  product: Product;
};

const ProductDetailSheetContent = ({
  product,
}: ProductDetailSheetContentProps) => {
  const formatDimension = (cm: number) => {
    return `${cm}cm`;
  };

  return (
    <SheetContent className="overflow-y-auto p-4">
      <div className="flex flex-col gap-6 p-4">
        {/* Product Images Carousel */}
        <SheetThumbnailsCarousel
          images={product.images || [product.thumbnail]}
          alt={product.name}
          className="w-full"
        />

        <div className="flex flex-col gap-2">
          <p className="text-2xl font-bold">{product.name}</p>
          <p className="text-sm text-secondary-foreground">
            #{product.itemNumber} {product.category}
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
          <section className="flex flex-col gap-2">
            <p className="font-semibold text-lg">Dimensions:</p>
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
          </section>

          {/* Description */}
          <section className="mt-8">
            <p className="font-semibold text-lg mb-3">Description:</p>
            {product.desc && (
              <div>
                <p className="text-foreground leading-relaxed whitespace-pre-line">
                  {product.desc.split("\n").map((line, index) => (
                    <p key={index} className="mb-3">
                      {line}
                    </p>
                  ))}
                </p>
              </div>
            )}
          </section>

          {product.intro && (
            <div>
              <p className="text-foreground leading-relaxed">
                {product.intro.split("\n").map((line, index) => (
                  <div key={index} className="flex items-center gap-2 mb-3">
                    <Check className="w-4 h-4 text-primary" strokeWidth={2.5} />
                    <p key={index}>{line}</p>
                  </div>
                ))}
              </p>
            </div>
          )}

          <section className="mt-8">
            <p className="font-semibold text-lg">Important:</p>
            <img
              src="/danger_symbols.svg"
              alt="danger symbols"
              className="w-25 h-25"
            />
            <p className="mb-2 text-md">
              WARNING: THIS PRODUCT SHOULD BE ANCHORED TO A WALL OR OTHER
              SUITABLE SURFACE TO AVOID SERIOUS INJURY OR DEATH.
            </p>
            <p className="text-sm">
              To help avoid any serious injury or death, this product has been
              fixed with a wall mount to prevent toppling. We strongly recommend
              that this product be permanently fixed to the wall or other
              suitable surface. Fixing devices are not included since different
              surface materials require different attachments. Please seek
              professional advice if you are in doubt what fixing device to use.
              Regularly check your fixing device.
            </p>
          </section>
        </div>
      </div>
    </SheetContent>
  );
};

export default ProductDetailSheetContent;
