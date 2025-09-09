import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "../store";
import { cmToR3F } from "../utils/scaling";

// Define texture properties
const tileTextureProps = {
  path: "/Textures/Tiles/",
  files: [
    "Tiles110_2K-JPG_Color.jpg",
    "Tiles110_2K-JPG_NormalGL.jpg",
    "Tiles110_2K-JPG_Roughness.jpg",
  ],
  repeat: 2,
};

// Floor component with tile textures
export function Tile() {
  const { wallsDimensions } = useStore();
  const textures = useLoader(
    THREE.TextureLoader,
    tileTextureProps.files.map((file) => `${tileTextureProps.path}${file}`)
  );

  const [colorMap, normalMap, roughnessMap] = textures;

  // Calculate floor dimensions from room walls
  const roomWidth = wallsDimensions.front.length; // Front wall length = room width
  const roomDepth = wallsDimensions.left.length; // Left wall length = room depth

  // Convert to R3F units for rendering
  const floorWidth = cmToR3F(roomWidth);
  const floorDepth = cmToR3F(roomDepth);

  // Configure texture repeats based on room size
  const textureRepeat = Math.max(2, Math.min(roomWidth, roomDepth) / 200); // Scale texture with room size

  // Set repeat and wrapping for all textures
  textures.forEach((texture) => {
    texture.repeat.set(textureRepeat, textureRepeat);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  });

  return (
    <mesh
      castShadow
      receiveShadow
      position-y={0} // Floor at ground level
      rotation-x={-Math.PI * 0.5}
    >
      {/* Create geometry at correct size instead of scaling */}
      <planeGeometry args={[floorWidth, floorDepth, 1, 1]} />
      <meshStandardMaterial
        map={colorMap}
        normalMap={normalMap}
        roughnessMap={roughnessMap}
        normalScale={new THREE.Vector2(0.5, 0.5)}
      />
    </mesh>
  );
}

// Simple placeholder floor for loading state
export function PlaceholderTile() {
  const { wallsDimensions } = useStore();

  // Calculate floor dimensions from room walls
  const roomWidth = wallsDimensions.front.length;
  const roomDepth = wallsDimensions.left.length;

  // Convert to R3F units for rendering
  const floorWidth = cmToR3F(roomWidth);
  const floorDepth = cmToR3F(roomDepth);

  return (
    <mesh receiveShadow position-y={0} rotation-x={-Math.PI * 0.5}>
      {/* Create geometry at correct size instead of scaling */}
      <planeGeometry args={[floorWidth, floorDepth]} />
      <meshStandardMaterial color="#D3D3D3" />
    </mesh>
  );
}

// Default export for Tile
export default Tile;
