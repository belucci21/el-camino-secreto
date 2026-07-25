"use client";

import { Sparkles } from "@react-three/drei";
import { Canvas, useFrame, type ThreeElements } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export type PortalVisualState =
  | "distant"
  | "waiting"
  | "wrong"
  | "awake"
  | "open";

export type PortalMode =
  | "hero"
  | "discovery"
  | "approach"
  | "gate"
  | "opening"
  | "revealed";

interface PortalCanvasProps {
  state: PortalVisualState;
  mode: PortalMode;
  progress?: number;
  reducedMotion: boolean;
  variant?: "portal" | "atmosphere";
}

function smoothstep(value: number, start: number, end: number) {
  const normalized = THREE.MathUtils.clamp((value - start) / (end - start), 0, 1);
  return normalized * normalized * (3 - 2 * normalized);
}

function GoldMaterial(props: ThreeElements["meshStandardMaterial"]) {
  return (
    <meshStandardMaterial
      color="#d4af37"
      emissive="#6f4d12"
      metalness={0.86}
      roughness={0.34}
      {...props}
    />
  );
}

function PortalRig({
  state,
  mode,
  progress = 0,
  reducedMotion,
}: PortalCanvasProps) {
  const group = useRef<THREE.Group>(null);
  const leftDoor = useRef<THREE.Group>(null);
  const rightDoor = useRef<THREE.Group>(null);
  const lightCore = useRef<THREE.Mesh>(null);
  const isOpen = state === "open";
  const isAwake = state === "awake" || isOpen || mode === "opening";
  const isWrong = state === "wrong";
  const scrollApproach = smoothstep(progress, 0.08, 0.72);
  const scrollOpening = smoothstep(progress, 0.72, 0.96);
  const targetZ = THREE.MathUtils.lerp(5.8, 2.75, scrollApproach);
  const targetY = THREE.MathUtils.lerp(0.46, 0.18, scrollApproach);

  const runePositions = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => {
        const angle = (index / 17) * Math.PI;
        return {
          x: Math.cos(angle) * 1.14,
          y: Math.sin(angle) * 1.18 + 0.16,
          z: 0.08,
          s: index % 3 === 0 ? 0.055 : 0.04,
        };
      }),
    [],
  );
  const portalLightShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.82, -1.16);
    shape.lineTo(0.82, -1.16);
    shape.lineTo(0.82, 0.18);
    shape.bezierCurveTo(0.82, 0.78, 0.46, 1.16, 0, 1.16);
    shape.bezierCurveTo(-0.46, 1.16, -0.82, 0.78, -0.82, 0.18);
    shape.closePath();
    return shape;
  }, []);

  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime();
    if (!reducedMotion) {
      camera.position.z += (targetZ - camera.position.z) * 0.025;
      camera.position.y += (targetY - camera.position.y) * 0.022;
      camera.lookAt(0, 0.15, 0);
    }

    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.22) * 0.035;
      group.current.position.y = Math.sin(t * 0.38) * 0.025;
      const scale = THREE.MathUtils.lerp(0.92, 1.08, scrollApproach);
      const nextScale = THREE.MathUtils.lerp(
        group.current.scale.x,
        scale,
        0.08,
      );
      group.current.scale.setScalar(nextScale);
    }

    const openAmount = Math.max(
      scrollOpening * 1.08,
      isOpen ? 0.9 : isAwake ? 0.13 + Math.sin(t * 2.2) * 0.035 : 0.025,
    );
    if (leftDoor.current) leftDoor.current.rotation.y = -openAmount;
    if (rightDoor.current) rightDoor.current.rotation.y = openAmount;
    if (lightCore.current) {
      const glow = Math.max(
        0.34 + smoothstep(progress, 0.35, 0.92) * 1.18,
        isOpen ? 1.34 : isAwake ? 0.78 + Math.sin(t * 2.6) * 0.18 : 0.34,
      );
      const openingWidth = 0.04 + scrollOpening * 0.96;
      lightCore.current.scale.set(
        Math.max(openingWidth, glow * 0.08),
        0.94 + glow * 0.04,
        1,
      );
    }
  });

  return (
    <group ref={group} position={[0, -0.16, 0]}>
      <mesh position={[0, -1.34, -0.05]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.92, 96]} />
        <meshStandardMaterial
          color="#1a170f"
          roughness={0.92}
          metalness={0.18}
          transparent
          opacity={0.28}
        />
      </mesh>

      <mesh position={[0, 0.12, -0.08]} scale={[1.18, 1.38, 0.14]}>
        <torusGeometry args={[1.22, 0.12, 16, 92]} />
        <meshStandardMaterial color="#2b281f" roughness={0.62} metalness={0.38} />
      </mesh>
      <mesh position={[0, 0.12, 0.02]} scale={[1.18, 1.38, 0.14]}>
        <torusGeometry args={[1.22, 0.018, 12, 92]} />
        <GoldMaterial emissive={isAwake ? "#b98218" : "#4d3510"} />
      </mesh>
      <mesh position={[-1.16, -0.62, -0.08]} scale={[0.18, 1.66, 0.22]}>
        <boxGeometry />
        <meshStandardMaterial color="#28241c" roughness={0.72} metalness={0.32} />
      </mesh>
      <mesh position={[1.16, -0.62, -0.08]} scale={[0.18, 1.66, 0.22]}>
        <boxGeometry />
        <meshStandardMaterial color="#28241c" roughness={0.72} metalness={0.32} />
      </mesh>
      {[-1.16, 1.16].map((x) => (
        <group key={x} position={[x, -0.62, 0.06]}>
          <mesh position={[0, 0.72, 0]} scale={[0.23, 0.025, 0.04]}>
            <boxGeometry />
            <GoldMaterial emissive="#6f4d12" />
          </mesh>
          <mesh position={[0, -0.72, 0]} scale={[0.23, 0.025, 0.04]}>
            <boxGeometry />
            <GoldMaterial emissive="#6f4d12" />
          </mesh>
        </group>
      ))}

      <mesh ref={lightCore} position={[0, -0.48, -0.12]}>
        <shapeGeometry args={[portalLightShape]} />
        <meshBasicMaterial
          color={isWrong ? "#d85c4a" : "#f5d875"}
          transparent
          opacity={isWrong ? 0.72 : isOpen ? 0.92 : 0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <group ref={leftDoor} position={[-0.84, -0.56, 0.02]}>
        <mesh position={[0.42, 0, 0]}>
          <boxGeometry args={[0.84, 2.36, 0.08]} />
          <meshStandardMaterial color="#1d1911" roughness={0.52} metalness={0.5} />
        </mesh>
        <mesh position={[0.42, 0, 0.055]} scale={[0.22, 0.34, 0.018]}>
          <torusGeometry args={[1, 0.04, 8, 36]} />
          <GoldMaterial emissive={isAwake ? "#9d701c" : "#4d3510"} />
        </mesh>
        {[-0.18, 0.18].map((x) => (
          <mesh key={x} position={[0.42 + x, 0, 0.06]} scale={[0.018, 0.9, 0.018]}>
            <boxGeometry />
            <GoldMaterial emissive={isAwake ? "#8f641a" : "#3d2a0d"} />
          </mesh>
        ))}
      </group>
      <group ref={rightDoor} position={[0.84, -0.56, 0.02]}>
        <mesh position={[-0.42, 0, 0]}>
          <boxGeometry args={[0.84, 2.36, 0.08]} />
          <meshStandardMaterial color="#1d1911" roughness={0.52} metalness={0.5} />
        </mesh>
        <mesh position={[-0.42, 0, 0.055]} scale={[0.22, 0.34, 0.018]}>
          <torusGeometry args={[1, 0.04, 8, 36]} />
          <GoldMaterial emissive={isAwake ? "#9d701c" : "#4d3510"} />
        </mesh>
        {[-0.18, 0.18].map((x) => (
          <mesh key={x} position={[-0.42 + x, 0, 0.06]} scale={[0.018, 0.9, 0.018]}>
            <boxGeometry />
            <GoldMaterial emissive={isAwake ? "#8f641a" : "#3d2a0d"} />
          </mesh>
        ))}
      </group>

      {runePositions.map((rune, index) => (
        <mesh key={index} position={[rune.x, rune.y, rune.z]} scale={[rune.s, rune.s, rune.s]}>
          <octahedronGeometry args={[1, 0]} />
          <GoldMaterial emissive={isWrong ? "#7a1c16" : isAwake ? "#c99820" : "#44300f"} />
        </mesh>
      ))}

      <Sparkles
        count={mode === "opening" ? 120 : 58}
        scale={mode === "opening" ? [4.2, 3.2, 2.4] : [3.4, 2.3, 1.4]}
        size={mode === "opening" ? 3.2 : 2}
        speed={reducedMotion ? 0 : mode === "opening" ? 1.2 : 0.45}
        color={isWrong ? "#d85c4a" : "#d4af37"}
        opacity={0.72}
      />
    </group>
  );
}

function AtmosphereRig({
  progress = 0,
  reducedMotion,
}: Pick<PortalCanvasProps, "progress" | "reducedMotion">) {
  const group = useRef<THREE.Group>(null);

  useFrame(({ camera, clock }) => {
    if (reducedMotion) return;

    const time = clock.getElapsedTime();
    camera.position.x +=
      (THREE.MathUtils.lerp(-0.22, 0.28, progress) - camera.position.x) * 0.02;
    camera.position.z +=
      (THREE.MathUtils.lerp(5.8, 4.4, progress) - camera.position.z) * 0.018;
    camera.lookAt(0, 0, 0);

    if (group.current) {
      group.current.rotation.z = Math.sin(time * 0.16) * 0.018;
      group.current.position.y = Math.sin(time * 0.34) * 0.06;
    }
  });

  return (
    <group ref={group}>
      <Sparkles
        count={96}
        scale={[5.6, 3.8, 3.2]}
        size={2.6 + progress * 2.2}
        speed={reducedMotion ? 0 : 0.36 + progress * 0.72}
        color="#f5d875"
        opacity={0.34 + progress * 0.5}
      />
      <Sparkles
        count={42}
        scale={[3.4, 2.4, 4.8]}
        size={1.4}
        speed={reducedMotion ? 0 : 0.24}
        color="#f2ede2"
        opacity={0.28 + progress * 0.3}
      />
    </group>
  );
}

export function PortalCanvas(props: PortalCanvasProps) {
  return (
    <Canvas
      className="portal-canvas"
      camera={{ position: [0, 0.42, 5.8], fov: 42 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      aria-hidden="true"
    >
      <fog attach="fog" args={["#050505", 4.2, 12]} />
      {props.variant === "atmosphere" ? (
        <AtmosphereRig
          progress={props.progress}
          reducedMotion={props.reducedMotion}
        />
      ) : (
        <>
          <ambientLight intensity={0.42} />
          <pointLight
            position={[0, 0.2, 1.1]}
            color="#f5d875"
            intensity={2.2 + (props.progress ?? 0) * 4.4}
          />
          <pointLight position={[-2.2, 1.7, 2.8]} color="#d4af37" intensity={1.2} />
          <directionalLight position={[3, 4, 4]} color="#f2ede2" intensity={0.75} />
          <PortalRig {...props} />
        </>
      )}
    </Canvas>
  );
}
