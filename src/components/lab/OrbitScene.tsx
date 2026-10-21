import { Canvas, useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

// Deterministic PRNG so the starfield is identical on every load.
function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

const CYAN = "#7fe7ff";
const BLUE = "#5b8cff";
const VIOLET = "#a67cff";

function Stars({ count, animate }: { count: number; animate: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const r = rng(7);
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const rad = 8 + r() * 30;
      const t = r() * Math.PI * 2;
      const p = Math.acos(2 * r() - 1);
      a.set([rad * Math.sin(p) * Math.cos(t), rad * Math.sin(p) * Math.sin(t), rad * Math.cos(p)], i * 3);
    }
    return a;
  }, [count]);
  useFrame((_, d) => {
    if (animate && ref.current) ref.current.rotation.y += Math.min(d, 0.05) * 0.01;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#cfe6ff" transparent opacity={0.7} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function Dust({ animate }: { animate: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const r = rng(42);
    const a = new Float32Array(260 * 3);
    for (let i = 0; i < 260; i++) a.set([(r() - 0.5) * 9, (r() - 0.5) * 5, (r() - 0.5) * 6], i * 3);
    return a;
  }, []);
  useFrame((_, d) => {
    if (animate && ref.current) ref.current.rotation.y -= Math.min(d, 0.05) * 0.03;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.025} color={VIOLET} transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

function Core({ animate, active }: { animate: boolean; active: boolean }) {
  const outer = useRef<THREE.Mesh>(null);
  const inner = useRef<THREE.Mesh>(null);
  const rings = useRef<THREE.Group>(null);
  useFrame((state, raw) => {
    if (!animate) return;
    const d = Math.min(raw, 0.05);
    if (outer.current) {
      outer.current.rotation.y += d * 0.15;
      outer.current.rotation.x += d * 0.05;
    }
    if (inner.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 1.4) * 0.04;
      inner.current.scale.setScalar(s);
    }
    if (rings.current) rings.current.children.forEach((c, i) => (c.rotation.z += d * (0.08 + i * 0.05) * (i % 2 ? -1 : 1)));
  });
  return (
    <group>
      <mesh ref={outer}>
        <icosahedronGeometry args={[1.1, 1]} />
        <meshBasicMaterial color={CYAN} wireframe transparent opacity={0.45} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={inner}>
        <icosahedronGeometry args={[0.55, 3]} />
        <meshBasicMaterial color={active ? CYAN : BLUE} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshBasicMaterial color={VIOLET} transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <group ref={rings}>
        {[1.55, 1.85, 2.15].map((r, i) => (
          <mesh key={r} rotation={[Math.PI / 2 + (i - 1) * 0.35, i * 0.4, 0]}>
            <torusGeometry args={[r, 0.006, 8, 160]} />
            <meshBasicMaterial color={i === 1 ? VIOLET : BLUE} transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function StageNodes({ count, selected, onSelect }: { count: number; selected: number; onSelect: (i: number) => void }) {
  const pts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const t = (i / count) * Math.PI * 2 - Math.PI / 2;
        return new THREE.Vector3(Math.cos(t) * 2.9, Math.sin(t) * 0.55, Math.sin(t) * 1.6);
      }),
    [count],
  );
  return (
    <group rotation={[0.25, 0, 0]}>
      <Line points={[...pts, pts[0]!]} color={BLUE} lineWidth={1} transparent opacity={0.35} />
      {pts.map((p, i) => (
        <group key={i}>
          <Line points={[[0, 0, 0], p]} color={i === selected ? CYAN : BLUE} lineWidth={i === selected ? 1.6 : 0.6} transparent opacity={i === selected ? 0.9 : 0.18} />
          <mesh
            position={p}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(i);
            }}
          >
            <sphereGeometry args={[i === selected ? 0.13 : 0.07, 20, 20]} />
            <meshBasicMaterial color={i === selected ? CYAN : "#9fb7ff"} blending={THREE.AdditiveBlending} transparent opacity={i === selected ? 1 : 0.75} />
          </mesh>
          {i === selected && (
            <mesh position={p}>
              <sphereGeometry args={[0.32, 20, 20]} />
              <meshBasicMaterial color={CYAN} transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

export default function OrbitScene({ count, selected, animate, onSelect }: { count: number; selected: number; animate: boolean; onSelect: (i: number) => void }) {
  return (
    <Canvas frameloop={animate ? "always" : "demand"} dpr={[1, 1.75]} camera={{ position: [0, 0.6, 6.2], fov: 50 }} gl={{ antialias: true, alpha: true }}>
      <fog attach="fog" args={["#05060c", 6, 30]} />
      <Stars count={900} animate={animate} />
      <Dust animate={animate} />
      <Core animate={animate} active={selected >= 0} />
      <StageNodes count={count} selected={selected} onSelect={onSelect} />
    </Canvas>
  );
}
