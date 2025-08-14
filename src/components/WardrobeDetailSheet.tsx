//This component is used to display bundle if user clicks on a canvas wardrobe model

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useStore } from "@/store";

type WardrobeDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const WardrobeDetailSheet = ({
  open,
  onOpenChange,
}: WardrobeDetailSheetProps) => {
  const focusedWardrobeInstance = useStore((s) => s.focusedWardrobeInstance);

  if (!focusedWardrobeInstance) return null;

  const { product } = focusedWardrobeInstance;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        withOverlay={false}
        className="top-28 h-[calc(100%-7rem)] overflow-y-auto"
      >
        <div className="sticky top-0 h-4 bg-gradient-to-b from-black/10 to-transparent z-10" />
        <div className="p-4">
          <div className="text-xl font-bold mb-2">{product.name}</div>
          <div className="text-sm text-gray-600 mb-4">
            Item #{product.itemNumber}
          </div>
          <div className="space-y-2">
            <div>
              <span className="font-semibold">Price: </span>$
              {product.price.toFixed(2)}
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Width</span>
                <div className="font-semibold">{product.width}cm</div>
              </div>
              <div>
                <span className="text-gray-600">Depth</span>
                <div className="font-semibold">{product.depth}cm</div>
              </div>
              <div>
                <span className="text-gray-600">Height</span>
                <div className="font-semibold">{product.height}cm</div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default WardrobeDetailSheet;
