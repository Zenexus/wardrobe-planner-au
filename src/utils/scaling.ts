import { R3F_SCALE } from "../store";

/**
 * Scaling utilities for converting between real-world centimeters and R3F units
 *
 * Scale Factor: 1 R3F unit = 100cm
 * Example: 500cm room → 5 R3F units
 *          60.6cm wardrobe → 0.606 R3F units
 */

/**
 * Convert centimeters to R3F units
 * @param cm - Value in centimeters
 * @returns Value in R3F units
 */
export const cmToR3F = (cm: number): number => {
  return cm / R3F_SCALE;
};

/**
 * Convert R3F units to centimeters
 * @param r3fUnits - Value in R3F units
 * @returns Value in centimeters
 */
export const r3fToCm = (r3fUnits: number): number => {
  return r3fUnits * R3F_SCALE;
};

/**
 * Convert dimensions object from CM to R3F units
 * @param dimensions - Object with width, height, depth in CM
 * @returns Object with dimensions in R3F units
 */
export const dimensionsCmToR3F = (dimensions: {
  width?: number;
  height?: number;
  depth?: number;
  length?: number;
}): {
  width?: number;
  height?: number;
  depth?: number;
  length?: number;
} => {
  const result: any = {};

  if (dimensions.width !== undefined) result.width = cmToR3F(dimensions.width);
  if (dimensions.height !== undefined)
    result.height = cmToR3F(dimensions.height);
  if (dimensions.depth !== undefined) result.depth = cmToR3F(dimensions.depth);
  if (dimensions.length !== undefined)
    result.length = cmToR3F(dimensions.length);

  return result;
};

/**
 * Convert dimensions object from R3F units to CM
 * @param dimensions - Object with width, height, depth in R3F units
 * @returns Object with dimensions in CM
 */
export const dimensionsR3FToCm = (dimensions: {
  width?: number;
  height?: number;
  depth?: number;
  length?: number;
}): {
  width?: number;
  height?: number;
  depth?: number;
  length?: number;
} => {
  const result: any = {};

  if (dimensions.width !== undefined) result.width = r3fToCm(dimensions.width);
  if (dimensions.height !== undefined)
    result.height = r3fToCm(dimensions.height);
  if (dimensions.depth !== undefined) result.depth = r3fToCm(dimensions.depth);
  if (dimensions.length !== undefined)
    result.length = r3fToCm(dimensions.length);

  return result;
};
