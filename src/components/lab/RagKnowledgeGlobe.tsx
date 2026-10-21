import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges, Line } from "@react-three/drei";
import * as THREE from "three";
import { HoloRim } from "./RagNeuralEntity";

interface Chunk {
  id: string;
  vector: number[];
}
function DocumentTile({
  home,
  selected,
  id,
  time,
  enabled,
}: {
  home: THREE.Vector3;
  selected: boolean;
  id: string;
  time: RefObject<number>;
  enabled: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const axis = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  useFrame(({ camera }) => {
    if (!group.current) return;
    group.current.position.copy(home).applyAxisAngle(axis, time.current * 0.065);
    group.current.quaternion.copy(camera.quaternion);
  });
  return (
    <group ref={group}>
      <mesh>
        <planeGeometry args={[selected ? 0.56 : 0.42, 0.31]} />
        <meshBasicMaterial
          color={selected ? "#99c9be" : "#5f9dbb"}
          transparent
          opacity={enabled ? 0.1 : 0.035}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
        <Edges
          color={selected ? "#99c9be" : "#639dbd"}
          transparent
          opacity={enabled ? 0.6 : 0.18}
        />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-i * 0.018, 0.075 - i * 0.07, 0.005]}>
          <planeGeometry args={[0.28 - i * 0.045, 0.012]} />
          <meshBasicMaterial
            color={selected ? "#aafff0" : "#69d3ff"}
            transparent
            opacity={enabled ? 0.5 : 0.15}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Holographic storage, with one visible tile for each actual indexed passage. Layout is illustrative. */
export function RagKnowledgeGlobe({
  chunks,
  selected,
  time,
  ready,
  active,
}: {
  chunks: Chunk[];
  selected: string;
  time: RefObject<number>;
  ready: boolean;
  active: boolean;
}) {
  const shell = useRef<THREE.Group>(null);
  const scanner = useRef<THREE.Mesh>(null);
  const homes = useMemo(
    () =>
      chunks.map((_, i) => {
        const y = 1 - (2 * (i + 0.5)) / chunks.length;
        const a = i * Math.PI * (3 - Math.sqrt(5));
        return new THREE.Vector3(
          Math.cos(a) * Math.sqrt(1 - y * y),
          y,
          Math.sin(a) * Math.sqrt(1 - y * y),
        ).multiplyScalar(1.42);
      }),
    [chunks],
  );
  const dots = useMemo(() => {
    const values: number[] = [];
    for (let i = 0; i < 420; i++) {
      const y = 1 - (2 * i) / 419,
        r = Math.sqrt(1 - y * y),
        a = i * 2.399963;
      values.push(Math.cos(a) * r * 1.26, y * 1.26, Math.sin(a) * r * 1.26);
    }
    return new Float32Array(values);
  }, []);
  useFrame(() => {
    if (shell.current) shell.current.rotation.y = time.current * 0.065;
    if (scanner.current) {
      const y = Math.sin(time.current * 0.5) * 1.15;
      scanner.current.position.y = y;
      scanner.current.scale.setScalar(Math.sqrt(Math.max(0.02, 1.3 * 1.3 - y * y)) / 1.3);
    }
  });
  return (
    <group>
      <HoloRim radius={1.3} color="#33baff" strength={active ? 0.3 : 0.14} />
      <group ref={shell}>
        <mesh>
          <sphereGeometry args={[1.3, 36, 20]} />
          <meshBasicMaterial
            color="#5cbaff"
            wireframe
            transparent
            opacity={0.035}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        {[-0.8, -0.4, 0, 0.4, 0.8].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[Math.sqrt(1.3 * 1.3 - y * y), 0.004, 5, 90]} />
            <meshBasicMaterial color="#5ccfff" transparent opacity={0.23} toneMapped={false} />
          </mesh>
        ))}
        {[0, Math.PI / 3, (Math.PI * 2) / 3].map((a) => (
          <mesh key={a} rotation={[0, a, 0]}>
            <torusGeometry args={[1.3, 0.004, 5, 90]} />
            <meshBasicMaterial color="#52c3ff" transparent opacity={0.17} toneMapped={false} />
          </mesh>
        ))}
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[dots, 3]} />
          </bufferGeometry>
          <pointsMaterial
            color="#8be2ff"
            size={0.02}
            transparent
            opacity={ready ? 0.38 : 0.14}
            depthWrite={false}
            toneMapped={false}
          />
        </points>
      </group>
      <mesh ref={scanner} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.3, 0.009, 6, 100]} />
        <meshBasicMaterial
          color="#c0ffff"
          transparent
          opacity={active ? 0.4 : 0.18}
          toneMapped={false}
        />
      </mesh>
      <group rotation={[0.4, 0, -0.2]}>
        <Line
          points={Array.from({ length: 100 }, (_, i) => {
            const a = (i / 99) * Math.PI * 2;
            return [Math.cos(a) * 1.62, 0, Math.sin(a) * 1.62] as [number, number, number];
          })}
          color="#5cd6ff"
          lineWidth={0.7}
          dashed
          dashSize={0.12}
          gapSize={0.14}
          transparent
          opacity={0.45}
          toneMapped={false}
        />
      </group>
      {chunks.map((c, i) => (
        <DocumentTile
          key={c.id}
          id={c.id}
          home={homes[i]!}
          selected={c.id === selected}
          time={time}
          enabled={ready}
        />
      ))}
    </group>
  );
}
