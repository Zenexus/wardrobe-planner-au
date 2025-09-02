import { useNavigate } from "react-router-dom";
import { ArrowLeft, Menu, HeartPlus } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import MenuSheetContent from "@/components/MenuSheetContent";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function SummaryHeader() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-white">
      <div className="px-10 py-6">
        <div className="pl-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <img
                src="/logo/Logo_Wardrobe.png"
                alt="Wardrobe Logo"
                className="h-12 w-auto object-contain"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="w-16 h-16 flex items-center justify-center cursor-pointer hover:bg-gray-200 rounded-full"
                    onClick={() => navigate("/planner")}
                    aria-label="Back to Planner"
                  >
                    <ArrowLeft size={24} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Back to Planner</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-2 pr-4">
              <Dialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="w-16 h-16 flex items-center justify-center cursor-pointer hover:bg-gray-200 rounded-full transition-colors"
                        aria-label="Popular List"
                      >
                        <HeartPlus size={24} />
                      </button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Popular List</TooltipContent>
                </Tooltip>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Popular List</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    {/* Content will be added later */}
                  </div>
                </DialogContent>
              </Dialog>

              <Sheet>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SheetTrigger asChild>
                      <button
                        type="button"
                        aria-label="Open menu"
                        className="w-16 h-16 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
                      >
                        <Menu size={24} />
                      </button>
                    </SheetTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Menu</TooltipContent>
                </Tooltip>
                <SheetContent side="right">
                  <MenuSheetContent />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
