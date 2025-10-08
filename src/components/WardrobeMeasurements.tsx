import React, { useMemo, useState, useEffect } from "react";
import WardrobeMeasurement from "./WardrobeMeasurement";
import { useStore } from "../store";

type WardrobeMeasurementsProps = {
  wardrobeId: string;
  position: [number, number, number]; // Position relative to wardrobe center
  modelPath: string;
};

const WardrobeMeasurements: React.FC<WardrobeMeasurementsProps> = ({
  wardrobeId,
  position,
  modelPath,
}) => {
  const {
    showWardrobeMeasurements,
    wallsDimensions,
    draggedObjectId,
    selectedObjectId,
    getWardrobeInstance,
    getProducts,
  } = useStore();

  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsData = await getProducts();
        setProducts(productsData);
      } catch (error) {
        console.error("Failed to load products:", error);
      }
    };
    loadProducts();
  }, [getProducts]);

  // Get wardrobe dimensions and type from products.json
  const wardrobeData = useMemo(() => {
    const product = products.find((p) => p.model === modelPath);

    if (!product) {
      console.warn(`Product not found for model: ${modelPath}`);
      return {
        width: 60,
        height: 200,
        depth: 48,
        type: "normal",
      }; // Default dimensions
    }

    return {
      width: product.width,
      height: product.height,
      depth: product.depth,
      type: product.type,
    };
  }, [modelPath, products]);

  const { width, height, depth, type } = wardrobeData;

  // Only show measurements when global toggle is enabled
  if (!showWardrobeMeasurements) {
    return null;
  }

  // Convert cm to R3F units (assuming 1 R3F unit = 100cm)
  const r3fScale = 0.01;
  const widthR3F = width * r3fScale;
  const heightR3F = height * r3fScale;
  const depthR3F = depth * r3fScale;

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

  // Calculate distances from wardrobe edges to walls and ceiling
  const distanceToLeftWall = x - widthR3F / 2 - leftWallX;
  const distanceToRightWall = rightWallX - (x + widthR3F / 2);
  const roomHeight = wallsDimensions.front.height * r3fScale; // Convert cm to R3F units
  const distanceToCeiling = roomHeight - (y + heightR3F);

  // Get wardrobe instance to access rotation
  const wardrobeInstance = getWardrobeInstance(wardrobeId);
  const wardrobeRotation = wardrobeInstance?.rotation || 0; // In radians

  // Helper function to determine rotation range
  const getRotationRange = (rotation: number): string => {
    const normalizedRotation =
      ((rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    if (normalizedRotation < Math.PI / 2) return "FRONT"; // 0° to 90°
    if (normalizedRotation < Math.PI) return "LEFT"; // 90° to 180°
    if (normalizedRotation < (3 * Math.PI) / 2) return "BACK"; // 180° to 270°
    return "RIGHT"; // 270° to 360°
  };

  const currentRange = getRotationRange(wardrobeRotation);

  // Configuration for wardrobe dimension measurements based on rotation
  const wardrobeDimensionConfigs = new Map([
    [
      "FRONT",
      {
        // Width measurement (left to right) - positioned at top front side
        width: {
          startX: x - widthR3F / 2,
          startY: y + heightR3F + offset,
          startZ: z - depthR3F / 2 - offset,
          endX: x + widthR3F / 2,
          endY: y + heightR3F + offset,
          endZ: z - depthR3F / 2 - offset,
          label: "",
          value: width,
          color: "#fff",
          lineColor: "black",
          labelColor: "black",
        },
        // Height measurement (bottom to top) - positioned at left front side
        height: {
          startX: x - widthR3F / 2 - offset,
          startY: y,
          startZ: z - depthR3F / 2 - offset,
          endX: x - widthR3F / 2 - offset,
          endY: y + heightR3F,
          endZ: z - depthR3F / 2 - offset,
          label: "",
          value: height,
          color: "#fff",
          lineColor: "black",
          labelColor: "black",
        },
        // Depth measurement (front to back) - positioned at right bottom side
        depth: {
          startX: x + widthR3F / 2 + offset,
          startY: y + offset,
          startZ: z - depthR3F / 2,
          endX: x + widthR3F / 2 + offset,
          endY: y + offset,
          endZ: z + depthR3F / 2,
          label: "",
          value: depth,
          color: "#fff",
          lineColor: "black",
          labelColor: "black",
        },
      },
    ],
    [
      "LEFT",
      {
        // Width measurement (left to right) - positioned at top left side
        width: {
          startX: x - widthR3F / 2,
          startY: y + heightR3F + offset,
          startZ: z + depthR3F / 2 + offset,
          endX: x + widthR3F / 2,
          endY: y + heightR3F + offset,
          endZ: z + depthR3F / 2 + offset,
          label: "",
          value: width,
          color: "#fff",
          lineColor: "black",
          labelColor: "black",
        },
        // Height measurement (bottom to top) - positioned at back left side
        height: {
          startX: x - widthR3F / 2 - offset,
          startY: y,
          startZ: z + depthR3F / 2 + offset,
          endX: x - widthR3F / 2 - offset,
          endY: y + heightR3F,
          endZ: z + depthR3F / 2 + offset,
          label: "",
          value: height,
          color: "#fff",
          lineColor: "black",
          labelColor: "black",
        },
        // Depth measurement (front to back) - positioned at front left side
        depth: {
          startX: x - widthR3F / 2,
          startY: y + offset,
          startZ: z - depthR3F / 2 - offset,
          endX: x + widthR3F / 2,
          endY: y + offset,
          endZ: z - depthR3F / 2 - offset,
          label: "",
          value: depth,
          color: "#fff",
          lineColor: "black",
          labelColor: "black",
        },
      },
    ],
    [
      "BACK",
      {
        // Width measurement (left to right) - positioned at top back side
        width: {
          startX: x - widthR3F / 2,
          startY: y + heightR3F + offset,
          startZ: z + depthR3F / 2 + offset,
          endX: x + widthR3F / 2,
          endY: y + heightR3F + offset,
          endZ: z + depthR3F / 2 + offset,
          label: "",
          value: width,
          color: "#fff",
          lineColor: "black",
          labelColor: "black",
        },
        // Height measurement (bottom to top) - positioned at right back side
        height: {
          startX: x + widthR3F / 2 + offset,
          startY: y,
          startZ: z + depthR3F / 2 + offset,
          endX: x + widthR3F / 2 + offset,
          endY: y + heightR3F,
          endZ: z + depthR3F / 2 + offset,
          label: "",
          value: height,
          color: "#fff",
          lineColor: "black",
          labelColor: "black",
        },
        // Depth measurement (front to back) - positioned at left bottom side
        depth: {
          startX: x - widthR3F / 2 - offset,
          startY: y + offset,
          startZ: z - depthR3F / 2,
          endX: x - widthR3F / 2 - offset,
          endY: y + offset,
          endZ: z + depthR3F / 2,
          label: "",
          value: depth,
          color: "#fff",
          lineColor: "black",
          labelColor: "black",
        },
      },
    ],
    [
      "RIGHT",
      {
        // Width measurement (left to right) - positioned at top right side
        width: {
          startX: x - widthR3F / 2,
          startY: y + heightR3F + offset,
          startZ: z - depthR3F / 2 - offset,
          endX: x + widthR3F / 2,
          endY: y + heightR3F + offset,
          endZ: z - depthR3F / 2 - offset,
          label: "",
          value: width,
          color: "#fff",
          lineColor: "black",
          labelColor: "black",
        },
        // Height measurement (bottom to top) - positioned at front right side
        height: {
          startX: x + widthR3F / 2 + offset,
          startY: y,
          startZ: z - depthR3F / 2 - offset,
          endX: x + widthR3F / 2 + offset,
          endY: y + heightR3F,
          endZ: z - depthR3F / 2 - offset,
          label: "",
          value: height,
          color: "#fff",
          lineColor: "black",
          labelColor: "black",
        },
        // Depth measurement (front to back) - positioned at back right side
        depth: {
          startX: x + widthR3F / 2,
          startY: y + offset,
          startZ: z + depthR3F / 2 + offset,
          endX: x - widthR3F / 2,
          endY: y + offset,
          endZ: z + depthR3F / 2 + offset,
          label: "",
          value: depth,
          color: "#fff",
          lineColor: "black",
          labelColor: "black",
        },
      },
    ],
  ]);

  // Get the current wardrobe dimension configuration based on rotation
  const wardrobeDimensionConfig = wardrobeDimensionConfigs.get(currentRange)!;

  // Generate wardrobe dimension measurements from configuration
  const wardrobeDimensionMeasurements = Object.values(
    wardrobeDimensionConfig
  ).map((config) => ({
    start: [config.startX, config.startY, config.startZ] as [
      number,
      number,
      number
    ],
    end: [config.endX, config.endY, config.endZ] as [number, number, number],
    label: config.label,
    value: config.value,
    color: config.color,
    lineColor: config.lineColor,
    labelColor: config.labelColor,
  }));

  // Check if this wardrobe is being dragged or focused
  const isWardrobeDraggedOrFocused =
    draggedObjectId === wardrobeId || selectedObjectId === wardrobeId;

  // Calculate wall labels and distances based on wardrobe rotation
  const getWardrobeWallInfo = (rotation: number) => {
    const normalizedRotation =
      ((rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    if (
      normalizedRotation < Math.PI / 4 ||
      normalizedRotation >= (7 * Math.PI) / 4
    ) {
      // Facing front (0°): left=left wall, right=right wall
      return {
        leftLabel: "to left wall",
        rightLabel: "to right wall",
        leftDistance: distanceToLeftWall,
        rightDistance: distanceToRightWall,
      };
    } else if (
      normalizedRotation >= Math.PI / 4 &&
      normalizedRotation < (3 * Math.PI) / 4
    ) {
      // Facing left (90°): left=back wall, right=front wall
      const distanceToLeftFromWardrobe = backWallZ - (z + depthR3F / 2);
      const distanceToRightFromWardrobe = z - depthR3F / 2 - frontWallZ;
      return {
        leftLabel: "to back wall",
        rightLabel: "to front wall",
        leftDistance: distanceToLeftFromWardrobe,
        rightDistance: distanceToRightFromWardrobe,
      };
    } else if (
      normalizedRotation >= (3 * Math.PI) / 4 &&
      normalizedRotation < (5 * Math.PI) / 4
    ) {
      // Facing back (180°): left=right wall, right=left wall
      return {
        leftLabel: "to right wall",
        rightLabel: "to left wall",
        leftDistance: distanceToRightWall,
        rightDistance: distanceToLeftWall,
      };
    } else {
      // Facing right (270°): left=front wall, right=back wall
      const distanceToLeftFromWardrobe = z - depthR3F / 2 - frontWallZ;
      const distanceToRightFromWardrobe = backWallZ - (z + depthR3F / 2);
      return {
        leftLabel: "to front wall",
        rightLabel: "to back wall",
        leftDistance: distanceToLeftFromWardrobe,
        rightDistance: distanceToRightFromWardrobe,
      };
    }
  };

  const wardrobeWalls = getWardrobeWallInfo(wardrobeRotation);
  const MODEL_OFFSET = 0.1;

  // Position configurations for measurement lines
  const positionConfigs = new Map([
    [
      "FRONT",
      {
        // Ceiling measurement
        ceilingX: x,
        ceilingY: y + heightR3F, // Top of wardrobe
        ceilingZ: z + depthR3F / 2,
        // Left wall measurement
        leftStartX: leftWallX,
        leftStartY: y + heightR3F / 2, // Middle height of wardrobe
        leftStartZ: z + depthR3F / 2,
        leftEndX: x - widthR3F / 2,
        leftEndY: y + heightR3F / 2, // Middle height of wardrobe
        leftEndZ: z + depthR3F / 2,
        // Right wall measurement
        rightStartX: x + widthR3F / 2,
        rightStartY: y + heightR3F / 2, // Middle height of wardrobe
        rightStartZ: z + depthR3F / 2,
        rightEndX: rightWallX,
        rightEndY: y + heightR3F / 2, // Middle height of wardrobe
        rightEndZ: z + depthR3F / 2,
        description: "facing front",
      },
    ],
    [
      "LEFT",
      {
        // Ceiling measurement
        ceilingX: x + widthR3F / 2 - MODEL_OFFSET,
        ceilingY: y + heightR3F, // Top of wardrobe
        ceilingZ: z,
        // Left wall measurement (to back wall)
        leftStartX: x + widthR3F / 2 - MODEL_OFFSET,
        leftStartY: y + heightR3F / 2, // Middle height of wardrobe
        leftStartZ: z + depthR3F / 2,
        leftEndX: x + widthR3F / 2 - MODEL_OFFSET,
        leftEndY: y + heightR3F / 2, // Middle height of wardrobe
        leftEndZ: backWallZ,
        // Right wall measurement (to front wall)
        rightStartX: x + widthR3F / 2 - MODEL_OFFSET,
        rightStartY: y + heightR3F / 2, // Middle height of wardrobe
        rightStartZ: z - depthR3F / 2,
        rightEndX: x + widthR3F / 2 - MODEL_OFFSET,
        rightEndY: y + heightR3F / 2, // Middle height of wardrobe
        rightEndZ: frontWallZ,
        description: "facing left",
      },
    ],
    [
      "BACK",
      {
        // Ceiling measurement
        ceilingX: x,
        ceilingY: y + heightR3F, // Top of wardrobe
        ceilingZ: z - depthR3F / 2,
        // Left wall measurement (to right wall)
        leftStartX: rightWallX,
        leftStartY: y + heightR3F / 2, // Middle height of wardrobe
        leftStartZ: z - depthR3F / 2,
        leftEndX: x + widthR3F / 2,
        leftEndY: y + heightR3F / 2, // Middle height of wardrobe
        leftEndZ: z - depthR3F / 2,
        // Right wall measurement (to left wall)
        rightStartX: x - widthR3F / 2,
        rightStartY: y + heightR3F / 2, // Middle height of wardrobe
        rightStartZ: z - depthR3F / 2,
        rightEndX: leftWallX,
        rightEndY: y + heightR3F / 2, // Middle height of wardrobe
        rightEndZ: z - depthR3F / 2,
        description: "facing back",
      },
    ],
    [
      "RIGHT",
      {
        // Ceiling measurement
        ceilingX: x - widthR3F / 2 + MODEL_OFFSET,
        ceilingY: y + heightR3F, // Top of wardrobe
        ceilingZ: z,
        // Left wall measurement (to front wall)
        leftStartX: x - widthR3F / 2 + MODEL_OFFSET,
        leftStartY: y + heightR3F / 2, // Middle height of wardrobe
        leftStartZ: z - depthR3F / 2,
        leftEndX: x - widthR3F / 2 + MODEL_OFFSET,
        leftEndY: y + heightR3F / 2, // Middle height of wardrobe
        leftEndZ: frontWallZ,
        // Right wall measurement (to back wall)
        rightStartX: x - widthR3F / 2 + MODEL_OFFSET,
        rightStartY: y + heightR3F / 2, // Middle height of wardrobe
        rightStartZ: z + depthR3F / 2,
        rightEndX: x - widthR3F / 2 + MODEL_OFFSET,
        rightEndY: y + heightR3F / 2, // Middle height of wardrobe
        rightEndZ: backWallZ,
        description: "facing right",
      },
    ],
  ]);

  const config = positionConfigs.get(currentRange)!;

  // Debug log removed to avoid excessive console output during drag

  // Wall measurements - only shown for non-corner wardrobes that are being dragged or focused
  const wallMeasurements =
    type !== "corner" && isWardrobeDraggedOrFocused
      ? [
          // Distance to left wall relative to wardrobe orientation
          {
            start: [
              config.leftStartX,
              config.leftStartY,
              config.leftStartZ,
            ] as [number, number, number],
            end: [config.leftEndX, config.leftEndY, config.leftEndZ] as [
              number,
              number,
              number
            ],
            label: wardrobeWalls.leftLabel,
            value: Math.round(wardrobeWalls.leftDistance * 100), // Convert back to cm and round
            color: "#fff",
            lineColor: "blue",
            labelColor: "blue",
          },
          // Distance to right wall relative to wardrobe orientation
          {
            start: [
              config.rightStartX,
              config.rightStartY,
              config.rightStartZ,
            ] as [number, number, number],
            end: [config.rightEndX, config.rightEndY, config.rightEndZ] as [
              number,
              number,
              number
            ],
            label: wardrobeWalls.rightLabel,
            value: Math.round(wardrobeWalls.rightDistance * 100), // Convert back to cm and round
            color: "#fff",
            lineColor: "blue",
            labelColor: "blue",
          },
          // Distance to ceiling - vertical line from top of wardrobe to ceiling
          {
            start: [config.ceilingX, config.ceilingY, config.ceilingZ] as [
              number,
              number,
              number
            ],
            end: [
              config.ceilingX,
              roomHeight, // Ceiling height
              config.ceilingZ,
            ] as [number, number, number],
            label: "to ceiling",
            value: Math.round(distanceToCeiling * 100),
            color: "#fff",
            lineColor: "blue",
            labelColor: "blue",
          },
        ]
      : [];

  // Combine all measurements
  const measurements = [...wardrobeDimensionMeasurements, ...wallMeasurements];

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
