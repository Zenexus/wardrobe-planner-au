import { useNavigate } from "react-router-dom";
import { ArrowLeft, Menu, NotebookPen } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import MenuSheetContent from "@/components/MenuSheetContent";

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
              <button
                type="button"
                className="w-16 h-16 flex items-center justify-center cursor-pointer hover:bg-gray-200 rounded-full"
                onClick={() => navigate("/")}
                aria-label="Back"
              >
                <ArrowLeft size={24} />
              </button>
            </div>

            <div className="flex items-center gap-2 pr-4">
              <a
                href=""
                target="_blank"
                rel="noreferrer"
                className="w-16 h-16 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors"
                aria-label="Hot Sell List"
                title="Hot Sell List"
              >
                <NotebookPen size={24} />
              </a>

              <Sheet>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    aria-label="Open menu"
                    className="w-16 h-16 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
                  >
                    <Menu size={24} />
                  </button>
                </SheetTrigger>
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
