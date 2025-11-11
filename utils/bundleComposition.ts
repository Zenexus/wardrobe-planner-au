import type { WardrobeInstance } from "@/types";

export type CompositionItem = {
  itemNumber: string;
  name: string;
  thumbnail: string;
  price: number;
  width?: number;
  height?: number;
  depth?: number;
  type: "base-wardrobe" | "accessory";
  quantity: number;
  // Assembly information
  packDetails?: string;
  included?: string;
  toolsRequired?: string;
  instructions?: string;
  youtube?: string;
};

export type BundleComposition = {
  isBundle: boolean;
  baseWardrobe: CompositionItem | null;
  accessories: CompositionItem[];
  totalItems: CompositionItem[];
};

/**
 * Check if a wardrobe instance is a bundle and get its composition
 * @param wardrobeInstance - The wardrobe instance to check
 * @param bundlesData - Array of bundles data
 * @param productsData - Array of products data
 * @param accessoriesData - Array of accessories data
 * @returns Bundle composition details
 */
export function getBundleComposition(
  wardrobeInstance: WardrobeInstance,
  bundlesData: any[],
  productsData: any[],
  accessoriesData: any[]
): BundleComposition {
  const itemNumber = wardrobeInstance.product.itemNumber;

  // Check if this is a bundle by looking for it in bundles data
  const bundle = bundlesData.find((b) => b.ItemName === itemNumber);

  if (!bundle || !bundle.packDetails) {
    // Not a bundle, return simple composition
    return {
      isBundle: false,
      baseWardrobe: null,
      accessories: [],
      totalItems: [],
    };
  }

  // Get base wardrobe (2583987)
  const baseWardrobeProduct = productsData.find(
    (p) => p.itemNumber === "2583987"
  );
  const baseWardrobe: CompositionItem | null = baseWardrobeProduct
    ? {
        itemNumber: baseWardrobeProduct.itemNumber,
        name: baseWardrobeProduct.name,
        thumbnail: baseWardrobeProduct.images[0],
        price: baseWardrobeProduct.price,
        width: baseWardrobeProduct.width,
        height: baseWardrobeProduct.height,
        depth: baseWardrobeProduct.depth,
        type: "base-wardrobe",
        quantity: 1,
        // Assembly information from base wardrobe
        packDetails: baseWardrobeProduct.packDetails,
        included: baseWardrobeProduct.included,
        toolsRequired: baseWardrobeProduct.toolsRequired,
        instructions: baseWardrobeProduct.instructions,
        youtube: baseWardrobeProduct.youtube,
      }
    : null;

  // Get accessories from packDetails
  const accessoryMap = new Map<string, number>();

  // Count occurrences of each accessory
  bundle.packDetails.forEach((accessoryItemNumber) => {
    accessoryMap.set(
      accessoryItemNumber,
      (accessoryMap.get(accessoryItemNumber) || 0) + 1
    );
  });

  const accessories: CompositionItem[] = Array.from(accessoryMap.entries())
    .map(([itemNumber, quantity]) => {
      const accessory = accessoriesData.find(
        (a) => a.itemNumber === itemNumber
      );
      if (!accessory) {
        console.warn(`Accessory not found for item number: ${itemNumber}`);
        return null;
      }

      return {
        itemNumber: accessory.itemNumber,
        name: accessory.name,
        thumbnail: accessory.thumbnail,
        price: accessory.price,
        width: accessory.width,
        height: accessory.height,
        depth: accessory.depth,
        type: "accessory" as const,
        quantity,
        // Assembly information from accessory
        packDetails: accessory.packDetails,
        included: accessory.included,
        toolsRequired: accessory.toolsRequired,
        instructions: accessory.instructions,
        youtube: accessory.youtube,
      };
    })
    .filter(Boolean) as CompositionItem[];

  // Combine all items
  const totalItems = baseWardrobe
    ? [baseWardrobe, ...accessories]
    : accessories;

  return {
    isBundle: true,
    baseWardrobe,
    accessories,
    totalItems,
  };
}

/**
 * Check if an item number represents a bundle
 * @param itemNumber - The item number to check
 * @param bundlesData - Array of bundles data
 * @returns True if it's a bundle
 */
export function isBundleItem(itemNumber: string, bundlesData: any[]): boolean {
  return bundlesData.some((b) => b.ItemName === itemNumber);
}
