/// <reference types="@react-three/fiber" />

import { Object3DNode } from "@react-three/fiber";
import * as THREE from "three";

// Extend JSX namespace to include Three.js elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      directionalLight: Object3DNode<
        THREE.DirectionalLight,
        typeof THREE.DirectionalLight
      >;
      ambientLight: Object3DNode<THREE.AmbientLight, typeof THREE.AmbientLight>;
      hemisphereLight: Object3DNode<
        THREE.HemisphereLight,
        typeof THREE.HemisphereLight
      >;
      pointLight: Object3DNode<THREE.PointLight, typeof THREE.PointLight>;
      spotLight: Object3DNode<THREE.SpotLight, typeof THREE.SpotLight>;
    }
  }
}

declare module "lottie-react";
declare module "nodemailer";
