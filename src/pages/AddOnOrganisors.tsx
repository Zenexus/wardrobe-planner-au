import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Menu, Plus, Minus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import MenuSheetContent from "@/components/MenuSheetContent";
import { useStore } from "@/store";
import { Organizer } from "@/types";
import organisorsData from "@/organisor.json";

const AddOnOrganisors = () => {
  const navigate = useNavigate();
  const { selectedOrganizers, addOrganizer, updateOrganizerQuantity } =
    useStore();

  // Extract organizers from JSON data
  const organizers: Organizer[] = organisorsData.organisors;

  // Handle adding/updating organizer quantity
  const handleOrganizerQuantityChange = (
    organizer: Organizer,
    quantity: number
  ) => {
    if (quantity === 0) {
      updateOrganizerQuantity(organizer.itemNumber, 0);
    } else {
      const existingOrganizer = selectedOrganizers.find(
        (item) => item.organizer.itemNumber === organizer.itemNumber
      );

      if (existingOrganizer) {
        updateOrganizerQuantity(organizer.itemNumber, quantity);
      } else {
        addOrganizer({ organizer, quantity });
      }
    }
  };

  // Get current quantity for an organizer
  const getOrganizerQuantity = (itemNumber: string): number => {
    const found = selectedOrganizers.find(
      (item) => item.organizer.itemNumber === itemNumber
    );
    return found ? found.quantity : 0;
  };

  // Calculate total price
  const totalPrice = selectedOrganizers.reduce((sum, item) => {
    return sum + item.organizer.price * item.quantity;
  }, 0);

  // Handle continue to summary
  const handleContinue = () => {
    navigate("/summary");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
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

      {/* Main Content */}
      <div className="px-10">
        <div className="pl-6 pt-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Add-On Organisers
          </h1>
          <p className="text-gray-600 mb-8">
            Complete your wardrobe with these optional organisers to maximize
            your storage efficiency.
          </p>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex min-h-[calc(100vh-200px)] px-10">
        {/* Left side - Organizer Grid (70%) */}
        <div className="w-[70%] pr-6">
          <div className="grid grid-cols-2 gap-6">
            {organizers.map((organizer) => {
              const quantity = getOrganizerQuantity(organizer.itemNumber);
              const isSelected = quantity > 0;

              return (
                <div
                  key={organizer.itemNumber}
                  className={`border rounded-lg p-4 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {/* Product Image */}
                  <div className="relative mb-4">
                    <img
                      src={organizer.images[0]}
                      alt={organizer.name}
                      className="w-full h-48 object-cover rounded-md"
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                        <Check size={16} />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">
                      {organizer.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      #{organizer.itemNumber}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span>
                        {organizer.width} × {organizer.depth} ×{" "}
                        {organizer.height} cm
                      </span>
                    </div>
                    <div className="flex items-start font-semibold text-gray-900">
                      <span className="text-sm pt-0.5">$</span>
                      <span className="text-xl">
                        {Math.floor(organizer.price)}
                      </span>
                      <span className="text-sm pt-0.5">
                        .{(organizer.price % 1).toFixed(2).substring(2)}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          handleOrganizerQuantityChange(
                            organizer,
                            Math.max(0, quantity - 1)
                          )
                        }
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                        disabled={quantity === 0}
                      >
                        <Minus size={16} />
                      </button>

                      <span className="w-12 text-center font-medium text-lg">
                        {quantity}
                      </span>

                      <button
                        onClick={() =>
                          handleOrganizerQuantityChange(organizer, quantity + 1)
                        }
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {quantity > 0 && (
                      <div className="text-sm text-gray-600">
                        Subtotal: ${(organizer.price * quantity).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right side - Summary (30%) */}
        <div className="w-[30%] pl-6">
          <div className="sticky top-32">
            <div className="border rounded-lg p-6 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>

              {selectedOrganizers.length === 0 ? (
                <p className="text-gray-500 mb-6">No organisers selected</p>
              ) : (
                <div className="space-y-3 mb-6">
                  {selectedOrganizers.map((item) => (
                    <div
                      key={item.organizer.itemNumber}
                      className="flex justify-between items-start text-sm"
                    >
                      <div className="flex-1 pr-2">
                        <div className="font-medium text-gray-900">
                          {item.organizer.name}
                        </div>
                        <div className="text-gray-500">
                          Qty: {item.quantity} × $
                          {item.organizer.price.toFixed(2)}
                        </div>
                      </div>
                      <div className="font-medium text-gray-900">
                        ${(item.organizer.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Total */}
              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">
                    Total Organisers
                  </span>
                  <div className="flex items-start text-xl font-bold text-gray-900">
                    <span className="text-sm pt-1">$</span>
                    <span className="text-xl">{Math.floor(totalPrice)}</span>
                    <span className="text-sm pt-1">
                      .{(totalPrice % 1).toFixed(2).substring(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              <Button
                onClick={handleContinue}
                className="w-full h-12 text-lg rounded-full flex items-center justify-center gap-2"
              >
                Continue to Summary
                <ArrowRight size={20} />
              </Button>

              {/* Skip Option */}
              <Button
                variant="ghost"
                onClick={handleContinue}
                className="w-full mt-3 text-gray-600 hover:text-gray-900"
              >
                Skip organisers
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddOnOrganisors;
