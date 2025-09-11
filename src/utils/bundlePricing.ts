import accessoriesData from "@/accessories.json";
import productsData from "@/products.json";
import type { Bundle } from "@/types/bundle";

/**
 * Calculate the dynamic price for a bundle based on base wardrobe + accessories
 * @param bundle - The bundle object
 * @returns Calculated price (base wardrobe + accessories)
 */
export function calculateBundlePrice(bundle: Bundle): number {
  // Get base wardrobe price (2583987)
  const baseWardrobe = productsData.products.find(
    (p) => p.itemNumber === "2583987"
  );
  const basePrice = baseWardrobe?.price ?? 0;

  // If no packDetails, return base price
  if (!bundle.packDetails || bundle.packDetails.length === 0) {
    return basePrice;
  }

  // Calculate accessories total
  let accessoriesTotal = 0;

  for (const accessoryItemNumber of bundle.packDetails) {
    const accessory = accessoriesData.accessories.find(
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
 * @returns Base wardrobe price
 */
export function calculateOriginalWardrobePrice(): number {
  const baseWardrobe = productsData.products.find(
    (p) => p.itemNumber === "2583987"
  );
  return baseWardrobe?.price ?? 0;
}

/**
 * Get accessory details for a bundle's packDetails
 * @param packDetails - Array of accessory item numbers
 * @returns Array of accessory objects with their details
 */
export function getBundleAccessories(packDetails: string[]) {
  return packDetails
    .map((itemNumber) => {
      const accessory = accessoriesData.accessories.find(
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
 * @returns Object with base price, accessories total, and final total
 */
export function getBundlePriceBreakdown(bundle: Bundle) {
  const basePrice = calculateOriginalWardrobePrice();
  const accessories = getBundleAccessories(bundle.packDetails || []);
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
