export const SHEET_TRIGGER_WARDROBES = new Set([
  "2583987", // Wardrobe 1 Hang Rail 2 Shelf Unit White (Original)
  "2583987-Bundle-A", // Bundle A
  "2583987-Bundle-B", // Bundle B
  "2583987-Bundle-C", // Bundle C
]);

export const shouldTriggerSheet = (itemNumber: string): boolean => {
  return SHEET_TRIGGER_WARDROBES.has(itemNumber);
};

export const shouldTriggerSheetOnClickOnly = (itemNumber: string): boolean => {
  return SHEET_TRIGGER_WARDROBES.has(itemNumber);
};

/**
 * Helper function to get bundle item names for a wardrobe
 * @param itemNumber - The item number of the wardrobe product (original or bundle)
 * @returns Array of bundle item names for this wardrobe
 */
export const getBundlesForWardrobe = (itemNumber: string): string[] => {
  // Handle both original wardrobe and bundle item numbers
  if (
    itemNumber === "2583987" ||
    itemNumber === "2583987-Bundle-A" ||
    itemNumber === "2583987-Bundle-B" ||
    itemNumber === "2583987-Bundle-C"
  ) {
    return ["2583987-Bundle-A", "2583987-Bundle-B", "2583987-Bundle-C"];
  }

  return [];
};
