import React, { useMemo } from "react";
import WardrobeMeasurement from "./WardrobeMeasurement";
import { useStore } from "../store";
import productsData from "../products.json";

interface WardrobeMeasurementsProps {
  wardrobeId: string;
  position: [number, number, number]; // Position relative to wardrobe center
  modelPath: string;
}

const WardrobeMeasurements: React.FC<WardrobeMeasurementsProps> = ({
  wardrobeId,
  position,
  modelPath,
}) => {
  const { showWardrobeMeasurements } = useStore();

  // Get wardrobe dimensions from products.json
  const wardrobeDimensions = useMemo(() => {
    const product = productsData.products.find((p) => p.model === modelPath);

    if (!product) {
      console.warn(`Product not found for model: ${modelPath}`);
      return { width: 60, height: 200, depth: 48 }; // Default dimensions
    }

    return {
      width: product.width,
      height: product.height,
      depth: product.depth,
    };
  }, [modelPath]);

  // Only show measurements when global toggle is enabled
  if (!showWardrobeMeasurements) {
    return null;
  }

  // Convert cm to R3F units (assuming 1 R3F unit = 100cm)
  const r3fScale = 0.01;
  const widthR3F = wardrobeDimensions.width * r3fScale;
  const heightR3F = wardrobeDimensions.height * r3fScale;
  const depthR3F = wardrobeDimensions.depth * r3fScale;

  const [x, y, z] = position; // Now relative to wardrobe center
  const offset = 0.1;

  // Calculate measurement line positions relative to wardrobe center
  const measurements = [
    // Width measurement (left to right) - positioned at top front side
    {
      start: [
        x - widthR3F / 2,
        y + heightR3F / 2 + offset,
        z - depthR3F / 2 - offset,
      ] as [number, number, number],
      end: [
        x + widthR3F / 2,
        y + heightR3F / 2 + offset,
        z - depthR3F / 2 - offset,
      ] as [number, number, number],
      label: "",
      value: wardrobeDimensions.width,
      color: "#fff",
    },
    // Height measurement (bottom to top) - positioned at left front side
    {
      start: [
        x - widthR3F / 2 - offset,
        y - heightR3F / 2,
        z - depthR3F / 2 - offset,
      ] as [number, number, number],
      end: [
        x - widthR3F / 2 - offset,
        y + heightR3F / 2,
        z - depthR3F / 2 - offset,
      ] as [number, number, number],
      label: "",
      value: wardrobeDimensions.height,
      color: "#fff",
    },
    // Depth measurement (front to back) - positioned at right bottom side
    {
      start: [
        x + widthR3F / 2 + offset,
        y - heightR3F / 2 + offset,
        z - depthR3F / 2,
      ] as [number, number, number],
      end: [
        x + widthR3F / 2 + offset,
        y - heightR3F / 2 + offset,
        z + depthR3F / 2,
      ] as [number, number, number],
      label: "",
      value: wardrobeDimensions.depth,
      color: "#fff",
    },
  ];

  return (
    <group>
      {measurements.map((measurement, index) => (
        <WardrobeMeasurement
          key={index}
          start={measurement.start}
          end={measurement.end}
          label={measurement.label}
          value={measurement.value}
          color={measurement.color}
        />
      ))}
    </group>
  );
};

export default WardrobeMeasurements;
