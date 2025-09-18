import * as THREE from "three";
import React from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";

type GLTFResult = GLTF & {
  nodes: {
    ["Window-Glass"]: THREE.Mesh;
    ["Window-Gloss_White"]: THREE.Mesh;
  };
  materials: {
    Glass: THREE.MeshStandardMaterial;
    ["Gloss White"]: THREE.MeshStandardMaterial;
  };
};

export function Model(props: React.ComponentProps<"group">) {
  const { nodes, materials } = useGLTF(
    "/models/fixtures/Window.gltf"
  ) as unknown as GLTFResult;
  return (
    <group {...props} dispose={null}>
      <group position={[-0.01, 0.441, -0.024]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes["Window-Glass"].geometry}
          material={materials.Glass}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes["Window-Gloss_White"].geometry}
          material={materials["Gloss White"]}
        />
      </group>
    </group>
  );
}

useGLTF.preload("/models/fixtures/Window.gltf");
