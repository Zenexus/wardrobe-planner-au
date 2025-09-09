export const SHEET_TRIGGER_WARDROBES = new Set([
  "2583987", // Wardrobe 1 Hang Rail 2 Shelf Unit White
  // "2583986", // Wardrobe 3 Shelf & 4 Drawer Unit White
]);

export const shouldTriggerSheet = (itemNumber: string): boolean => {
  return SHEET_TRIGGER_WARDROBES.has(itemNumber);
};

export const shouldTriggerSheetOnClickOnly = (itemNumber: string): boolean => {
  return SHEET_TRIGGER_WARDROBES.has(itemNumber);
};

/**
 * Helper function to get bundle item names for a wardrobe
 * @param itemNumber - The item number of the wardrobe product
 * @returns Array of bundle item names for this wardrobe
 */
export const getBundlesForWardrobe = (itemNumber: string): string[] => {
  switch (itemNumber) {
    case "2583987":
      return ["2583987-Bundle-A ", "2583987-Bundle-B", "2583987-Bundle-C"]; // Note: one has trailing space
    default:
      return [];
  }
};
