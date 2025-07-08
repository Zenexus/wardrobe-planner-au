import { useStore } from "@/store";
import MearsurementLine from "./MearsurementLine";
import { Wall } from "../helper/closestWallDetector";

interface WallMeasurementsProps {
  walls: Wall[];
}

const WallMeasurements = ({ walls }: WallMeasurementsProps) => {
  const { customizeMode } = useStore();
  const OFFSET_DISTANCE = 3; // Distance to offset measurement lines from walls

  // Don't render anything if not in customize mode
  if (!customizeMode) return null;

  return (
    <>
      {walls.map((wall, index) => {
        // Skip walls without args
        if (!wall.args) return null;

        // Extract wall dimensions and position
        const [width, height, depth] = wall.args;
        const [x, y, z] = wall.position;

        // For horizontal walls (along X axis - North/South walls)
        if (width > depth) {
          // Calculate the exact endpoints of the wall along X axis
          const startX = x - width / 2;
          const endX = x + width / 2;

          // For North wall (negative Z), place measurement outside (more negative Z)
          if (z < 0) {
            return (
              <MearsurementLine
                key={`wall-measure-${index}`}
                start={[startX, y, z - OFFSET_DISTANCE]}
                end={[endX, y, z - OFFSET_DISTANCE]}
                label={width * 100} // Convert to cm
                color="black"
              />
            );
          }
          // For South wall (positive Z), place measurement outside (more positive Z)
          else {
            return (
              <MearsurementLine
                key={`wall-measure-${index}`}
                start={[startX, y, z + OFFSET_DISTANCE]}
                end={[endX, y, z + OFFSET_DISTANCE]}
                label={width * 100} // Convert to cm
                color="black"
              />
            );
          }
        }
        // For vertical walls (along Z axis - East/West walls)
        else {
          // Calculate the exact endpoints of the wall along Z axis
          const startZ = z - depth / 2;
          const endZ = z + depth / 2;

          // For East wall (positive X), place measurement outside (more positive X)
          if (x > 0) {
            return (
              <MearsurementLine
                key={`wall-measure-${index}`}
                start={[x + OFFSET_DISTANCE, y, startZ]}
                end={[x + OFFSET_DISTANCE, y, endZ]}
                label={depth * 100} // Convert to cm
                color="black"
              />
            );
          }
          // For West wall (negative X), place measurement outside (more negative X)
          else {
            return (
              <MearsurementLine
                key={`wall-measure-${index}`}
                start={[x - OFFSET_DISTANCE, y, startZ]}
                end={[x - OFFSET_DISTANCE, y, endZ]}
                label={depth * 100} // Convert to cm
                color="black"
              />
            );
          }
        }
      })}
    </>
  );
};

export default WallMeasurements;
