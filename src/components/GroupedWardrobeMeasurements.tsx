import React, { useMemo, useState, useEffect } from "react";
import WardrobeMeasurement from "./WardrobeMeasurement";
import { useStore } from "../store";
import { WardrobeInstance } from "../types";
import {
  requiresWallAttachment,
  requiresCornerPlacement,
  getClosestWall,
  RoomDimensions as WallRoomDimensions,
} from "../helper/wallConstraints";

type GroupedWardrobeMeasurementsProps = {
  wardrobeInstances: WardrobeInstance[];
};

type WallGroup = {
  wallIndex: number;
  wardrobes: Array<{
    instance: WardrobeInstance;
    position: [number, number, number];
    dimensions: { width: number; height: number; depth: number };
    leftmostX: number;
    rightmostX: number;
  }>;
};

const GroupedWardrobeMeasurements: React.FC<
  GroupedWardrobeMeasurementsProps
> = ({ wardrobeInstances }) => {
  const {
    showWardrobeMeasurements,
    wallsDimensions,
    draggedObjectId,
    selectedObjectId,
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

  const roomDimensions: WallRoomDimensions = useMemo(
    () => ({
      width: wallsDimensions.front.length * 0.01,
      depth: wallsDimensions.left.length * 0.01,
      height: wallsDimensions.front.height * 0.01,
      thickness: wallsDimensions.front.depth * 0.01,
    }),
    [wallsDimensions]
  );

  // Helper function to determine wall index based on rotation instead of proximity
  const getWallIndexFromRotation = (
    rotation: number,
    position: [number, number, number]
  ): number => {
    // Normalize rotation to [0, 2π) range
    const normalizedRotation =
      ((rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    // Define rotation values for each wall (from wallConstraints.ts)
    const rightWallRotation = Math.PI * 0.5; // 90°
    const leftWallRotation = Math.PI * 1.5; // 270° (equivalent to -90° normalized)
    const backWallRotation = 0; // 0°
    const frontWallRotation = Math.PI; // 180°

    // Use tolerance for floating point precision
    const tolerance = Math.PI / 8; // 22.5 degrees tolerance

    // Find the closest wall rotation
    const distances = [
      {
        wallIndex: 0,
        distance: Math.abs(normalizedRotation - rightWallRotation),
      },
      {
        wallIndex: 1,
        distance: Math.abs(normalizedRotation - leftWallRotation),
      },
      {
        wallIndex: 2,
        distance: Math.abs(normalizedRotation - backWallRotation),
      },
      {
        wallIndex: 3,
        distance: Math.abs(normalizedRotation - frontWallRotation),
      },
    ];

    // Also check distance to 2π for back wall (0° and 360° are the same)
    if (normalizedRotation > Math.PI) {
      distances[2].distance = Math.min(
        distances[2].distance,
        Math.abs(normalizedRotation - 2 * Math.PI)
      );
    }

    // Find minimum distance
    const closest = distances.reduce((prev, current) =>
      prev.distance < current.distance ? prev : current
    );

    // Only use rotation-based assignment if it's within tolerance
    if (closest.distance < tolerance) {
      return closest.wallIndex;
    }

    // Fallback to proximity-based detection for edge cases
    const wallConstraint = getClosestWall(position, roomDimensions);
    return wallConstraint.wallIndex;
  };

  // Group wardrobes by wall
  const wallGroups = useMemo(() => {
    if (!showWardrobeMeasurements) return new Map<number, WallGroup>();

    const groups = new Map<number, WallGroup>();

    wardrobeInstances.forEach((instance) => {
      const product = products.find((p) => p.model === instance.product.model);
      if (!product) return;

      const r3fScale = 0.01;
      const dimensions = {
        width: product.width * r3fScale,
        height: product.height * r3fScale,
        depth: product.depth * r3fScale,
      };

      // Group wall-attached wardrobes by wall
      if (requiresWallAttachment(instance.product.model)) {
        // Use rotation-based wall assignment instead of proximity-based
        const wallIndex = getWallIndexFromRotation(
          instance.rotation || 0,
          instance.position
        );

        if (!groups.has(wallIndex)) {
          groups.set(wallIndex, {
            wallIndex,
            wardrobes: [],
          });
        }

        const group = groups.get(wallIndex)!;

        // Calculate leftmost and rightmost coordinates based on wall orientation
        const [x, , z] = instance.position;
        let leftmostX: number, rightmostX: number;

        // Determine the axis along which wardrobes are arranged on this wall
        if (wallIndex === 0 || wallIndex === 1) {
          // Right wall (0) or Left wall (1) - wardrobes arranged along Z axis
          leftmostX = z - dimensions.width / 2;
          rightmostX = z + dimensions.width / 2;
        } else {
          // Front wall (2) or Back wall (3) - wardrobes arranged along X axis
          leftmostX = x - dimensions.width / 2;
          rightmostX = x + dimensions.width / 2;
        }

        group.wardrobes.push({
          instance,
          position: instance.position,
          dimensions,
          leftmostX,
          rightmostX,
        });
      }
      // Handle corner wardrobes separately - they join both adjacent walls
      else if (requiresCornerPlacement(instance.product.model)) {
        // Determine which corner this L-shape wardrobe is in based on rotation
        const rotation = instance.rotation || 0;
        const normalizedRotation =
          ((rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

        // Map rotations to corner indices and their adjacent walls
        // From wallConstraints.ts corner definitions
        let adjacentWalls: number[] = [];
        const tolerance = Math.PI / 8; // 22.5 degrees tolerance

        if (Math.abs(normalizedRotation - Math.PI * 1.5) < tolerance) {
          // Corner 0 (Front-left): rotation 270° - joins Left wall (1) and Front wall (3)
          adjacentWalls = [1, 3];
        } else if (Math.abs(normalizedRotation - Math.PI) < tolerance) {
          // Corner 1 (Front-right): rotation 180° - joins Right wall (0) and Front wall (3)
          adjacentWalls = [0, 3];
        } else if (Math.abs(normalizedRotation - Math.PI * 0.5) < tolerance) {
          // Corner 2 (Back-right): rotation 90° - joins Right wall (0) and Back wall (2)
          adjacentWalls = [0, 2];
        } else if (
          Math.abs(normalizedRotation - Math.PI * 2) < tolerance ||
          Math.abs(normalizedRotation) < tolerance
        ) {
          // Corner 3 (Back-left): rotation 360°/0° - joins Left wall (1) and Back wall (2)
          adjacentWalls = [1, 2];
        } else {
          // Fallback: try to determine based on position
          const [x, , z] = instance.position;

          if (x < 0 && z < 0) {
            // Front-left corner
            adjacentWalls = [1, 3];
          } else if (x > 0 && z < 0) {
            // Front-right corner
            adjacentWalls = [0, 3];
          } else if (x > 0 && z > 0) {
            // Back-right corner
            adjacentWalls = [0, 2];
          } else {
            // Back-left corner
            adjacentWalls = [1, 2];
          }
        }

        // Add the L-shape wardrobe to both adjacent wall groups
        adjacentWalls.forEach((wallIndex) => {
          if (!groups.has(wallIndex)) {
            groups.set(wallIndex, {
              wallIndex,
              wardrobes: [],
            });
          }

          const group = groups.get(wallIndex)!;

          // Calculate leftmost and rightmost coordinates based on wall orientation
          const [x, , z] = instance.position;
          let leftmostX: number, rightmostX: number;

          // Determine the axis along which wardrobes are arranged on this wall
          if (wallIndex === 0 || wallIndex === 1) {
            // Right wall (0) or Left wall (1) - wardrobes arranged along Z axis
            leftmostX = z - dimensions.width / 2;
            rightmostX = z + dimensions.width / 2;
          } else {
            // Front wall (2) or Back wall (3) - wardrobes arranged along X axis
            leftmostX = x - dimensions.width / 2;
            rightmostX = x + dimensions.width / 2;
          }

          group.wardrobes.push({
            instance,
            position: instance.position,
            dimensions,
            leftmostX,
            rightmostX,
          });
        });
      } else {
        // For freestanding wardrobes, treat each as its own group
        const uniqueIndex =
          -parseInt(instance.id.split("-")[1]) || -Math.random();
        groups.set(uniqueIndex, {
          wallIndex: uniqueIndex,
          wardrobes: [
            {
              instance,
              position: instance.position,
              dimensions,
              leftmostX: instance.position[0] - dimensions.width / 2,
              rightmostX: instance.position[0] + dimensions.width / 2,
            },
          ],
        });
      }
    });

    return groups;
  }, [wardrobeInstances, showWardrobeMeasurements, roomDimensions, products]);

  // Generate measurements for each wall group
  const groupMeasurements = useMemo(() => {
    const measurements: React.ReactNode[] = [];

    wallGroups.forEach((group, wallIndex) => {
      if (group.wardrobes.length === 0) return;

      // Validate that all wardrobes in the group still exist in wardrobeInstances
      const validWardrobes = group.wardrobes.filter((groupWardrobe) =>
        wardrobeInstances.some(
          (instance) => instance.id === groupWardrobe.instance.id
        )
      );

      // If no valid wardrobes remain, skip this group
      if (validWardrobes.length === 0) return;

      // Update the group to only contain valid wardrobes
      const validGroup = { ...group, wardrobes: validWardrobes };

      // Note: Group activity check removed since we now handle blue measurements separately

      // For single wardrobe, show individual measurements
      if (validGroup.wardrobes.length === 1) {
        const wardrobe = validGroup.wardrobes[0];
        const { instance, position, dimensions } = wardrobe;
        const [x, y, z] = position;
        const offset = 0.1;

        // Define measurement configuration types
        type MeasurementConfig = {
          start: [number, number, number];
          end: [number, number, number];
          label: string;
          value: number;
        };

        type WallConfig = {
          [key: string]: MeasurementConfig;
        };

        type ShapeConfig = {
          front: WallConfig;
          back: WallConfig;
          left: WallConfig;
          right: WallConfig;
        };

        // Get wardrobe shape and wall orientation
        const product = products.find(
          (p) => p.model === instance.product.model
        );
        const wardrobeShape = product?.type || "normal"; // "normal", "corner", or future "polygon"

        // Map wallIndex to wall orientation
        const wallIndexToOrientation = {
          0: "right",
          1: "left",
          2: "front",
          3: "back",
        } as const;
        const wallOrientation =
          wallIndexToOrientation[
            wallIndex as keyof typeof wallIndexToOrientation
          ] || "front";

        // Measurement configuration map
        const measurementConfigurations: { [key: string]: ShapeConfig } = {
          normal: {
            front: {
              width: {
                start: [
                  x - dimensions.width / 2,
                  y + dimensions.height + offset,
                  z,
                ] as [number, number, number],
                end: [
                  x + dimensions.width / 2,
                  y + dimensions.height + offset,
                  z,
                ] as [number, number, number],
                label: "width",
                value: Math.round(dimensions.width * 100),
              },
              height: {
                start: [x - dimensions.width / 2 - offset, y, z] as [
                  number,
                  number,
                  number
                ],
                end: [
                  x - dimensions.width / 2 - offset,
                  y + dimensions.height,
                  z,
                ] as [number, number, number],
                label: "height",
                value: Math.round(dimensions.height * 100),
              },
              depth: {
                start: [
                  x + dimensions.width / 2 + offset,
                  y + offset,
                  z - dimensions.depth / 2,
                ] as [number, number, number],
                end: [
                  x + dimensions.width / 2 + offset,
                  y + offset,
                  z + dimensions.depth / 2,
                ] as [number, number, number],
                label: "depth",
                value: Math.round(dimensions.depth * 100),
              },
            },
            back: {
              width: {
                start: [
                  x - dimensions.width / 2,
                  y + dimensions.height + offset,
                  z,
                ] as [number, number, number],
                end: [
                  x + dimensions.width / 2,
                  y + dimensions.height + offset,
                  z,
                ] as [number, number, number],
                label: "width",
                value: Math.round(dimensions.width * 100),
              },
              height: {
                start: [x + dimensions.width / 2 + offset, y, z] as [
                  number,
                  number,
                  number
                ],
                end: [
                  x + dimensions.width / 2 + offset,
                  y + dimensions.height,
                  z,
                ] as [number, number, number],
                label: "height",
                value: Math.round(dimensions.height * 100),
              },
              depth: {
                start: [
                  x - dimensions.width / 2 - offset,
                  y + offset,
                  z - dimensions.depth / 2,
                ] as [number, number, number],
                end: [
                  x - dimensions.width / 2 - offset,
                  y + offset,
                  z + dimensions.depth / 2,
                ] as [number, number, number],
                label: "depth",
                value: Math.round(dimensions.depth * 100),
              },
            },
            left: {
              width: {
                start: [
                  x,
                  y + dimensions.height + offset,
                  z - dimensions.depth / 2,
                ] as [number, number, number],
                end: [
                  x,
                  y + dimensions.height + offset,
                  z + dimensions.depth / 2,
                ] as [number, number, number],
                label: "depth", // Note: for left wall, width measurement shows depth
                value: Math.round(dimensions.depth * 100),
              },
              height: {
                start: [x, y, z - dimensions.depth / 2 - offset] as [
                  number,
                  number,
                  number
                ],
                end: [
                  x,
                  y + dimensions.height,
                  z - dimensions.depth / 2 - offset,
                ] as [number, number, number],
                label: "height",
                value: Math.round(dimensions.height * 100),
              },
              depth: {
                start: [
                  x - dimensions.width / 2,
                  y + offset,
                  z + dimensions.depth / 2 + offset,
                ] as [number, number, number],
                end: [
                  x + dimensions.width / 2,
                  y + offset,
                  z + dimensions.depth / 2 + offset,
                ] as [number, number, number],
                label: "width", // Note: for left wall, depth measurement shows width
                value: Math.round(dimensions.width * 100),
              },
            },
            right: {
              width: {
                start: [
                  x,
                  y + dimensions.height + offset,
                  z - dimensions.depth / 2,
                ] as [number, number, number],
                end: [
                  x,
                  y + dimensions.height + offset,
                  z + dimensions.depth / 2,
                ] as [number, number, number],
                label: "depth", // Note: for right wall, width measurement shows depth
                value: Math.round(dimensions.depth * 100),
              },
              height: {
                start: [x, y, z + dimensions.depth / 2 + offset] as [
                  number,
                  number,
                  number
                ],
                end: [
                  x,
                  y + dimensions.height,
                  z + dimensions.depth / 2 + offset,
                ] as [number, number, number],
                label: "height",
                value: Math.round(dimensions.height * 100),
              },
              depth: {
                start: [
                  x - dimensions.width / 2,
                  y + offset,
                  z - dimensions.depth / 2 - offset,
                ] as [number, number, number],
                end: [
                  x + dimensions.width / 2,
                  y + offset,
                  z - dimensions.depth / 2 - offset,
                ] as [number, number, number],
                label: "width", // Note: for right wall, depth measurement shows width
                value: Math.round(dimensions.width * 100),
              },
            },
          },
          corner: {
            // front means the first default position
            // The corner means L-shaped wardrobe, this section is control the black measurements lines
            front: {
              width: {
                start: [
                  x - dimensions.width / 2,
                  y + dimensions.height + offset,
                  z,
                ] as [number, number, number],
                end: [
                  x + dimensions.width / 2,
                  y + dimensions.height + offset,
                  z,
                ] as [number, number, number],
                label: "width",
                value: Math.round(dimensions.width * 100),
              },
              height: {
                start: [x - dimensions.width / 2 - offset, y, z] as [
                  number,
                  number,
                  number
                ],
                end: [
                  x - dimensions.width / 2 - offset,
                  y + dimensions.height,
                  z,
                ] as [number, number, number],
                label: "height",
                value: Math.round(dimensions.height * 100),
              },
              depth: {
                start: [
                  x + dimensions.width / 2 + offset,
                  y + offset,
                  z - dimensions.depth / 2,
                ] as [number, number, number],
                end: [
                  x + dimensions.width / 2 + offset,
                  y + offset,
                  z + dimensions.depth / 2,
                ] as [number, number, number],
                label: "depth",
                value: Math.round(dimensions.depth * 100),
              },
            },
            back: {
              width: {
                start: [
                  x - dimensions.width / 2,
                  y + dimensions.height + offset,
                  z,
                ] as [number, number, number],
                end: [
                  x + dimensions.width / 2,
                  y + dimensions.height + offset,
                  z,
                ] as [number, number, number],
                label: "width",
                value: Math.round(dimensions.width * 100),
              },
              height: {
                start: [x + dimensions.width / 2 + offset, y, z] as [
                  number,
                  number,
                  number
                ],
                end: [
                  x + dimensions.width / 2 + offset,
                  y + dimensions.height,
                  z,
                ] as [number, number, number],
                label: "height",
                value: Math.round(dimensions.height * 100),
              },
              depth: {
                start: [
                  x - dimensions.width / 2 - offset,
                  y + offset,
                  z - dimensions.depth / 2,
                ] as [number, number, number],
                end: [
                  x - dimensions.width / 2 - offset,
                  y + offset,
                  z + dimensions.depth / 2,
                ] as [number, number, number],
                label: "depth",
                value: Math.round(dimensions.depth * 100),
              },
            },
            left: {
              width: {
                start: [
                  x,
                  y + dimensions.height + offset,
                  z - dimensions.depth / 2,
                ] as [number, number, number],
                end: [
                  x,
                  y + dimensions.height + offset,
                  z + dimensions.depth / 2,
                ] as [number, number, number],
                label: "depth",
                value: Math.round(dimensions.depth * 100),
              },
              height: {
                start: [x, y, z - dimensions.depth / 2 - offset] as [
                  number,
                  number,
                  number
                ],
                end: [
                  x,
                  y + dimensions.height,
                  z - dimensions.depth / 2 - offset,
                ] as [number, number, number],
                label: "height",
                value: Math.round(dimensions.height * 100),
              },
              depth: {
                start: [
                  x - dimensions.width / 2,
                  y + offset,
                  z + dimensions.depth / 2 + offset,
                ] as [number, number, number],
                end: [
                  x + dimensions.width / 2,
                  y + offset,
                  z + dimensions.depth / 2 + offset,
                ] as [number, number, number],
                label: "width",
                value: Math.round(dimensions.width * 100),
              },
            },
            right: {
              width: {
                start: [
                  x,
                  y + dimensions.height + offset,
                  z - dimensions.depth / 2,
                ] as [number, number, number],
                end: [
                  x,
                  y + dimensions.height + offset,
                  z + dimensions.depth / 2,
                ] as [number, number, number],
                label: "depth",
                value: Math.round(dimensions.depth * 100),
              },
              height: {
                start: [x, y, z + dimensions.depth / 2 + offset] as [
                  number,
                  number,
                  number
                ],
                end: [
                  x,
                  y + dimensions.height,
                  z + dimensions.depth / 2 + offset,
                ] as [number, number, number],
                label: "height",
                value: Math.round(dimensions.height * 100),
              },
              depth: {
                start: [
                  x - dimensions.width / 2,
                  y + offset,
                  z - dimensions.depth / 2 - offset,
                ] as [number, number, number],
                end: [
                  x + dimensions.width / 2,
                  y + offset,
                  z - dimensions.depth / 2 - offset,
                ] as [number, number, number],
                label: "width",
                value: Math.round(dimensions.width * 100),
              },
            },
          },
          // Future extensibility for polygon shapes
          polygon: {
            front: {
              // Custom measurements for polygon shapes can be added here
            },
            back: {},
            left: {},
            right: {},
          },
        };

        // Get the appropriate measurement configuration
        const shapeConfig =
          measurementConfigurations[
            wardrobeShape as keyof typeof measurementConfigurations
          ] || measurementConfigurations.normal;
        const wallConfig =
          shapeConfig[wallOrientation as keyof typeof shapeConfig] ||
          shapeConfig.front;

        // Generate individual measurements from the map
        const individualMeasurements = Object.entries(wallConfig).map(
          ([_, config]) => ({
            start: (config as MeasurementConfig).start,
            end: (config as MeasurementConfig).end,
            label: (config as MeasurementConfig).label,
            value: (config as MeasurementConfig).value,
            color: "#fff",
            lineColor: "black",
            labelColor: "black",
          })
        );

        individualMeasurements.forEach((measurement, index) => {
          measurements.push(
            <WardrobeMeasurement
              key={`single-${instance.id}-${index}`}
              start={measurement.start}
              end={measurement.end}
              label={measurement.label}
              value={measurement.value}
              color={measurement.color}
              lineColor={measurement.lineColor}
              labelColor={measurement.labelColor}
            />
          );
        });
      } else {
        // Multiple wardrobes on same wall - show grouped measurements

        // Find leftmost and rightmost positions
        const leftmostWardrobe = validGroup.wardrobes.reduce((prev, current) =>
          prev.leftmostX < current.leftmostX ? prev : current
        );
        const rightmostWardrobe = validGroup.wardrobes.reduce((prev, current) =>
          prev.rightmostX > current.rightmostX ? prev : current
        );

        // Calculate group boundaries
        const groupLeftCoord = leftmostWardrobe.leftmostX;
        const groupRightCoord = rightmostWardrobe.rightmostX;
        const totalGroupWidth = groupRightCoord - groupLeftCoord;

        // Find the highest wardrobe for positioning the width measurement
        const highestWardrobe = validGroup.wardrobes.reduce((prev, current) =>
          current.position[1] + current.dimensions.height >
          prev.position[1] + prev.dimensions.height
            ? current
            : prev
        );

        const offset = 0.1;
        const measurementY =
          highestWardrobe.position[1] +
          highestWardrobe.dimensions.height +
          offset;

        // Determine measurement coordinates based on wall orientation
        let widthStart: [number, number, number];
        let widthEnd: [number, number, number];
        let heightStart: [number, number, number];
        let heightEnd: [number, number, number];
        let depthStart: [number, number, number];
        let depthEnd: [number, number, number];

        if (wallIndex === 0 || wallIndex === 1) {
          // Right wall (0) or Left wall (1) - wardrobes arranged along Z axis
          const measurementX = leftmostWardrobe.position[0];

          widthStart = [measurementX, measurementY, groupLeftCoord];
          widthEnd = [measurementX, measurementY, groupRightCoord];

          heightStart = [
            measurementX - offset,
            leftmostWardrobe.position[1],
            leftmostWardrobe.leftmostX,
          ];
          heightEnd = [
            measurementX - offset,
            leftmostWardrobe.position[1] + leftmostWardrobe.dimensions.height,
            leftmostWardrobe.leftmostX,
          ];

          depthStart = [
            rightmostWardrobe.position[0] -
              rightmostWardrobe.dimensions.depth / 2,
            rightmostWardrobe.position[1] + offset,
            rightmostWardrobe.rightmostX + offset,
          ];
          depthEnd = [
            rightmostWardrobe.position[0] +
              rightmostWardrobe.dimensions.depth / 2,
            rightmostWardrobe.position[1] + offset,
            rightmostWardrobe.rightmostX + offset,
          ];
        } else {
          // Front wall (2) or Back wall (3) - wardrobes arranged along X axis
          const measurementZ = leftmostWardrobe.position[2];

          widthStart = [groupLeftCoord, measurementY, measurementZ];
          widthEnd = [groupRightCoord, measurementY, measurementZ];

          heightStart = [
            leftmostWardrobe.leftmostX - offset,
            leftmostWardrobe.position[1],
            measurementZ,
          ];
          heightEnd = [
            leftmostWardrobe.leftmostX - offset,
            leftmostWardrobe.position[1] + leftmostWardrobe.dimensions.height,
            measurementZ,
          ];

          depthStart = [
            rightmostWardrobe.rightmostX + offset,
            rightmostWardrobe.position[1] + offset,
            rightmostWardrobe.position[2] -
              rightmostWardrobe.dimensions.depth / 2,
          ];
          depthEnd = [
            rightmostWardrobe.rightmostX + offset,
            rightmostWardrobe.position[1] + offset,
            rightmostWardrobe.position[2] +
              rightmostWardrobe.dimensions.depth / 2,
          ];
        }

        // Create unique keys based on wall index and wardrobe IDs in the group
        const wardrobeIds = validGroup.wardrobes
          .map((w) => w.instance.id)
          .sort()
          .join("-");
        const groupKey = `wall-${wallIndex}-wardrobes-${wardrobeIds}`;

        // Group width measurement - from leftmost to rightmost (always visible when measurements on)
        measurements.push(
          <WardrobeMeasurement
            key={`${groupKey}-width`}
            start={widthStart}
            end={widthEnd}
            label="total width"
            value={Math.round(totalGroupWidth * 100)}
            color="#fff"
            lineColor="black"
            labelColor="black"
          />
        );

        // Height measurement - at leftmost wardrobe position (always visible when measurements on)
        measurements.push(
          <WardrobeMeasurement
            key={`${groupKey}-height`}
            start={heightStart}
            end={heightEnd}
            label="height"
            value={Math.round(leftmostWardrobe.dimensions.height * 100)}
            color="#fff"
            lineColor="black"
            labelColor="black"
          />
        );

        // Depth measurement - at rightmost wardrobe position (always visible when measurements on)
        measurements.push(
          <WardrobeMeasurement
            key={`${groupKey}-depth`}
            start={depthStart}
            end={depthEnd}
            label="depth"
            value={Math.round(rightmostWardrobe.dimensions.depth * 100)}
            color="#fff"
            lineColor="black"
            labelColor="black"
          />
        );
      }
    });

    // Add blue measurements for actively dragged OR selected wardrobe
    const activeWardrobeId = draggedObjectId || selectedObjectId;
    if (activeWardrobeId) {
      const activeInstance = wardrobeInstances.find(
        (w) => w.id === activeWardrobeId
      );
      if (activeInstance) {
        // Skip blue measurements for L-shaped (corner) wardrobes - they now use black measurements
        if (requiresCornerPlacement(activeInstance.product.model)) {
          return measurements;
        }

        const activeProduct = products.find(
          (p) => p.model === activeInstance.product.model
        );
        if (activeProduct) {
          const r3fScale = 0.01;
          const activeDimensions = {
            width: activeProduct.width * r3fScale,
            height: activeProduct.height * r3fScale,
            depth: activeProduct.depth * r3fScale,
          };

          const [activeX, activeY, activeZ] = activeInstance.position;

          // Calculate room boundaries
          const roomWidth = roomDimensions.width;
          const roomHeight = roomDimensions.height;

          const leftWallX = -roomWidth / 2;
          const rightWallX = roomWidth / 2;

          // Find closest left object/wall
          let leftDistance = activeX - activeDimensions.width / 2 - leftWallX; // Distance to left wall
          let leftTarget = leftWallX;
          let leftLabel = "to left wall";

          // Get the active wardrobe's wall for filtering
          let activeWardrobeWall = -1;
          if (requiresWallAttachment(activeInstance.product.model)) {
            // Use rotation-based wall assignment instead of proximity-based
            activeWardrobeWall = getWallIndexFromRotation(
              activeInstance.rotation || 0,
              activeInstance.position
            );
          }

          // Check for closer wardrobes to the left - only consider wardrobes on the same wall
          wardrobeInstances.forEach((instance) => {
            if (instance.id === activeWardrobeId) return;
            const product = products.find(
              (p) => p.model === instance.product.model
            );
            if (!product) return;

            // Skip L-shape (corner) wardrobes entirely for blue measurements
            // They should only affect measurements within their own wall groups
            if (requiresCornerPlacement(instance.product.model)) {
              return;
            }

            // Skip wardrobes on different walls
            if (
              requiresWallAttachment(instance.product.model) &&
              activeWardrobeWall !== -1
            ) {
              const otherWallIndex = getWallIndexFromRotation(
                instance.rotation || 0,
                instance.position
              );
              if (otherWallIndex !== activeWardrobeWall) return;
            }

            const otherWidth = product.width * r3fScale;
            const otherRightEdge = instance.position[0] + otherWidth / 2;
            const distanceToOther =
              activeX - activeDimensions.width / 2 - otherRightEdge;

            if (distanceToOther > 0 && distanceToOther < leftDistance) {
              leftDistance = distanceToOther;
              leftTarget = otherRightEdge;
              leftLabel = "to wardrobe";
            }
          });

          // Find closest right object/wall
          let rightDistance =
            rightWallX - (activeX + activeDimensions.width / 2); // Distance to right wall
          let rightTarget = rightWallX;
          let rightLabel = "to right wall";

          // Check for closer wardrobes to the right - only consider wardrobes on the same wall
          wardrobeInstances.forEach((instance) => {
            if (instance.id === activeWardrobeId) return;
            const product = products.find(
              (p) => p.model === instance.product.model
            );
            if (!product) return;

            // Skip L-shape (corner) wardrobes entirely for blue measurements
            // They should only affect measurements within their own wall groups
            if (requiresCornerPlacement(instance.product.model)) {
              return;
            }

            // Skip wardrobes on different walls
            if (
              requiresWallAttachment(instance.product.model) &&
              activeWardrobeWall !== -1
            ) {
              const otherWallIndex = getWallIndexFromRotation(
                instance.rotation || 0,
                instance.position
              );
              if (otherWallIndex !== activeWardrobeWall) return;
            }

            const otherWidth = product.width * r3fScale;
            const otherLeftEdge = instance.position[0] - otherWidth / 2;
            const distanceToOther =
              otherLeftEdge - (activeX + activeDimensions.width / 2);

            if (distanceToOther > 0 && distanceToOther < rightDistance) {
              rightDistance = distanceToOther;
              rightTarget = otherLeftEdge;
              rightLabel = "to wardrobe";
            }
          });

          // Distance to ceiling
          const ceilingDistance =
            roomHeight - (activeY + activeDimensions.height);

          // Calculate additional distances for different orientations
          const roomDepth = roomDimensions.depth;
          const frontWallZ = -roomDepth / 2;
          const backWallZ = roomDepth / 2;

          // Find closest front object/wall
          let frontDistance = activeZ - activeDimensions.depth / 2 - frontWallZ;
          let frontTarget = frontWallZ;
          let frontLabel = "to front wall";

          // Check for closer wardrobes to the front - only consider wardrobes on the same wall
          wardrobeInstances.forEach((instance) => {
            if (instance.id === activeWardrobeId) return;
            const product = products.find(
              (p) => p.model === instance.product.model
            );
            if (!product) return;

            // Skip L-shape (corner) wardrobes entirely for blue measurements
            // They should only affect measurements within their own wall groups
            if (requiresCornerPlacement(instance.product.model)) {
              return;
            }

            // Skip wardrobes on different walls
            if (
              requiresWallAttachment(instance.product.model) &&
              activeWardrobeWall !== -1
            ) {
              const otherWallIndex = getWallIndexFromRotation(
                instance.rotation || 0,
                instance.position
              );
              if (otherWallIndex !== activeWardrobeWall) return;
            }

            const otherDepth = product.depth * r3fScale;
            const otherBackEdge = instance.position[2] + otherDepth / 2;
            const distanceToOther =
              activeZ - activeDimensions.depth / 2 - otherBackEdge;

            if (distanceToOther > 0 && distanceToOther < frontDistance) {
              frontDistance = distanceToOther;
              frontTarget = otherBackEdge;
              frontLabel = "to wardrobe";
            }
          });

          // Find closest back object/wall
          let backDistance = backWallZ - (activeZ + activeDimensions.depth / 2);
          let backTarget = backWallZ;
          let backLabel = "to back wall";

          // Check for closer wardrobes to the back - only consider wardrobes on the same wall
          wardrobeInstances.forEach((instance) => {
            if (instance.id === activeWardrobeId) return;
            const product = products.find(
              (p) => p.model === instance.product.model
            );
            if (!product) return;

            // Skip L-shape (corner) wardrobes entirely for blue measurements
            // They should only affect measurements within their own wall groups
            if (requiresCornerPlacement(instance.product.model)) {
              return;
            }

            // Skip wardrobes on different walls
            if (
              requiresWallAttachment(instance.product.model) &&
              activeWardrobeWall !== -1
            ) {
              const otherWallIndex = getWallIndexFromRotation(
                instance.rotation || 0,
                instance.position
              );
              if (otherWallIndex !== activeWardrobeWall) return;
            }

            const otherDepth = product.depth * r3fScale;
            const otherFrontEdge = instance.position[2] - otherDepth / 2;
            const distanceToOther =
              otherFrontEdge - (activeZ + activeDimensions.depth / 2);

            if (distanceToOther > 0 && distanceToOther < backDistance) {
              backDistance = distanceToOther;
              backTarget = otherFrontEdge;
              backLabel = "to wardrobe";
            }
          });

          // Determine which wall the wardrobe is facing for appropriate measurements
          // Use rotation-based wall assignment instead of proximity
          const facingWallIndex = getWallIndexFromRotation(
            activeInstance.rotation || 0,
            activeInstance.position
          );

          // Map wall index to wall orientation for measurement configuration
          const wallIndexToOrientation = {
            0: "right",
            1: "left",
            2: "back",
            3: "front",
          } as const;

          const facingWall =
            wallIndexToOrientation[
              facingWallIndex as keyof typeof wallIndexToOrientation
            ] || "back";

          // Blue measurement configurations for different wall orientations
          type DragMeasurementConfig = {
            start: [number, number, number];
            end: [number, number, number];
            label: string;
            value: number;
            color: string;
            lineColor: string;
            labelColor: string;
          };

          type DragMeasurements = {
            [key: string]: DragMeasurementConfig;
          };

          type WallDragMeasurements = {
            front: DragMeasurements;
            back: DragMeasurements;
            left: DragMeasurements;
            right: DragMeasurements;
          };

          const dragMeasurementConfigs: WallDragMeasurements = {
            // wall
            front: {
              horizontal: {
                start: [
                  leftTarget,
                  activeY + activeDimensions.height / 2,
                  activeZ,
                ] as [number, number, number],
                end: [
                  activeX - activeDimensions.width / 2,
                  activeY + activeDimensions.height / 2,
                  activeZ,
                ] as [number, number, number],
                label: leftLabel,
                value: Math.round(leftDistance * 100),
                color: "#fff",
                lineColor: "blue",
                labelColor: "blue",
              },
              horizontalRight: {
                start: [
                  activeX + activeDimensions.width / 2,
                  activeY + activeDimensions.height / 2,
                  activeZ,
                ] as [number, number, number],
                end: [
                  rightTarget,
                  activeY + activeDimensions.height / 2,
                  activeZ,
                ] as [number, number, number],
                label: rightLabel,
                value: Math.round(rightDistance * 100),
                color: "#fff",
                lineColor: "blue",
                labelColor: "blue",
              },
              vertical: {
                start: [
                  activeX,
                  activeY + activeDimensions.height,
                  activeZ,
                ] as [number, number, number],
                end: [activeX, roomHeight, activeZ] as [number, number, number],
                label: "to ceiling",
                value: Math.round(ceilingDistance * 100),
                color: "#fff",
                lineColor: "blue",
                labelColor: "blue",
              },
            },
            // back is default, sit in the back wall, facing the front
            back: {
              horizontal: {
                start: [
                  leftTarget,
                  activeY + activeDimensions.height / 2,
                  activeZ,
                ] as [number, number, number],
                end: [
                  activeX - activeDimensions.width / 2,
                  activeY + activeDimensions.height / 2,
                  activeZ,
                ] as [number, number, number],
                label: leftLabel,
                value: Math.round(leftDistance * 100),
                color: "#fff",
                lineColor: "blue",
                labelColor: "blue",
              },
              horizontalRight: {
                start: [
                  activeX + activeDimensions.width / 2,
                  activeY + activeDimensions.height / 2,
                  activeZ,
                ] as [number, number, number],
                end: [
                  rightTarget,
                  activeY + activeDimensions.height / 2,
                  activeZ,
                ] as [number, number, number],
                label: rightLabel,
                value: Math.round(rightDistance * 100),
                color: "#fff",
                lineColor: "blue",
                labelColor: "blue",
              },
              vertical: {
                start: [
                  activeX,
                  activeY + activeDimensions.height,
                  activeZ,
                ] as [number, number, number],
                end: [activeX, roomHeight, activeZ] as [number, number, number],
                label: "to ceiling",
                value: Math.round(ceilingDistance * 100),
                color: "#fff",
                lineColor: "blue",
                labelColor: "blue",
              },
            },
            left: {
              depth: {
                start: [
                  activeX,
                  activeY + activeDimensions.height / 2,
                  frontTarget,
                ] as [number, number, number],
                end: [
                  activeX,
                  activeY + activeDimensions.height / 2,
                  activeZ - activeDimensions.depth / 2,
                ] as [number, number, number],
                label: frontLabel,
                value: Math.round(frontDistance * 100),
                color: "#fff",
                lineColor: "blue",
                labelColor: "blue",
              },
              depthBack: {
                start: [
                  activeX,
                  activeY + activeDimensions.height / 2,
                  activeZ + activeDimensions.depth / 2,
                ] as [number, number, number],
                end: [
                  activeX,
                  activeY + activeDimensions.height / 2,
                  backTarget,
                ] as [number, number, number],
                label: backLabel,
                value: Math.round(backDistance * 100),
                color: "#fff",
                lineColor: "blue",
                labelColor: "blue",
              },
              vertical: {
                start: [
                  activeX,
                  activeY + activeDimensions.height,
                  activeZ,
                ] as [number, number, number],
                end: [activeX, roomHeight, activeZ] as [number, number, number],
                label: "to ceiling",
                value: Math.round(ceilingDistance * 100),
                color: "#fff",
                lineColor: "blue",
                labelColor: "blue",
              },
            },
            right: {
              depth: {
                start: [
                  activeX,
                  activeY + activeDimensions.height / 2,
                  frontTarget,
                ] as [number, number, number],
                end: [
                  activeX,
                  activeY + activeDimensions.height / 2,
                  activeZ - activeDimensions.depth / 2,
                ] as [number, number, number],
                label: frontLabel,
                value: Math.round(frontDistance * 100),
                color: "#fff",
                lineColor: "blue",
                labelColor: "blue",
              },
              depthBack: {
                start: [
                  activeX,
                  activeY + activeDimensions.height / 2,
                  activeZ + activeDimensions.depth / 2,
                ] as [number, number, number],
                end: [
                  activeX,
                  activeY + activeDimensions.height / 2,
                  backTarget,
                ] as [number, number, number],
                label: backLabel,
                value: Math.round(backDistance * 100),
                color: "#fff",
                lineColor: "blue",
                labelColor: "blue",
              },
              vertical: {
                start: [
                  activeX,
                  activeY + activeDimensions.height,
                  activeZ,
                ] as [number, number, number],
                end: [activeX, roomHeight, activeZ] as [number, number, number],
                label: "to ceiling",
                value: Math.round(ceilingDistance * 100),
                color: "#fff",
                lineColor: "blue",
                labelColor: "blue",
              },
            },
          };

          // Get the appropriate measurements based on wardrobe facing direction
          const activeMeasurements =
            dragMeasurementConfigs[facingWall] || dragMeasurementConfigs.back;
          const dragMeasurements = Object.values(activeMeasurements);

          dragMeasurements.forEach((measurement, index) => {
            measurements.push(
              <WardrobeMeasurement
                key={`active-${activeWardrobeId}-${index}`}
                start={measurement.start}
                end={measurement.end}
                label={measurement.label}
                value={measurement.value}
                color={measurement.color}
                lineColor={measurement.lineColor}
                labelColor={measurement.labelColor}
              />
            );
          });
        }
      }
    }

    return measurements;
  }, [
    wallGroups,
    draggedObjectId,
    selectedObjectId,
    wardrobeInstances,
    roomDimensions,
  ]);

  if (!showWardrobeMeasurements) {
    return null;
  }

  return <group>{groupMeasurements}</group>;
};

export default GroupedWardrobeMeasurements;
