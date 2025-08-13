import { SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function MenuSheetContent() {
  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="border-b">
        <SheetTitle>Menu</SheetTitle>
      </SheetHeader>
      <div
        className="flex-1 overflow-y-auto p-4"
        style={{ scrollbarGutter: "stable" }}
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-700">
            Help and actions coming soon.
          </div>
        </div>
      </div>
    </div>
  );
}
