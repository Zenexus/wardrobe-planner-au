"use client";

import { Info } from "lucide-react";
import { useState, useEffect } from "react";
import { useStore } from "@/store";
import { WardrobeInstance, SelectedOrganizer } from "@/types";
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
  const screenshotFromStore = useStore(
    (s: ReturnType<typeof useStore.getState>) => s.canvasScreenshotDataUrl
  );

  // Use state for screenshot to avoid hydration mismatch
  const [screenshot, setScreenshot] = useState<string | null>(null);

  // Load screenshot from localStorage after hydration
  useEffect(() => {
    const screenshotFromStorage =
      window.localStorage.getItem("designScreenshot");
    setScreenshot(screenshotFromStore || screenshotFromStorage);
  }, [screenshotFromStore]);

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

  // Calculate total price for wardrobes
  const wardrobeTotalPrice = wardrobeInstances.reduce(
    (sum: number, instance: WardrobeInstance) => {
      return sum + instance.product.price;
    },
    0
  );

  // Calculate total price for organizers
  const organizerTotalPrice = selectedOrganizers.reduce(
    (sum: number, item: SelectedOrganizer) => {
      return sum + item.organizer.price * item.quantity;
    },
    0
  );

  // Calculate overall total price
  const totalPrice = wardrobeTotalPrice + organizerTotalPrice;

  return (
    <div className="min-h-screen bg-background">
      <SummaryHeader />
      <div className="px-10">
        <div className="pl-6 pt-4">
          <h1 className="text-3xl font-bold text-foreground">Design Summary</h1>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex min-h-[calc(100vh-140px)] px-4 lg:px-10 mt-10 flex-col lg:flex-row gap-6 lg:gap-0">
        {/* Left side - Tabs (60%) */}
        <div className="w-full lg:w-[60%] bg-background p-6">
          <Tabs defaultValue="products">
            <TabsList className="w-[200px] lg:w-[350px]">
              <TabsTrigger value="products" className="text-xs lg:text-sm">
                Product list
              </TabsTrigger>
              <TabsTrigger value="assembly" className="text-xs lg:text-sm">
                Assembly overview
              </TabsTrigger>
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
                      <h3 className="text-lg font-semibold text-foreground mb-4">
                        Add-on Organisers
                      </h3>
                    </div>
                    {selectedOrganizers.map((item: SelectedOrganizer) => (
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
                                <p className="text-sm text-secondary-foreground">
                                  #{item.organizer.itemNumber}
                                </p>
                                <div>
                                  <span className="text-sm text-secondary-foreground pr-2">
                                    Dimensions:
                                  </span>
                                  <span className="text-sm text-secondary-foreground">
                                    {item.organizer.width} ×{" "}
                                    {item.organizer.depth} ×{" "}
                                    {item.organizer.height} cm
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-start justify-end font-semibold text-foreground">
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
                            <div className="text-sm text-secondary-foreground">
                              Qty: {item.quantity}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Total section */}
                <div className="border-t-2 border-border pt-4 mt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-lg font-semibold">
                        Total (
                        {groupedWardrobes.length + selectedOrganizers.length}{" "}
                        unique items,{" "}
                        {wardrobeInstances.length +
                          selectedOrganizers.reduce(
                            (sum: number, item: SelectedOrganizer) =>
                              sum + item.quantity,
                            0
                          )}{" "}
                        total)
                      </span>
                    </div>
                    <div className="flex items-start text-2xl font-bold text-foreground">
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
              <div className="text-secondary-foreground">
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
            <Alert className="bg-secondary">
              <Info className="h-5 w-5" />
              <AlertDescription className="text-foreground">
                Please check with your local Bunnings store for stock
                availability. If your local store does not have all of your
                required components, you may place an order at your local
                Bunnings Customer Special Order desk.
              </AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Right side - Screenshot (40%) */}
        <div className="w-full lg:w-[40%] p-6">
          {screenshot ? (
            <div className="w-full flex justify-center border border-primary px-10">
              <img
                src={screenshot}
                alt="Design screenshot"
                className="max-h-[60vh] w-full border border-border bg-background"
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-secondary-foreground">
              <div className="text-center">
                <p className="text-lg">No screenshot available</p>
                <p className="text-sm mt-2">Return and press Finalise again.</p>
              </div>
            </div>
          )}

          <div className="mt-10 flex justify-start gap-2 items-start">
            <HeartHandshake className="w-5 h-5 text-foreground shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Need help? We&apos;re right here.
              </h3>

              <div>
                <p className="text-secondary-foreground mb-4">
                  Whether you have a question or would like us to review your
                  design before you buy, we&apos;d love to help.
                </p>

                <div className="mb-4">
                  <a
                    href="https://flexistorage.com.au/contact-us/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline cursor-pointer text-secondary-foreground hover:text-foreground"
                  >
                    Contact us
                  </a>
                </div>

                <p className=" text-secondary-foreground mb-2">
                  Keep this design code handy:
                </p>
                <div className="flex items-center gap-2">
                  <code className="bg-secondary px-3 py-2 rounded font-mono text-lg font-bold text-foreground">
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
                        ? "text-[--tertiary]"
                        : "text-[--primary]"
                    }`}
                  >
                    {showCopiedMessage ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-secondary-foreground mt-2">
                  Use this code to retrieve your design later or share it with
                  our team.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-20 text-xs text-secondary-foreground leading-relaxed space-y-2 break-words">
            <p>
              * While we endeavour to provide accurate and up to date
              information, prices and availability may vary by store. Please
              check in-store at Bunnings or online at bunnings.com.au for prices
              and availability. Please note, products and sizes may not be
              available at all Bunnings stores. We recommend customers contact
              their local Bunnings store first and foremost for availability to
              avoid disappointment. For more information on our Flexi Storage
              range, please consult a team member at your local Bunnings
              Warehouse.
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
              * All freestanding units 500mm or greater in height should be
              anchored to the ground, wall or other suitable surface to avoid
              serious injury or death. To help avoid any serious injury or
              death, these products include a bracket to prevent toppling. We
              strongly recommend that these products be permanently fixed to the
              wall or other suitable surface. Different surface materials
              require different attachments. Please seek professional advice if
              you are in doubt as to which fixing device to use. Regularly check
              your fixing device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Summary;
