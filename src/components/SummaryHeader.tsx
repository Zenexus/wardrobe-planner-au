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
    <header className="sticky top-0 z-50 bg-background">
      <div className="px-4 lg:px-10 py-6">
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
                    className="w-16 h-16 flex items-center justify-center cursor-pointer hover:bg-secondary rounded-full"
                    onClick={() => navigate("/addon-organisors")}
                    aria-label="Back to Add-On Organisers"
                  >
                    <ArrowLeft size={24} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Back to Add-On Organisers</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-0 lg:gap-2 pr-0 lg:pr-4">
              <Dialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="w-16 h-16 flex items-center justify-center cursor-pointer hover:bg-secondary rounded-full transition-colors"
                        aria-label="Popular List"
                      >
                        <HeartPlus />
                      </button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Popular List</TooltipContent>
                </Tooltip>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Popular List</DialogTitle>
                  </DialogHeader>

                  <div className="py-4 overflow-y-auto max-h-[80vh]">
                    <div
                      onClick={() =>
                        window.open("https://rack-it.com.au/", "_blank")
                      }
                      className="mb-4 cursor-pointer border-2 border-transparent hover:border-gray-300 hover:border-dashed rounded-md p-2"
                    >
                      <p className="text-lg font-semibold text-[#003b4a]">
                        Rack it planner
                      </p>
                      <p className="text-xs mb-2">
                        Try Our Online Planner — See Our Range & Design Your
                        Ultimate Storage Space In 4 Easy Steps Today. Learn
                        More! Design your Rack It garage setup, then shop
                        in-store at Bunnings or checkout online. Rack It Starter
                        Kit. Rack It Storage Planner. Rack It Shelving System.
                        Rack It Garage Shelving. Available at Bunnings.
                      </p>
                      <img
                        src="/banners/rack_it_planner_banner.jpg"
                        alt="Rack it planner"
                        className="rounded-md w-full object-cover"
                      />
                    </div>

                    <div
                      onClick={() =>
                        window.open("https://flexistorage.com.au/", "_blank")
                      }
                      className="mb-4 cursor-pointer border-2 border-transparent hover:border-gray-300 hover:border-dashed rounded-md p-2"
                    >
                      <p className="text-lg font-semibold text-[#003b4a]">
                        Home Solution
                      </p>
                      <p className="text-xs mb-2">
                        Flexi Storage offers customizable wall-mounted systems
                        (Double/Single Slot), free-standing frames, and starter
                        kits for easy, flexible home storage.
                      </p>
                      <img
                        className="rounded-md w-full object-cover"
                        src="/banners/home_solution_banner.jpg"
                        alt="Home Solution"
                      />
                    </div>
                    <div
                      onClick={() =>
                        window.open(
                          "https://flexistorage.com.au/clever-cube",
                          "_blank"
                        )
                      }
                      className="mb-4 cursor-pointer border-2 border-transparent hover:border-gray-300 hover:border-dashed rounded-md p-2"
                    >
                      <p className="text-lg font-semibold text-[#003b4a]">
                        Clever Cube
                      </p>
                      <p className="text-xs mb-2">
                        Create & Organise Your Space With Flexi Storage. Many
                        Options, Simple To Use & Affordable! Need More Space?
                        Explore Our Carefully Designed, Affordable Storage
                        Solutions Online Now! Get Help. View Products.
                        Highlights: Offering A Range Of Products, Where To Buy
                        Option Available.
                      </p>
                      <img
                        className="rounded-md w-full object-cover"
                        src="/banners/clever_cube_banner.jpg"
                        alt="Clever Cube"
                      />
                    </div>
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
                        className="w-16 h-16 flex items-center justify-center hover:bg-secondary rounded-full transition-colors cursor-pointer"
                      >
                        <Menu />
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
