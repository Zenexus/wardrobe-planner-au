import { Info } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/store";
import { WardrobeInstance } from "@/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BunningsCard from "@/components/BunningsCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AssemblyOverviewList from "@/components/AssemblyOverviewList";
import SummaryHeader from "@/components/SummaryHeader";
import ExpandableBundleCard from "@/components/ExpandableBundleCard";
import { HeartHandshake } from "lucide-react";

// Type for grouped wardrobes
type GroupedWardrobe = {
  product: WardrobeInstance["product"];
  quantity: number;
  totalPrice: number;
  firstInstance: WardrobeInstance;
};

const Summary = () => {
  const { wardrobeInstances, selectedOrganizers } = useStore();
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const screenshotFromStore = useStore((s) => s.canvasScreenshotDataUrl);
  const screenshotFromStorage =
    typeof window !== "undefined"
      ? window.localStorage.getItem("designScreenshot")
      : null;
  const screenshot = screenshotFromStore || screenshotFromStorage;

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
  console.log(groupedWardrobes);
  // Calculate total price for wardrobes
  const wardrobeTotalPrice = wardrobeInstances.reduce((sum, instance) => {
    return sum + instance.product.price;
  }, 0);

  // Calculate total price for organizers
  const organizerTotalPrice = selectedOrganizers.reduce((sum, item) => {
    return sum + item.organizer.price * item.quantity;
  }, 0);

  // Calculate overall total price
  const totalPrice = wardrobeTotalPrice + organizerTotalPrice;

  return (
    <div className="min-h-screen bg-white">
      <SummaryHeader />
      <div className="px-10">
        <div className="pl-6 pt-4">
          <h1 className="text-3xl font-bold text-gray-900">Design Summary</h1>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex min-h-[calc(100vh-140px)] px-10 mt-10">
        {/* Left side - Tabs (60%) */}
        <div className="w-[60%] bg-white p-6">
          <Tabs defaultValue="products" className="w-full">
            <TabsList>
              <TabsTrigger value="products">Product list</TabsTrigger>
              <TabsTrigger value="assembly">Assembly overview</TabsTrigger>
              {/* Gallery tab intentionally hidden for now */}
            </TabsList>

            <TabsContent value="products" className="mt-6">
              <div className="space-y-4">
                {groupedWardrobes.map((group) => (
                  <ExpandableBundleCard
                    key={group.product.itemNumber}
                    group={group}
                  />
                ))}

                {/* Organizers section */}
                {selectedOrganizers.length > 0 && (
                  <>
                    <div className="border-t border-gray-200 pt-4 mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Add-on Organisers
                      </h3>
                    </div>
                    {selectedOrganizers.map((item) => (
                      <div
                        key={item.organizer.itemNumber}
                        className="border border-border p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <img
                                src={item.organizer.images[0]}
                                alt={item.organizer.name}
                                className="w-16 h-16 object-cover rounded-md"
                              />
                              <div>
                                <h3 className="font-semibold text-foreground">
                                  {item.organizer.name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  #{item.organizer.itemNumber}
                                </p>
                                <div>
                                  <span className="text-sm text-gray-600 pr-2">
                                    Dimensions:
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    {item.organizer.width} ×{" "}
                                    {item.organizer.depth} ×{" "}
                                    {item.organizer.height} cm
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-start justify-end font-semibold text-gray-900">
                              <span className="text-sm pt-0.5">$</span>
                              <span className="text-lg">
                                {Math.floor(
                                  item.organizer.price * item.quantity
                                )}
                              </span>
                              <span className="text-sm pt-0.5">
                                .
                                {((item.organizer.price * item.quantity) % 1)
                                  .toFixed(2)
                                  .substring(2)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              Qty: {item.quantity}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Total section */}
                <div className="border-t-2 border-gray-100 pt-4 mt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-lg font-semibold">
                        Total (
                        {groupedWardrobes.length + selectedOrganizers.length}{" "}
                        unique items,{" "}
                        {wardrobeInstances.length +
                          selectedOrganizers.reduce(
                            (sum, item) => sum + item.quantity,
                            0
                          )}{" "}
                        total)
                      </span>
                    </div>
                    <div className="flex items-start text-2xl font-bold text-gray-900">
                      <span className="text-lg pt-1">$</span>
                      <span className="text-2xl">{Math.floor(totalPrice)}</span>
                      <span className="text-lg pt-1">
                        .{(totalPrice % 1).toFixed(2).substring(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="assembly" className="mt-6">
              <div className="text-gray-700">
                <h2 className="text-xl font-semibold mb-4">
                  Assembly overview
                </h2>
                <AssemblyOverviewList instances={wardrobeInstances} />
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-4">
            <BunningsCard />
          </div>

          <div className="mt-4">
            <Alert className="bg-gray-100">
              <Info className="h-5 w-5" />
              <AlertDescription className="text-gray-800">
                Please check with your local Bunnings store for stock
                availability. If your local store does not have all of your
                required components, you may place an order at your local
                Bunnings Customer Special Order desk.
              </AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Right side - Screenshot (40%) */}
        <div className="w-[40%] p-6">
          {screenshot ? (
            <div className="w-full flex justify-center">
              <img
                src={screenshot}
                alt="Design screenshot"
                className="max-w-full max-h-[80vh] border border-gray-200 bg-white"
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg">No screenshot available</p>
                <p className="text-sm mt-2">Return and press Finalise again.</p>
              </div>
            </div>
          )}

          <div className="mt-10 flex justify-start gap-2 items-start">
            <HeartHandshake className="w-5 h-5 text-gray-900 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Need help? We're right here.
              </h3>

              <div>
                <p className="text-gray-700 mb-4">
                  Whether you've a question or would like us to review your
                  design before you buy, we'd love to help.
                </p>

                <div className="mb-4">
                  <a
                    href="https://flexistorage.com.au/contact-us/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline cursor-pointer text-gray-700 hover:text-gray-900"
                  >
                    Contact us
                  </a>
                </div>

                <p className=" text-gray-600 mb-2">
                  Keep this design code handy:
                </p>
                <div className="flex items-center gap-2">
                  <code className="bg-gray-100 px-3 py-2 rounded font-mono text-lg font-bold text-gray-900">
                    {useStore.getState().currentDesignCode || "WDC75D"}
                  </code>
                  <button
                    onClick={() => {
                      const code =
                        useStore.getState().currentDesignCode || "WDC75D";
                      navigator.clipboard.writeText(code);
                      setShowCopiedMessage(true);
                      setTimeout(() => setShowCopiedMessage(false), 2000);
                    }}
                    className={`text-sm cursor-pointer font-medium transition-colors ${
                      showCopiedMessage
                        ? "text-[var(--tertiary)]"
                        : "text-[var(--primary)]"
                    }`}
                  >
                    {showCopiedMessage ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-gray-500 mt-2">
                  Use this code to retrieve your design later or share it with
                  our team.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-20 text-xs text-gray-600 leading-relaxed space-y-2 break-words">
            <p>
              * While we endeavour to provide accurate and up to date
              information, prices and availability may vary by store. Please
              check in-store at Bunnings or online at bunnings.com.au for prices
              and availability. Please note, products and sizes may not be
              available at all Bunnings stores. We recommend customers contact
              their local Bunnings store first and foremost for availability to
              avoid disappointment. For more information on our Rack It range,
              please consult a team member at your local Bunnings Warehouse.
            </p>
            <p>
              * We have tried to be very specific with the dimensions here.
              However, please note that manufacturing tolerances may lead to
              slight variations to the system size and individual product
              dimensions shown above. This will not affect the function or
              quality of the product but may lead to slight differences between
              the Planner and the actual build dimensions.
            </p>
            <p>
              * By providing your postcode here, you help us to better allocate
              stock throughout our network.
            </p>
            <p>
              * All freestanding units 500mm or greater in height should be
              anchored to the ground, wall or other suitable surface to avoid
              serious injury or death. To help avoid any serious injury or
              death, these products have been ﬁtted with a ground mounting
              bracket to prevent toppling. We strongly recommend that these
              products be permanently fixed to the ground or wall. Fixing
              devices are not included since different surface materials require
              different attachments. Please seek professional advice if you are
              in doubt as to which fixing device to use. Regularly check your
              fixing device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Summary;
