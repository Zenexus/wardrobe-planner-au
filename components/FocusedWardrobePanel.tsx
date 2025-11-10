import { Button } from "@/components/ui/button";
import { Trash2, Info } from "lucide-react";
import { useStore } from "@/store";
import ProductDetailSheetContent from "./ProductDetailSheet";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const FocusedWardrobePanel = () => {
  const {
    focusedWardrobeInstance,
    setFocusedWardrobeInstance,
    removeWardrobeInstance,
    setSelectedObjectId,
    setGlobalSheetOpen,
  } = useStore();

  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Reset sheet state when focused wardrobe changes
  useEffect(() => {
    if (focusedWardrobeInstance) {
      setIsSheetOpen(false);
    }
  }, [focusedWardrobeInstance]);

  // Manage global sheet state
  useEffect(() => {
    setGlobalSheetOpen(isSheetOpen);
  }, [isSheetOpen, setGlobalSheetOpen]);

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

  return (
    <div className="absolute flex gap-4 bottom-[50px] left-[35%] -translate-x-1/2 z-[100] max-w-[150px] h-[50px] w-full mx-4 pointer-events-auto">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleDelete}
            className="rounded-full text-white flex items-center justify-center p-2 w-[50px] h-[50px] cursor-pointer"
          >
            <Trash2 />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete this wardrobe</TooltipContent>
      </Tooltip>

      <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
        <Tooltip>
          <TooltipTrigger asChild>
            <SheetTrigger asChild>
              <Button className="rounded-full text-white flex items-center justify-center p-2 w-[50px] h-[50px] cursor-pointer">
                <Info />
              </Button>
            </SheetTrigger>
          </TooltipTrigger>
          <TooltipContent>View wardrobe details</TooltipContent>
        </Tooltip>
        <ProductDetailSheetContent product={product} />
      </Sheet>
    </div>
  );
};

export default FocusedWardrobePanel;
