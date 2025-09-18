import React, { useMemo } from "react";
import WardrobeMeasurement from "./WardrobeMeasurement";
import { useStore } from "../store";
import productsData from "../products.json";
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
  } = useStore();

  const roomDimensions: WallRoomDimensions = useMemo(
    () => ({
      width: wallsDimensions.front.length * 0.01,
      depth: wallsDimensions.left.length * 0.01,
      height: wallsDimensions.front.height * 0.01,
      thickness: wallsDimensions.front.depth * 0.01,
    }),
    [wallsDimensions]
  );

  // Group wardrobes by wall
  const wallGroups = useMemo(() => {
    if (!showWardrobeMeasurements) return new Map<number, WallGroup>();

    const groups = new Map<number, WallGroup>();

    wardrobeInstances.forEach((instance) => {
      const product = productsData.products.find(
        (p) => p.model === instance.product.model
      );
      if (!product) return;

      const r3fScale = 0.01;
      const dimensions = {
        width: product.width * r3fScale,
        height: product.height * r3fScale,
        depth: product.depth * r3fScale,
      };

      // Group wall-attached wardrobes by wall
      if (requiresWallAttachment(instance.product.model)) {
        const wallConstraint = getClosestWall(
          instance.position,
          roomDimensions
        );
        const wallIndex = wallConstraint.wallIndex;

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
      // Handle corner wardrobes separately
      else if (requiresCornerPlacement(instance.product.model)) {
        // Corner wardrobes get their own group with special handling
        const uniqueIndex =
          1000 + parseInt(instance.id.split("-")[1]) || 1000 + Math.random();
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
  }, [wardrobeInstances, showWardrobeMeasurements, roomDimensions]);

  // Generate measurements for each wall group
  const groupMeasurements = useMemo(() => {
    const measurements: React.ReactNode[] = [];

    wallGroups.forEach((group, wallIndex) => {
      if (group.wardrobes.length === 0) return;

      // Note: Group activity check removed since we now handle blue measurements separately

      // For single wardrobe, show individual measurements
      if (group.wardrobes.length === 1) {
        const wardrobe = group.wardrobes[0];
        const { instance, position, dimensions } = wardrobe;
        const [x, y, z] = position;
        const offset = 0.1;

        // Show individual wardrobe measurements (always visible when measurements on)
        const individualMeasurements = [
          // Width measurement
          {
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
            color: "#fff",
            lineColor: "black",
            labelColor: "black",
          },
          // Height measurement (always visible when measurements on)
          {
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
            color: "#fff",
            lineColor: "black",
            labelColor: "black",
          },
          // Depth measurement (always visible when measurements on)
          {
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
            color: "#fff",
            lineColor: "black",
            labelColor: "black",
          },
        ];

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
        const leftmostWardrobe = group.wardrobes.reduce((prev, current) =>
          prev.leftmostX < current.leftmostX ? prev : current
        );
        const rightmostWardrobe = group.wardrobes.reduce((prev, current) =>
          prev.rightmostX > current.rightmostX ? prev : current
        );

        // Calculate group boundaries
        const groupLeftCoord = leftmostWardrobe.leftmostX;
        const groupRightCoord = rightmostWardrobe.rightmostX;
        const totalGroupWidth = groupRightCoord - groupLeftCoord;

        // Find the highest wardrobe for positioning the width measurement
        const highestWardrobe = group.wardrobes.reduce((prev, current) =>
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

        // Group width measurement - from leftmost to rightmost (always visible when measurements on)
        measurements.push(
          <WardrobeMeasurement
            key={`group-width-${wallIndex}`}
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
            key={`group-height-${wallIndex}`}
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
            key={`group-depth-${wallIndex}`}
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
        const activeProduct = productsData.products.find(
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

          // Check for closer wardrobes to the left
          wardrobeInstances.forEach((instance) => {
            if (instance.id === activeWardrobeId) return;
            const product = productsData.products.find(
              (p) => p.model === instance.product.model
            );
            if (!product) return;

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

          // Check for closer wardrobes to the right
          wardrobeInstances.forEach((instance) => {
            if (instance.id === activeWardrobeId) return;
            const product = productsData.products.find(
              (p) => p.model === instance.product.model
            );
            if (!product) return;

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

          // Blue measurement lines for active wardrobe (dragged or selected)
          const dragMeasurements = [
            // Left distance measurement
            {
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
            // Right distance measurement
            {
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
            // Ceiling distance measurement
            {
              start: [activeX, activeY + activeDimensions.height, activeZ] as [
                number,
                number,
                number
              ],
              end: [activeX, roomHeight, activeZ] as [number, number, number],
              label: "to ceiling",
              value: Math.round(ceilingDistance * 100),
              color: "#fff",
              lineColor: "blue",
              labelColor: "blue",
            },
          ];

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
