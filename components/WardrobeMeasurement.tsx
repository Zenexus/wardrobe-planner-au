import React from "react";
import { Vector3 } from "three";
import { Html } from "@react-three/drei";

type WardrobeMeasurementProps = {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
  value: number; // Value in cm
  color?: string;
  lineColor?: string; // Color for the measurement lines
  labelColor?: string; // Background color for the label
  offset?: number; // Offset from the wardrobe surface
};

const WardrobeMeasurement: React.FC<WardrobeMeasurementProps> = ({
  start,
  end,
  value,
  color,
  lineColor = "black",
  labelColor = "black",
}) => {
  const startVec = new Vector3(...start);
  const endVec = new Vector3(...end);
  const midpoint = new Vector3().lerpVectors(startVec, endVec, 0.5);

  const direction = new Vector3().subVectors(endVec, startVec).normalize();
  const capLength = 0.1;

  let perpendicular = new Vector3();
  if (Math.abs(direction.y) < 0.9) {
    perpendicular.crossVectors(direction, new Vector3(0, 1, 0)).normalize();
  } else {
    perpendicular.crossVectors(direction, new Vector3(1, 0, 0)).normalize();
  }

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

  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array([...startVec.toArray(), ...endVec.toArray()]),
              3,
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={lineColor} linewidth={3} />
      </line>

      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array([
                ...startCapPoint1.toArray(),
                ...startCapPoint2.toArray(),
              ]),
              3,
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={lineColor} linewidth={3} />
      </line>

      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array([
                ...endCapPoint1.toArray(),
                ...endCapPoint2.toArray(),
              ]),
              3,
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={lineColor} linewidth={3} />
      </line>

      <Html
        position={[midpoint.x, midpoint.y, midpoint.z]}
        center
        zIndexRange={[16777271, 16777000]}
        pointerEvents="none"
      >
        <div
          className="py-1.5 px-2 rounded-lg shadow-sm font-normal text-xs whitespace-nowrap"
          style={{
            backgroundColor: labelColor,
            borderColor: color,
            color: color,
            lineHeight: "0.8",
          }}
        >
          {value} cm
        </div>
      </Html>
    </group>
  );
};

export default WardrobeMeasurement;
