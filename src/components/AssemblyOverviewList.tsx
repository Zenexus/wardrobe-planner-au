import { WardrobeInstance } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Download,
  Youtube,
  PackageSearch,
  PackageOpen,
  Drill,
  Check,
  Info,
  // ChevronDown removed - AccordionTrigger has built-in chevron
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  getBundleComposition,
  type CompositionItem,
} from "@/utils/bundleComposition";

type AssemblyOverviewListProps = {
  instances: WardrobeInstance[];
};

type GroupedWardrobe = {
  product: WardrobeInstance["product"];
  quantity: number;
  totalPrice: number;
  firstInstance: WardrobeInstance;
};

function groupWardrobesByItemNumber(
  instances: WardrobeInstance[]
): GroupedWardrobe[] {
  const grouped = instances.reduce(
    (acc: Record<string, GroupedWardrobe>, instance: WardrobeInstance) => {
      const key = instance.product.itemNumber;
      if (acc[key]) {
        acc[key].quantity += 1;
        acc[key].totalPrice += instance.product.price;
      } else {
        acc[key] = {
          product: instance.product,
          quantity: 1,
          totalPrice: instance.product.price,
          firstInstance: instance,
        };
      }
      return acc;
    },
    {}
  );

  return Object.values(grouped);
}

function AssemblyCompositionItemCard({ item }: { item: CompositionItem }) {
  return (
    <div className="bg-white border border-gray-100 rounded-md p-4 space-y-3">
      {/* Item Header */}
      <div className="flex items-center gap-3">
        <img
          src={item.thumbnail}
          alt={item.name}
          className="w-12 h-12 object-cover rounded-md"
        />
        <div className="flex-1">
          <h5 className="font-medium text-sm text-gray-900">{item.name}</h5>
          <p className="text-xs text-gray-600">#{item.itemNumber}</p>
          <div className="flex items-center gap-2 mt-1">
            {item.quantity > 1 && (
              <span className="text-xs text-gray-500">
                Qty: {item.quantity}
              </span>
            )}
            <span className="text-xs text-gray-500 capitalize">
              {item.type === "base-wardrobe" ? "Base Unit" : "Accessory"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {item.instructions && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  size="icon"
                  className="cursor-pointer rounded-full w-8 h-8"
                  aria-label="Download Assembly Instructions (PDF)"
                >
                  <a
                    href={`/Instructions${item.instructions}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="size-3" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download Assembly Instructions</TooltipContent>
            </Tooltip>
          )}
          {item.youtube && item.youtube.trim() !== "" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  size="icon"
                  className="cursor-pointer rounded-full w-8 h-8"
                  aria-label="Watch Assembly Instructions on YouTube"
                >
                  <a
                    href={item.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Youtube className="size-3" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Watch on YouTube</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Assembly Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded p-2">
          <div className="flex items-center gap-1 text-xs font-medium text-gray-900 mb-1">
            <PackageSearch className="size-3" />
            <span>Pack Details</span>
          </div>
          <div className="text-xs whitespace-pre-line text-gray-700">
            {item.packDetails ?? "—"}
          </div>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <div className="flex items-center gap-1 text-xs font-medium text-gray-900 mb-1">
            <PackageOpen className="size-3" />
            <span>Included</span>
          </div>
          <div className="text-xs text-gray-700 space-y-1">
            {(item.included?.split("\n") ?? []).map((line, idx) => (
              <div key={idx} className="flex items-start gap-1">
                <Check
                  className="size-3 mt-0.5 text-primary shrink-0"
                  strokeWidth={2.5}
                />
                <span>{line}</span>
              </div>
            ))}
            {!item.included && <div>—</div>}
          </div>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <div className="flex items-center gap-1 text-xs font-medium text-gray-900 mb-1">
            <Drill className="size-3" />
            <span>Tools Required</span>
          </div>
          <div className="text-xs text-gray-700 space-y-1">
            {(item.toolsRequired?.split("\n") ?? []).map((line, idx) => (
              <div key={idx} className="flex items-start gap-1">
                <Check
                  className="size-3 mt-0.5 text-[#003B4A]"
                  strokeWidth={2.5}
                />
                <span>{line}</span>
              </div>
            ))}
            {!item.toolsRequired && <div>—</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssemblyOverviewList({
  instances,
}: AssemblyOverviewListProps) {
  const groups = groupWardrobesByItemNumber(instances);

  if (groups.length === 0) {
    return (
      <div className="text-sm text-gray-600">No items to assemble yet.</div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const composition = getBundleComposition(group.firstInstance);

        return (
          <div
            key={group.product.itemNumber}
            className="border border-gray-200 rounded-md"
          >
            {composition.isBundle ? (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem
                  value="bundle-composition"
                  className="border-none"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <img
                          src={group.product.thumbnail}
                          alt={group.product.name}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-gray-900">
                              {group.product.name}
                            </div>
                            <span className="text-xs bg-primary text-background px-2 py-1 rounded-full">
                              Bundle Option
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            #{group.product.itemNumber}
                          </div>
                          <div className="text-sm text-gray-600">
                            {group.product.width} × {group.product.depth} ×{" "}
                            {group.product.height} cm
                          </div>
                          <div className="text-xs text-gray-500">
                            Qty: {group.quantity}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex items-start gap-2">
                        <div>
                          <div className="flex items-start justify-end font-semibold text-gray-900">
                            <span className="text-sm pt-0.5">$</span>
                            <span className="text-lg">
                              {Math.floor(group.totalPrice)}
                            </span>
                            <span className="text-sm pt-0.5">
                              .{(group.totalPrice % 1).toFixed(2).substring(2)}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-end gap-2">
                            {group.product.instructions && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    asChild
                                    size="icon"
                                    className="cursor-pointer rounded-full"
                                    aria-label="Download Assembly Instructions (PDF)"
                                  >
                                    <a
                                      href={`/Instructions${group.product.instructions}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <Download className="size-4" />
                                    </a>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Download Assembly Instructions
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {group.product.youtube &&
                              group.product.youtube.trim() !== "" && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      asChild
                                      size="icon"
                                      className="cursor-pointer rounded-full"
                                      aria-label="Watch Assembly Instructions on YouTube"
                                    >
                                      <a
                                        href={group.product.youtube}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <Youtube className="size-4" />
                                      </a>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Watch on YouTube
                                  </TooltipContent>
                                </Tooltip>
                              )}
                          </div>
                        </div>
                        <AccordionTrigger className="hover:no-underline p-0 h-auto" />
                      </div>
                    </div>
                  </div>

                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      <div className="text-sm font-medium text-gray-900">
                        Bundle composition ({composition.totalItems.length}{" "}
                        items):
                      </div>
                      <div className="space-y-4">
                        {composition.totalItems.map((item, index) => (
                          <AssemblyCompositionItemCard
                            key={`${item.itemNumber}-${index}`}
                            item={item}
                          />
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : (
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <img
                      src={group.product.thumbnail}
                      alt={group.product.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <div className="space-y-1">
                      <div className="font-semibold text-gray-900">
                        {group.product.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        #{group.product.itemNumber}
                      </div>
                      <div className="text-sm text-gray-600">
                        {group.product.width} × {group.product.depth} ×{" "}
                        {group.product.height} cm
                      </div>
                      <div className="text-xs text-gray-500">
                        Qty: {group.quantity}
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
                    <div className="mt-2 flex items-center justify-end gap-2">
                      {group.product.instructions && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              asChild
                              size="icon"
                              className="cursor-pointer rounded-full"
                              aria-label="Download Assembly Instructions (PDF)"
                            >
                              <a
                                href={`/Instructions${group.product.instructions}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="size-4" />
                              </a>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Download Assembly Instructions
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {group.product.youtube &&
                        group.product.youtube.trim() !== "" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                asChild
                                size="icon"
                                className="cursor-pointer rounded-full"
                                aria-label="Watch Assembly Instructions on YouTube"
                              >
                                <a
                                  href={group.product.youtube}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Youtube className="size-4" />
                                </a>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Watch on YouTube</TooltipContent>
                          </Tooltip>
                        )}
                    </div>
                  </div>
                </div>

                {/* Assembly sections for non-bundle items only */}
                {/* Important to know */}
                <div className="mt-4 bg-gray-50 rounded p-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-1">
                    <Info className="size-4" />
                    <span>Important to know</span>
                  </div>
                  <div className="text-xs text-gray-800 space-y-1">
                    <div>
                      This furniture must be fixed to the wall with the enclosed
                      wall fastener.
                    </div>
                    <div>
                      Different wall materials require different types of fixing
                      devices. Use fixing devices suitable for the walls in your
                      home, sold separately.
                    </div>
                    <div>
                      Two persons are needed for the assembly of this furniture.
                    </div>
                  </div>
                </div>

                {/* Assembly overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-gray-50 rounded p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-1">
                      <PackageSearch className="size-4" />
                      <span>Pack Details</span>
                    </div>
                    <div className="text-xs whitespace-pre-line text-gray-700">
                      {group.product.packDetails ?? "—"}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-1">
                      <PackageOpen className="size-4" />
                      <span>Included</span>
                    </div>
                    <div className="text-xs text-gray-700 space-y-1">
                      {(group.product.included?.split("\n") ?? []).map(
                        (line, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <Check
                              className="size-4 mt-0.5 text-[#003B4A]"
                              strokeWidth={2.5}
                            />
                            <span>{line}</span>
                          </div>
                        )
                      )}
                      {!group.product.included && <div>—</div>}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-1">
                      <Drill className="size-4" />
                      <span>Tools Required</span>
                    </div>
                    <div className="text-xs text-gray-700 space-y-1">
                      {(group.product.toolsRequired?.split("\n") ?? []).map(
                        (line, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <Check
                              className="size-4 mt-0.5 text-[#003B4A]"
                              strokeWidth={2.5}
                            />
                            <span>{line}</span>
                          </div>
                        )
                      )}
                      {!group.product.toolsRequired && <div>—</div>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
