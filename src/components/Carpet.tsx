import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "../store";
import { cmToR3F } from "../utils/scaling";

// Define texture properties
const carpetTextureProps = {
  path: "/Textures/Carpet/",
  files: [
    "Carpet016_2K-JPG_Color.jpg",
    "Carpet016_2K-JPG_NormalGL.jpg",
    "Carpet016_2K-JPG_Roughness.jpg",
  ],
  repeat: 2,
};

// Floor component with carpet textures
export function Carpet() {
  const { wallsDimensions } = useStore();
  const textures = useLoader(
    THREE.TextureLoader,
    carpetTextureProps.files.map((file) => `${carpetTextureProps.path}${file}`)
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
export function PlaceholderCarpet() {
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
      <meshStandardMaterial color="#8B4513" />
    </mesh>
  );
}

// Default export for Carpet
export default Carpet;
