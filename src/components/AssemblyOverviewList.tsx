import { WardrobeInstance } from "@/types";
import { Button } from "@/components/ui/button";

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
              <div className="mt-2">
                <Button size="sm" variant="outline" className="cursor-pointer">
                  Download materials
                </Button>
              </div>
            </div>
          </div>

          {/* Placeholder sections for later customization */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-gray-50 rounded p-3">
              <div className="text-sm font-medium text-gray-900 mb-1">
                Materials
              </div>
              <div className="text-xs text-gray-600">
                Add boards, panels, rails...
              </div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-sm font-medium text-gray-900 mb-1">
                Tools
              </div>
              <div className="text-xs text-gray-600">Add tools list...</div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-sm font-medium text-gray-900 mb-1">
                Notes
              </div>
              <div className="text-xs text-gray-600">Add custom notes...</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
