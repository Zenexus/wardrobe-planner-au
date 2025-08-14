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
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

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
      {groups.map((group) => (
        <div
          key={group.product.itemNumber}
          className="border border-gray-200 rounded-md p-4"
        >
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
                <span className="text-lg">{Math.floor(group.totalPrice)}</span>
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

          {/* Important to know */}
          <div className="mt-4 bg-gray-50 rounded p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-1">
              <Info className="size-4" />
              <span>Important to know</span>
            </div>
            <div className="text-xs text-gray-800 space-y-1">
              <div>
                This furniture must be fixed to the wall with the enclosed wall
                fastener.
              </div>
              <div>
                Different wall materials require different types of fixing
                devices. Use fixing devices suitable for the walls in your home,
                sold separately.
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
      ))}
    </div>
  );
}
