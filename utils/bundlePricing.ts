import type { Bundle } from "@/types/bundle";

/**
 * Calculate the dynamic price for a bundle based on base wardrobe + accessories
 * @param bundle - The bundle object
 * @param productsData - Array of products data
 * @param accessoriesData - Array of accessories data
 * @returns Calculated price (base wardrobe + accessories)
 */
export function calculateBundlePrice(
  bundle: Bundle,
  productsData?: any[],
  accessoriesData?: any[]
): number {
  // If no data provided, return 0 as fallback
  if (!productsData || !accessoriesData) {
    return 0;
  }

  // Get base wardrobe price (2583987)
  const baseWardrobe = productsData.find((p) => p.itemNumber === "2583987");
  const basePrice = baseWardrobe?.price ?? 0;

  // If no packDetails, return base price
  if (!bundle.packDetails || bundle.packDetails.length === 0) {
    return basePrice;
  }

  // Calculate accessories total
  let accessoriesTotal = 0;

  for (const accessoryItemNumber of bundle.packDetails) {
    const accessory = accessoriesData.find(
      (acc) => acc.itemNumber === accessoryItemNumber
    );

    if (accessory) {
      accessoriesTotal += accessory.price;
    } else {
      console.warn(
        `Accessory not found for item number: ${accessoryItemNumber}`
      );
    }
  }

  return basePrice + accessoriesTotal;
}

/**
 * Calculate the price for the original wardrobe (no accessories)
 * @param productsData - Array of products data
 * @returns Base wardrobe price
 */
export function calculateOriginalWardrobePrice(productsData?: any[]): number {
  if (!productsData) {
    return 0;
  }

  const baseWardrobe = productsData.find((p) => p.itemNumber === "2583987");
  return baseWardrobe?.price ?? 0;
}

/**
 * Get accessory details for a bundle's packDetails
 * @param packDetails - Array of accessory item numbers
 * @param accessoriesData - Array of accessories data
 * @returns Array of accessory objects with their details
 */
export function getBundleAccessories(
  packDetails: string[],
  accessoriesData?: any[]
) {
  if (!accessoriesData) {
    return [];
  }

  return packDetails
    .map((itemNumber) => {
      const accessory = accessoriesData.find(
        (acc) => acc.itemNumber === itemNumber
      );

      if (!accessory) {
        console.warn(`Accessory not found for item number: ${itemNumber}`);
        return null;
      }

      return accessory;
    })
    .filter(Boolean);
}

/**
 * Get price breakdown for a bundle
 * @param bundle - The bundle object
 * @param productsData - Array of products data
 * @param accessoriesData - Array of accessories data
 * @returns Object with base price, accessories total, and final total
 */
export function getBundlePriceBreakdown(
  bundle: Bundle,
  productsData?: any[],
  accessoriesData?: any[]
) {
  const basePrice = calculateOriginalWardrobePrice(productsData);
  const accessories = getBundleAccessories(
    bundle.packDetails || [],
    accessoriesData
  );
  const accessoriesTotal = accessories.reduce(
    (sum, acc) => sum + (acc?.price || 0),
    0
  );
  const total = basePrice + accessoriesTotal;

  return {
    basePrice,
    accessories,
    accessoriesTotal,
    total,
  };
}
