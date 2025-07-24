import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useStore } from "@/store";
import { WardrobeInstance } from "@/types";

// Type for grouped wardrobes
type GroupedWardrobe = {
  product: WardrobeInstance["product"];
  quantity: number;
  totalPrice: number;
  firstInstance: WardrobeInstance;
};

const Summary = () => {
  const navigate = useNavigate();
  const { wardrobeInstances } = useStore();

  // Function to group wardrobe instances by itemNumber and calculate quantities
  const groupWardrobesByItemNumber = (
    instances: WardrobeInstance[]
  ): GroupedWardrobe[] => {
    const groupedList = instances.reduce(
      (acc: Record<string, GroupedWardrobe>, instance: WardrobeInstance) => {
        const itemNumber = instance.product.itemNumber;

        if (acc[itemNumber]) {
          // If item already exists, increment quantity
          acc[itemNumber].quantity += 1;
          acc[itemNumber].totalPrice += instance.product.price;
        } else {
          // If new item, create new entry
          acc[itemNumber] = {
            product: instance.product,
            quantity: 1,
            totalPrice: instance.product.price,
            firstInstance: instance, // Keep reference to first instance for other data
          };
        }

        return acc;
      },
      {}
    );

    // Convert object to array for easier rendering
    return Object.values(groupedList);
  };

  // Get grouped wardrobes
  const groupedWardrobes = groupWardrobesByItemNumber(wardrobeInstances);

  // Calculate total price
  const totalPrice = wardrobeInstances.reduce((sum, instance) => {
    return sum + instance.product.price;
  }, 0);

  return (
    <div className="min-h-screen bg-white">
      {/* Top section with logo, back button and title */}
      <div className="px-10 py-6">
        <div className="flex items-center justify-between mb-4">
          {/* Logo and Back Button */}
          <div className="flex items-center gap-4">
            <img
              src="/logo/Logo_Wardrobe.png"
              alt="Wardrobe Logo"
              className="h-12 w-auto object-contain"
            />
            <div
              className="flex items-center justify-center pl-5 cursor-pointer hover:bg-gray-200 rounded-full p-4"
              onClick={() => navigate("/")}
            >
              <ArrowLeft size={24} />
            </div>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Design Summary</h1>
      </div>

      {/* Main content area */}
      <div className="flex min-h-[calc(100vh-140px)] px-10 mt-10">
        {/* Left side - Product List (60%) */}
        <div className="w-[60%] bg-white p-6">
          <div>
            <h2 className="text-xl font-semibold mb-6">Product list</h2>
            <div className="space-y-4">
              {groupedWardrobes.map((group, index) => (
                <div
                  key={group.product.itemNumber}
                  className="border border-gray-200 p-4 "
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <img
                          src={group.product.thumbnail}
                          alt={group.product.name}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {group.product.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            #{group.product.itemNumber}
                          </p>
                          <div>
                            <span className="text-sm text-gray-600 pr-2">
                              Dimensions:
                            </span>
                            <span className="text-sm text-gray-600">
                              {group.product.width} × {group.product.depth} ×{" "}
                              {group.product.height} cm
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-start justify-end font-semibold text-gray-900">
                        <span className="text-sm pt-0.5">$</span>
                        <span className="text-lg">
                          {Math.floor(group.totalPrice)}
                        </span>
                        <span className="text-sm pt-0.5">
                          .{(group.totalPrice % 1).toFixed(2).substring(2)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Qty: {group.quantity}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Total section */}
              <div className="border-t-2 border-gray-100 pt-4 mt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-lg font-semibold">
                      Total ({groupedWardrobes.length} unique items,{" "}
                      {wardrobeInstances.length} total)
                    </span>
                  </div>
                  <div className="flex items-start font-bold text-gray-900">
                    <span className="text-lg pt-1">$</span>
                    <span className="text-2xl">{Math.floor(totalPrice)}</span>
                    <span className="text-lg pt-1">
                      .{(totalPrice % 1).toFixed(2).substring(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Blank for now (40%) */}
        <div className="w-[40%] bg-gray-100 p-6">
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-lg">Right Panel</p>
              <p className="text-sm mt-2">
                Content area reserved for future features
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Summary;
