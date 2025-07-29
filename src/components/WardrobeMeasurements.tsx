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
  const { showWardrobeMeasurements, wallsDimensions } = useStore();

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

  // Calculate room dimensions and wall positions
  const roomWidth = wallsDimensions.front.length * r3fScale; // Convert cm to R3F units
  const roomDepth = wallsDimensions.left.length * r3fScale;

  // Wall positions (center of room is at 0,0,0)
  const leftWallX = -roomWidth / 2;
  const rightWallX = roomWidth / 2;
  const backWallZ = roomDepth / 2;
  const frontWallZ = -roomDepth / 2;

  // Calculate distances from wardrobe edges to walls
  const distanceToLeftWall = x - widthR3F / 2 - leftWallX;
  const distanceToRightWall = rightWallX - (x + widthR3F / 2);
  const distanceToBackWall = backWallZ - (z + depthR3F / 2);
  const distanceToFrontWall = z - depthR3F / 2 - frontWallZ; // Optional: usually not needed

  // Calculate measurement line positions - wardrobe bottom is at Y=0, top is at Y=heightR3F
  const measurements = [
    // Width measurement (left to right) - positioned at top front side
    {
      start: [
        x - widthR3F / 2,
        y + heightR3F + offset, // Top of wardrobe + offset
        z - depthR3F / 2 - offset,
      ] as [number, number, number],
      end: [
        x + widthR3F / 2,
        y + heightR3F + offset, // Top of wardrobe + offset
        z - depthR3F / 2 - offset,
      ] as [number, number, number],
      label: "",
      value: wardrobeDimensions.width,
      color: "#fff",
      lineColor: "black",
      labelColor: "black",
    },
    // Height measurement (bottom to top) - positioned at left front side
    {
      start: [
        x - widthR3F / 2 - offset,
        y, // Bottom of wardrobe (floor level)
        z - depthR3F / 2 - offset,
      ] as [number, number, number],
      end: [
        x - widthR3F / 2 - offset,
        y + heightR3F, // Top of wardrobe
        z - depthR3F / 2 - offset,
      ] as [number, number, number],
      label: "",
      value: wardrobeDimensions.height,
      color: "#fff",
      lineColor: "black",
      labelColor: "black",
    },
    // Depth measurement (front to back) - positioned at right bottom side
    {
      start: [
        x + widthR3F / 2 + offset,
        y + offset, // Just above floor level
        z - depthR3F / 2,
      ] as [number, number, number],
      end: [
        x + widthR3F / 2 + offset,
        y + offset, // Just above floor level
        z + depthR3F / 2,
      ] as [number, number, number],
      label: "",
      value: wardrobeDimensions.depth,
      color: "#fff",
      lineColor: "black",
      labelColor: "black",
    },
    // Distance to left wall - horizontal line from left edge of wardrobe to left wall
    {
      start: [
        leftWallX,
        y + heightR3F / 2, // Middle height of wardrobe
        z,
      ] as [number, number, number],
      end: [
        x - widthR3F / 2, // Left edge of wardrobe
        y + heightR3F / 2, // Middle height of wardrobe
        z,
      ] as [number, number, number],
      label: "to left wall",
      value: Math.round(distanceToLeftWall * 100), // Convert back to cm and round
      color: "#fff",
      lineColor: "blue",
      labelColor: "blue",
    },
    // Distance to right wall - horizontal line from right edge of wardrobe to right wall
    {
      start: [
        x + widthR3F / 2, // Right edge of wardrobe
        y + heightR3F / 2, // Middle height of wardrobe
        z,
      ] as [number, number, number],
      end: [
        rightWallX,
        y + heightR3F / 2, // Middle height of wardrobe
        z,
      ] as [number, number, number],
      label: "to right wall",
      value: Math.round(distanceToRightWall * 100), // Convert back to cm and round
      color: "#fff",
      lineColor: "blue",
      labelColor: "blue",
    },
    // Distance to back wall - horizontal line from back edge of wardrobe to back wall
    {
      start: [
        x,
        y + heightR3F / 2, // Middle height of wardrobe
        z + depthR3F / 2, // Back edge of wardrobe
      ] as [number, number, number],
      end: [
        x,
        y + heightR3F / 2, // Middle height of wardrobe
        backWallZ,
      ] as [number, number, number],
      label: "to back wall",
      value: Math.round(distanceToBackWall * 100), // Convert back to cm and round
      color: "#fff",
      lineColor: "blue",
      labelColor: "blue",
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
          lineColor={measurement.lineColor}
          labelColor={measurement.labelColor}
        />
      ))}
    </group>
  );
};

export default WardrobeMeasurements;
