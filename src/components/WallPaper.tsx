import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "@/store";
import { useMemo } from "react";

// this WallPaper component include the texture and top view's wall
const wallPaperTextureProps = {
  path: "/Textures/Wallpaper/",
  files: [
    "Wallpaper001A_2K-JPG_Color.jpg",
    "Wallpaper001A_2K-JPG_NormalGL.jpg",
    "Wallpaper001A_2K-JPG_Roughness.jpg",
  ],
  repeat: 2,
};

type WallPaperProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  args?: [number, number, number];
  scale?: [number, number, number];
};

type PlaceholderWallProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  args?: [number, number, number];
  scale?: [number, number, number];
};

export function WallPaper({
  position,
  rotation,
  args,
  scale = [1, 1, 1],
}: WallPaperProps) {
  const { customizeMode } = useStore();
  const textures = useLoader(
    THREE.TextureLoader,
    wallPaperTextureProps.files.map(
      (file) => `${wallPaperTextureProps.path}${file}`
    )
  );

  const [colorMap, normalMap, roughnessMap] = textures;

  // Configure texture repeats
  const textureRepeat = wallPaperTextureProps.repeat;

  // Set repeat and wrapping for all textures
  textures.forEach((texture) => {
    texture.repeat.set(textureRepeat, textureRepeat);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  });

  // Create materials array for each face when in customize mode
  const materials = useMemo(() => {
    if (!customizeMode) return null;

    // Create standard material for all sides
    const standardMaterial = new THREE.MeshStandardMaterial({
      map: colorMap,
      normalMap: normalMap,
      roughnessMap: roughnessMap,
      normalScale: new THREE.Vector2(0.5, 0.5),
      side: THREE.DoubleSide,
    });

    // Create black material for top side
    // This makes the top edge of walls visible as black lines when viewed from above in customize mode
    const topMaterial = new THREE.MeshStandardMaterial({
      color: "black",
      side: THREE.DoubleSide,
    });

    // Create array of materials in the order: right, left, top, bottom, front, back
    return [
      standardMaterial.clone(),
      standardMaterial.clone(),
      topMaterial,
      standardMaterial.clone(),
      standardMaterial.clone(),
      standardMaterial.clone(),
    ];
  }, [customizeMode, colorMap, normalMap, roughnessMap]);

  return (
    <mesh
      castShadow
      receiveShadow
      position={position}
      rotation={rotation}
      scale={scale}
    >
      <boxGeometry args={args || [1, 1, 0.01]} />
      {customizeMode ? (
        materials!.map((material, index) => (
          <primitive
            key={index}
            object={material}
            attach={`material-${index}`}
          />
        ))
      ) : (
        <meshStandardMaterial
          map={colorMap}
          normalMap={normalMap}
          roughnessMap={roughnessMap}
          normalScale={new THREE.Vector2(0.5, 0.5)}
          side={THREE.DoubleSide}
        />
      )}
    </mesh>
  );
}

export function PlaceholderWall({
  position,
  rotation,
  args,
  scale = [1, 1, 1],
}: PlaceholderWallProps) {
  return (
    <mesh
      castShadow
      receiveShadow
      position={position}
      rotation={rotation}
      scale={scale}
    >
      <boxGeometry args={args || [1, 1, 0.01]} />
      <meshStandardMaterial color="lightgray" side={THREE.DoubleSide} />
    </mesh>
  );
}

export default WallPaper;
