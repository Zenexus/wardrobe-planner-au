import React from "react";
import { Vector3, BufferGeometry, Line, LineBasicMaterial } from "three";
import { Html } from "@react-three/drei";

interface WardrobeMeasurementProps {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
  value: number; // Value in cm
  color?: string;
  lineColor?: string; // Color for the measurement lines
  labelColor?: string; // Background color for the label
  offset?: number; // Offset from the wardrobe surface
}

const WardrobeMeasurement: React.FC<WardrobeMeasurementProps> = ({
  start,
  end,
  value,
  color,
  lineColor = "black", // Default to black if not specified
  labelColor = "black", // Default to black if not specified
}) => {
  const startVec = new Vector3(...start);
  const endVec = new Vector3(...end);
  const midpoint = new Vector3().lerpVectors(startVec, endVec, 0.5);

  // Create line geometry
  const lineGeometry = new BufferGeometry().setFromPoints([startVec, endVec]);

  // Calculate direction for perpendicular caps
  const direction = new Vector3().subVectors(endVec, startVec).normalize();
  const capLength = 0.1; // Length of the cap lines

  // Create perpendicular vector for caps
  let perpendicular = new Vector3();
  if (Math.abs(direction.y) < 0.9) {
    perpendicular.crossVectors(direction, new Vector3(0, 1, 0)).normalize();
  } else {
    perpendicular.crossVectors(direction, new Vector3(1, 0, 0)).normalize();
  }

  // Create cap line points
  const startCapPoint1 = new Vector3().addVectors(
    startVec,
    perpendicular.clone().multiplyScalar(capLength / 2)
  );
  const startCapPoint2 = new Vector3().addVectors(
    startVec,
    perpendicular.clone().multiplyScalar(-capLength / 2)
  );
  const endCapPoint1 = new Vector3().addVectors(
    endVec,
    perpendicular.clone().multiplyScalar(capLength / 2)
  );
  const endCapPoint2 = new Vector3().addVectors(
    endVec,
    perpendicular.clone().multiplyScalar(-capLength / 2)
  );

  // Create cap geometries
  const startCapGeometry = new BufferGeometry().setFromPoints([
    startCapPoint1,
    startCapPoint2,
  ]);
  const endCapGeometry = new BufferGeometry().setFromPoints([
    endCapPoint1,
    endCapPoint2,
  ]);

  return (
    <group>
      {/* Main measurement line */}
      <primitive
        object={
          new Line(
            lineGeometry,
            new LineBasicMaterial({ color: lineColor, linewidth: 3 })
          )
        }
      />

      {/* Start cap */}
      <primitive
        object={
          new Line(
            startCapGeometry,
            new LineBasicMaterial({ color: lineColor, linewidth: 3 })
          )
        }
      />

      {/* End cap */}
      <primitive
        object={
          new Line(
            endCapGeometry,
            new LineBasicMaterial({ color: lineColor, linewidth: 3 })
          )
        }
      />

      {/* Measurement label */}
      <Html
        position={[midpoint.x, midpoint.y, midpoint.z]}
        center
        zIndexRange={[16777271, 16777000]}
        pointerEvents="none"
      >
        <div
          className="px-3 py-2 rounded-sm shadow-md text-sm font-medium whitespace-nowrap"
          style={{
            backgroundColor: labelColor,
            borderColor: color,
            color: color,
            fontSize: "12px",
            lineHeight: "1.2",
          }}
        >
          {value} cm
        </div>
      </Html>
    </group>
  );
};

export default WardrobeMeasurement;
