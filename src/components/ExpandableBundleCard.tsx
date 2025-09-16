// ChevronDown removed - AccordionTrigger has its own built-in chevron
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
import type { WardrobeInstance } from "@/types";

type GroupedWardrobe = {
  product: WardrobeInstance["product"];
  quantity: number;
  totalPrice: number;
  firstInstance: WardrobeInstance;
};

type ExpandableBundleCardProps = {
  group: GroupedWardrobe;
};

function CompositionItemCard({ item }: { item: CompositionItem }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
      <img
        src={item.thumbnail}
        alt={item.name}
        className="w-12 h-12 object-cover rounded-md"
      />
      <div className="flex-1">
        <h4 className="font-medium text-sm text-gray-900">{item.name}</h4>
        <p className="text-xs text-gray-600">#{item.itemNumber}</p>
        {item.width && item.height && item.depth && (
          <p className="text-xs text-gray-500">
            {item.width} × {item.depth} × {item.height} cm
          </p>
        )}
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold text-gray-900">
          ${item.price.toFixed(2)}
        </div>
        {item.quantity > 1 && (
          <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
        )}
        <div className="text-xs text-gray-500 capitalize">
          {item.type === "base-wardrobe" ? "Base" : "Add-on"}
        </div>
      </div>
    </div>
  );
}

export default function ExpandableBundleCard({
  group,
}: ExpandableBundleCardProps) {
  const composition = getBundleComposition(group.firstInstance);

  // If not a bundle, render regular card
  if (!composition.isBundle) {
    return (
      <div className="border border-border p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <img
                src={group.product.thumbnail}
                alt={group.product.name}
                className="w-16 h-16 object-cover rounded-md"
              />
              <div>
                <h3 className="font-semibold text-foreground">
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
              <span className="text-lg">{Math.floor(group.totalPrice)}</span>
              <span className="text-sm pt-0.5">
                .{(group.totalPrice % 1).toFixed(2).substring(2)}
              </span>
            </div>
            <div className="text-sm text-gray-500">Qty: {group.quantity}</div>
          </div>
        </div>
      </div>
    );
  }

  // Render expandable bundle card
  return (
    <div className="border border-border">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="bundle-composition" className="border-none">
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={group.product.thumbnail}
                    alt={group.product.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div>
                    <div className="flex items-start gap-2">
                      <h3 className="font-semibold text-foreground">
                        {group.product.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-600">
                        #{group.product.itemNumber}
                      </p>
                      <span className="text-xs bg-primary text-background px-2 py-1 rounded-full">
                        Bundle Option
                      </span>
                    </div>
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
                  <div className="text-sm text-gray-500">
                    Qty: {group.quantity}
                  </div>
                </div>
                <AccordionTrigger className="hover:no-underline p-0 h-auto" />
              </div>
            </div>
          </div>

          <AccordionContent className="px-4 pb-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-900 mb-3">
                Bundle composition ({composition.totalItems.length} items):
              </div>
              {composition.totalItems.map((item, index) => (
                <CompositionItemCard
                  key={`${item.itemNumber}-${index}`}
                  item={item}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
