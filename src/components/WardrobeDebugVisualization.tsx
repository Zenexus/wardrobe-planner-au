import React from "react";
import { useStore } from "../store";
import { getWardrobeBoundingBox } from "../helper/wardrobePlacement";

interface WardrobeDebugVisualizationProps {
  enabled?: boolean;
}

const WardrobeDebugVisualization: React.FC<WardrobeDebugVisualizationProps> = ({
  enabled = false,
}) => {
  const { wardrobeInstances } = useStore();

  if (!enabled) return null;

  return (
    <group>
      {wardrobeInstances.map((instance) => {
        const box = getWardrobeBoundingBox(instance);
        const width = box.maxX - box.minX;
        const depth = box.maxZ - box.minZ;
        const centerX = (box.minX + box.maxX) / 2;
        const centerZ = (box.minZ + box.maxZ) / 2;

        return (
          <mesh
            key={`debug-${instance.id}`}
            position={[centerX, 0.01, centerZ]}
          >
            <boxGeometry args={[width, 0.02, depth]} />
            <meshBasicMaterial
              color="#ff0000"
              transparent
              opacity={0.3}
              wireframe={true}
            />
          </mesh>
        );
      })}
    </group>
  );
};

export default WardrobeDebugVisualization;
