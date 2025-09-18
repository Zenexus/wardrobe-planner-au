import * as THREE from "three";
import React from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";

type GLTFResult = GLTF & {
  nodes: {
    ["Door-Gloss_White"]: THREE.Mesh;
    ["Door-Metal"]: THREE.Mesh;
  };
  materials: {
    ["Gloss White"]: THREE.MeshStandardMaterial;
    Metal: THREE.MeshStandardMaterial;
  };
};

export function Model(props: React.ComponentProps<"group">) {
  const { nodes, materials } = useGLTF(
    "/models/fixtures/Door.gltf"
  ) as unknown as GLTFResult;
  return (
    <group {...props} dispose={null}>
      <group position={[-0.203, 1.013, -0.052]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes["Door-Gloss_White"].geometry}
          material={materials["Gloss White"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes["Door-Metal"].geometry}
          material={materials.Metal}
        />
      </group>
    </group>
  );
}

useGLTF.preload("/models/fixtures/Door.gltf");
