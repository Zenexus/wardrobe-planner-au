import { useStore } from "../store";
import { WoodFloor } from "./WoodFloor";
import { Carpet } from "./Carpet";
import { Tile } from "./Tile";

const FloorRenderer = () => {
  const { floorTexture } = useStore();

  switch (floorTexture) {
    case "wood":
      return <WoodFloor />;
    case "carpet":
      return <Carpet />;
    case "tile":
      return <Tile />;
    default:
      return <WoodFloor />; // Fallback to wood floor
  }
};

export default FloorRenderer;
