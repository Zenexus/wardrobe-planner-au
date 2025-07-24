import { Html } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Trash2, Info } from "lucide-react";
import { useStore } from "@/store";
import SheetThumbnailsCarousel from "./SheetThumbnailsCarousel";
import { useState, useEffect } from "react";

const FocusedWardrobePanel = () => {
  const {
    focusedWardrobeInstance,
    setFocusedWardrobeInstance,
    removeWardrobeInstance,
    setSelectedObjectId,
  } = useStore();

  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Reset sheet state when focused wardrobe changes
  useEffect(() => {
    if (focusedWardrobeInstance) {
      setIsSheetOpen(false);
    }
  }, [focusedWardrobeInstance]);

  if (!focusedWardrobeInstance) {
    return null;
  }

  const handleDelete = () => {
    if (focusedWardrobeInstance) {
      removeWardrobeInstance(focusedWardrobeInstance.id);
      setFocusedWardrobeInstance(null);
      setSelectedObjectId(null);
      setIsSheetOpen(false);
    }
  };

  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);

    if (!open) {
      // Use a timeout to delay clearing the focused wardrobe until after the animation
      setTimeout(() => {
        setFocusedWardrobeInstance(null);
        setSelectedObjectId(null);
      }, 300);
    }
  };

  const { product } = focusedWardrobeInstance;

  const formatDimension = (cm: number) => {
    return `${cm}cm`;
  };

  // Get product images - currently using single thumbnail, but prepared for multiple images
  const getProductImages = (
    product: typeof focusedWardrobeInstance.product
  ) => {
    // Start with the main thumbnail
    const images = [product.thumbnail];

    // Demo: Add duplicate images to show carousel functionality
    // In production, you would have actual different product images
    // For now, we'll duplicate the thumbnail to demonstrate the carousel
    if (images[0]) {
      // Add the same image 2 more times for demo (in production, use different angles/views)
      images.push(product.thumbnail, product.thumbnail);
    }

    // Future implementation example:
    // return [product.thumbnail, product.image2, product.image3, product.image4].filter(Boolean);

    return images;
  };

  return (
    <Html fullscreen prepend>
      <div className="absolute bottom-[50px] left-1/2 -translate-x-1/2 z-[100] max-w-[150px] h-[50px] w-full mx-4">
        <div className="bg-[#0085AD] rounded-full shadow-lg flex items-center justify-center">
          <Button
            onClick={handleDelete}
            variant="ghost"
            className="rounded-full text-white flex items-center justify-center p-2 w-[50px] h-[50px] cursor-pointer "
          >
            <Trash2 />
          </Button>

          <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="rounded-full text-white flex items-center justify-center p-2 w-[50px] h-[50px] cursor-pointer"
              >
                <Info />
              </Button>
            </SheetTrigger>

            <SheetTitle className="sr-only">{product.name}</SheetTitle>
            <SheetDescription className="sr-only">
              Product details and information
            </SheetDescription>
            <SheetContent className="overflow-y-auto p-4">
              <div className="flex flex-col gap-6 p-4">
                {/* Product Images Carousel */}
                <SheetThumbnailsCarousel
                  images={getProductImages(product)}
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
                    <span className="text-4xl">
                      {Math.floor(product.price)}
                    </span>
                    <span className="text-lg">
                      .{(product.price % 1).toFixed(2).substring(2)}
                    </span>
                  </div>

                  {/* Dimensions */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="flex items-center gap-2">
                      <p>Width: </p>
                      <p className="font-semibold ">
                        {formatDimension(product.width)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <p>Depth: </p>
                      <p className="font-semibold ">
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
                      <p className=" text-gray-700 leading-relaxed whitespace-pre-line">
                        {product.desc}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </Html>
  );
};

export default FocusedWardrobePanel;
