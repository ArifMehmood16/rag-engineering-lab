import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Edges, Line } from "@react-three/drei";
import * as THREE from "three";
import type { EvidenceRecord } from "@/content/apollo";
import { buildKnowledgeIndex } from "@/lib/knowledge-index";
import { atOutput, stageInput, stageOutput, type WalkthroughState } from "@/lib/rag-walkthrough";
import { scenePlan, travelPoint, type Point3, type SceneNode } from "@/lib/rag-scene";

export interface RagWorldProps {
  tour: WalkthroughState;
  record: EvidenceRecord;
  records: EvidenceRecord[];
  reduced: boolean;
  paused: boolean;
  visible: boolean;
  duration: number;
  replay: number;
}
const CYAN = "#64fff1";
const VIOLET = "#bc83ff";
function Glow({
  color,
  scale = 2,
  opacity = 0.25,
}: {
  color: string;
  scale?: number;
  opacity?: number;
}) {
  const texture = useMemo(() => {
    const size = 64;
    const bytes = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const radius = Math.hypot((x - size / 2) / (size / 2), (y - size / 2) / (size / 2));
        const offset = (y * size + x) * 4;
        bytes[offset] = bytes[offset + 1] = bytes[offset + 2] = 255;
        bytes[offset + 3] = Math.round(Math.max(0, 1 - radius) ** 3 * 255);
      }
    const map = new THREE.DataTexture(bytes, size, size, THREE.RGBAFormat);
    map.needsUpdate = true;
    return map;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <sprite scale={[scale, scale, 1]}>
      <spriteMaterial
        map={texture}
        color={color}
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </sprite>
  );
}

/** Extruded paper with legible visual lines; the exact passage remains in the HTML reader. */
function Paper({
  small = false,
  color = CYAN,
  opacity = 1,
}: {
  small?: boolean;
  color?: string;
  opacity?: number;
}) {
  const width = small ? 0.52 : 0.85;
  const height = small ? 0.34 : 1.12;
  return (
    <group>
      <mesh>
        <boxGeometry args={[width, height, 0.055]} />
        <meshStandardMaterial
          color="#123448"
          metalness={0.65}
          roughness={0.27}
          transparent
          opacity={opacity}
        />
        <Edges color={color} transparent opacity={opacity * 0.9} />
      </mesh>
      {Array.from({ length: small ? 3 : 6 }, (_, n) => (
        <mesh key={n} position={[-0.025, height * 0.32 - n * (small ? 0.085 : 0.13), 0.035]}>
          <boxGeometry args={[width * (n % 3 === 2 ? 0.48 : 0.7), 0.016, 0.012]} />
          <meshBasicMaterial color={color} transparent opacity={opacity * 0.75} />
        </mesh>
      ))}
      {!small && (
        <mesh position={[-width * 0.28, height * 0.41, 0.04]}>
          <boxGeometry args={[0.12, 0.035, 0.015]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )}
    </group>
  );
}

function VectorBars({
  values,
  growth = 1,
  opacity = 1,
}: {
  values: number[];
  growth?: number;
  opacity?: number;
}) {
  return (
    <group>
      {values.map((value, n) => {
        const height = value * 1.3 * growth;
        return (
          <group key={n} position={[(n - 3) * 0.15, -0.45, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.045, 12]} />
              <meshBasicMaterial color={CYAN} transparent opacity={opacity * 0.6} />
            </mesh>
            {height > 0 && (
              <mesh position={[0, height / 2, 0]}>
                <boxGeometry args={[0.08, height, 0.09]} />
                <meshStandardMaterial
                  color={CYAN}
                  emissive={CYAN}
                  emissiveIntensity={0.7}
                  transparent
                  opacity={opacity}
                  metalness={0.6}
                  roughness={0.2}
                />
                <Edges color="#cefffc" transparent opacity={opacity} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

function IndexVault({ active }: { active: boolean }) {
  return (
    <group>
      <Glow color={CYAN} scale={2.7} opacity={active ? 0.55 : 0.15} />
      {[0, 1, 2].map((n) => (
        <group key={n} position={[0, (n - 1) * 0.24, 0]}>
          <mesh>
            <cylinderGeometry args={[0.55, 0.55, 0.17, 48]} />
            <meshStandardMaterial color="#0d3449" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
            <torusGeometry args={[0.55, 0.012, 8, 64]} />
            <meshBasicMaterial color={active ? CYAN : "#2f829c"} />
          </mesh>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[(i - 1.5) * 0.14, 0, 0.53]}>
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshBasicMaterial color={CYAN} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Entity({ active, progress }: { active: boolean; progress: React.RefObject<number> }) {
  const shell = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!shell.current) return;
    shell.current.rotation.y = 0.35 + progress.current * 0.38;
    shell.current.rotation.z = -0.16 + progress.current * 0.08;
  });
  const neurons = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => {
        const phi = Math.acos(1 - 2 * ((i + 0.5) / 36));
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        return new THREE.Vector3(
          1.18 * Math.sin(phi) * Math.cos(theta),
          1.18 * Math.cos(phi),
          1.18 * Math.sin(phi) * Math.sin(theta),
        );
      }),
    [],
  );
  return (
    <group>
      <Glow color="#a16aff" scale={6.5} opacity={active ? 1 : 0.62} />
      <Glow color="#588bff" scale={3.2} opacity={0.7} />
      <group ref={shell} rotation={[0.15, 0.35, -0.16]}>
        <mesh>
          <icosahedronGeometry args={[1.3, 1]} />
          <meshStandardMaterial
            color="#251649"
            emissive="#5c27a0"
            emissiveIntensity={active ? 0.8 : 0.38}
            metalness={0.7}
            roughness={0.23}
            flatShading
            transparent
            opacity={0.94}
          />
          <Edges color={VIOLET} threshold={10} />
        </mesh>
        <mesh scale={1.08}>
          <icosahedronGeometry args={[1.3, 1]} />
          <meshBasicMaterial color="#8b75ee" wireframe transparent opacity={0.18} />
        </mesh>
        {neurons.map((p, i) => (
          <group key={i}>
            <mesh position={p}>
              <sphereGeometry args={[i % 5 === 0 ? 0.055 : 0.026, 10, 10]} />
              <meshBasicMaterial color={i % 4 === 0 ? "#e9d2ff" : "#b993ff"} />
            </mesh>
            {i % 2 === 0 && (
              <Line
                points={[p, neurons[(i + 7) % neurons.length]!]}
                color="#e1a5ff"
                lineWidth={0.6}
                transparent
                opacity={0.45}
              />
            )}
          </group>
        ))}
        <mesh rotation={[0, 0, 0.55]}>
          <torusGeometry args={[1.32, 0.022, 8, 96]} />
          <meshBasicMaterial color="#dfaaff" transparent opacity={0.65} />
        </mesh>
        <mesh rotation={[0.95, 0.4, -0.4]}>
          <torusGeometry args={[1.33, 0.012, 8, 96]} />
          <meshBasicMaterial color="#9fb5ff" transparent opacity={0.65} />
        </mesh>
      </group>
      <group position={[0, -1.65, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 0.83, 64]} />
          <meshBasicMaterial color="#a47bff" transparent opacity={0.55} side={THREE.DoubleSide} />
        </mesh>
        <Glow color={VIOLET} scale={2.5} opacity={0.25} />
      </group>
    </group>
  );
}

function Portal({ color = CYAN, shield = false }: { color?: string; shield?: boolean }) {
  return (
    <group>
      <Glow color={color} scale={2.2} opacity={0.4} />
      <mesh rotation={[0, 0.2, shield ? Math.PI / 6 : 0]}>
        <torusGeometry args={[0.46, 0.055, 8, shield ? 6 : 64]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1}
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>
      {shield ? (
        <Line
          points={[
            [-0.2, 0, 0.06],
            [-0.04, -0.16, 0.06],
            [0.25, 0.21, 0.06],
          ]}
          color={color}
          lineWidth={3}
        />
      ) : (
        <group scale={0.47}>
          <Paper color={color} />
        </group>
      )}
    </group>
  );
}

function Connection({
  from,
  to,
  active,
  color = CYAN,
}: {
  from: Point3;
  to: Point3;
  active: boolean;
  color?: string;
}) {
  const points = Array.from({ length: 33 }, (_, n) => travelPoint(from, to, n / 32));
  const arrow = travelPoint(from, to, 0.78);
  return (
    <group>
      <Line
        points={points}
        color={active ? color : "#265474"}
        lineWidth={active ? 1.5 : 0.7}
        transparent
        opacity={active ? 0.8 : 0.45}
      />
      {active && (
        <mesh position={arrow} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.07, 0.2, 3]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )}
    </group>
  );
}

function TravellingData({
  tour,
  values,
  progress,
}: {
  tour: WalkthroughState;
  values: number[];
  progress: React.RefObject<number>;
}) {
  const plan = scenePlan(tour);
  const group = useRef<THREE.Group>(null);
  const document = useRef<THREE.Group>(null);
  const pieces = useRef<THREE.Group[]>([]);
  const bars = useRef<THREE.Group>(null);
  const from = plan.positions[plan.transfer.from]!;
  const to = plan.positions[plan.transfer.to]!;
  const split = plan.transfer.kind === "split";
  const encode = plan.transfer.kind === "encode";
  const vector = plan.transfer.kind === "vector";
  const count = split ? 10 : plan.transfer.kind === "evidence" ? 3 : 1;
  useFrame(() => {
    if (!group.current) return;
    const t = progress.current;
    group.current.position.set(...travelPoint(from, to, t));
    group.current.rotation.y = -0.22 + Math.sin(Math.PI * t) * 0.35;
    group.current.rotation.z = Math.sin(Math.PI * t) * -0.1;
    if (document.current)
      document.current.visible = !vector && (split ? t < 0.32 : encode ? t < 0.65 : true);
    pieces.current.forEach((piece, i) => {
      if (!piece) return;
      piece.visible = split ? t >= 0.32 : plan.transfer.kind === "evidence";
      const fan = split ? THREE.MathUtils.smoothstep(t, 0.3, 0.82) : 1;
      piece.position.set(
        ((i % 2) - 0.5) * 0.69 * fan,
        (Math.floor(i / 2) - (split ? 2 : 0.5)) * 0.29 * fan,
        i * 0.055,
      );
      piece.rotation.y = (i % 2 ? 1 : -1) * 0.17 * fan;
    });
    if (bars.current) {
      bars.current.visible = vector || (encode && t > 0.3);
      bars.current.scale.setScalar(vector ? 0.8 : THREE.MathUtils.smoothstep(t, 0.3, 0.9));
    }
  });
  if (!plan.moving) return null;
  return (
    <group ref={group} position={from}>
      <Glow color={encode || vector ? "#a9a2ff" : CYAN} scale={2.5} opacity={0.6} />
      <group ref={document}>
        <Paper color={plan.transfer.kind === "draft" ? VIOLET : CYAN} small={encode} />
      </group>
      {(split || plan.transfer.kind === "evidence") &&
        Array.from({ length: count }, (_, i) => (
          <group
            key={i}
            ref={(g) => {
              if (g) pieces.current[i] = g;
            }}
            visible={false}
          >
            <Paper small />
          </group>
        ))}
      <group ref={bars} visible={vector}>
        <VectorBars values={values} />
      </group>
      {/* Transparent trailing copies give the moving sheet depth; the HTML text is never blurred. */}
      {!split && !encode && !vector && (
        <group position={[-0.15, -0.05, -0.2]}>
          <Paper small={plan.transfer.kind === "evidence"} opacity={0.16} />
        </group>
      )}
    </group>
  );
}

function World(props: RagWorldProps) {
  const { tour, records, record, reduced, paused, visible, duration, replay } = props;
  const plan = scenePlan(tour);
  const prep = tour.phase === "knowledge";
  const index = useMemo(() => buildKnowledgeIndex(records), [records]);
  const values = index.chunks.find((c) => c.id === record.id)?.vector ?? [];
  const elapsed = useRef(0);
  const progress = useRef(reduced || !plan.moving ? 1 : 0);
  const { invalidate, size, camera } = useThree();
  const after = stageOutput(tour);
  useEffect(() => {
    elapsed.current = 0;
    progress.current = reduced || !plan.moving ? 1 : 0;
    invalidate();
  }, [tour.phase, tour.stage, tour.beat, record.id, replay, reduced, plan.moving, invalidate]);
  useEffect(() => {
    invalidate();
  }, [paused, visible, invalidate]);
  useEffect(() => {
    const ortho = camera as THREE.OrthographicCamera;
    ortho.zoom = Math.min(size.width / 11.8, size.height / 5.35);
    ortho.updateProjectionMatrix();
    invalidate();
  }, [size.width, size.height, camera, invalidate]);
  useFrame((_, delta) => {
    if (!visible || paused || reduced || progress.current >= 1) return;
    elapsed.current += Math.min(delta, 0.06);
    progress.current = Math.min(1, elapsed.current / duration);
    invalidate();
  });
  const active = (n: SceneNode) => plan.active === n;
  const positions = plan.positions;
  const connection = (from: SceneNode, to: SceneNode) => (
    <Connection
      key={`${from}-${to}`}
      from={positions[from]!}
      to={positions[to]!}
      active={plan.transfer.from === from && plan.transfer.to === to && tour.beat > 0}
    />
  );
  const cacheEnabled =
    stageInput(tour).config.answerCache ||
    stageInput(tour).config.promptCache ||
    stageInput(tour).config.retrievalCache;
  return (
    <>
      <color attach="background" args={["#040711"]} />
      <fog attach="fog" args={["#040711", 15, 30]} />
      <ambientLight intensity={1.3} />
      <directionalLight position={[-3, 5, 8]} intensity={3.5} color="#94c9ff" />
      <pointLight position={[3, 2, 4]} intensity={18} color="#b15aff" distance={12} />
      <pointLight position={[-4, 1, 3]} intensity={12} color={CYAN} distance={10} />
      <gridHelper args={[28, 28, "#18394e", "#0b1b30"]} position={[0, -2.85, -3]} />
      <Stars />
      {prep ? (
        <>
          {connection("source", "chunks")}
          {connection("chunks", "vectors")}
          {connection("vectors", "index")}
          <group position={positions.source!} rotation={[0.04, -0.22, -0.08]}>
            <group position={[0.13, -0.1, -0.18]}>
              <Paper opacity={0.45} />
            </group>
            <Paper />
            {active("source") && <Glow color={CYAN} scale={2.8} opacity={0.4} />}
          </group>

          <group position={positions.chunks!}>
            {index.chunks.map((c, i) => (
              <group
                key={c.id}
                position={[
                  ((i % 2) - 0.5) * 0.62,
                  (Math.floor(i / 2) - 2) * 0.26,
                  -0.15 - i * 0.045,
                ]}
                rotation={[0, -0.2, -0.05]}
              >
                <Paper
                  small
                  opacity={active("chunks") || tour.stage > 1 ? 0.85 : 0.24}
                  color={c.id === record.id ? "#d3fffa" : CYAN}
                />
              </group>
            ))}
            {active("chunks") && <Glow color={CYAN} scale={3} opacity={0.35} />}
          </group>
          <group position={positions.vectors!}>
            <VectorBars values={values} opacity={tour.stage >= 2 ? 1 : 0.2} />
            {active("vectors") && <Glow color={CYAN} scale={2.5} opacity={0.5} />}
          </group>

          <group position={positions.index!}>
            <IndexVault active={active("index")} />
          </group>
        </>
      ) : (
        <>
          {connection("question", "router")}
          {connection("router", "retrieve")}
          {connection("index", "retrieve")}
          {connection("retrieve", "context")}
          {connection("context", "model")}
          {connection("model", "check")}
          {(cacheEnabled || tour.stage === 2) && connection("router", "cache")}
          {tour.stage === 5 && connection("context", "tool")}
          <group position={positions.source!} scale={0.65} rotation={[0, -0.2, -0.1]}>
            <Paper />
          </group>
          <group position={positions.index!}>
            <IndexVault active={active("index") || tour.stage === 3} />
          </group>
          <group position={positions.question!}>
            <Portal />
          </group>
          <group position={positions.router!}>
            <mesh rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.28, 0.28, 0.28]} />
              <meshStandardMaterial
                color={VIOLET}
                emissive={VIOLET}
                emissiveIntensity={active("router") ? 0.6 : 0.1}
              />
              <Edges color="#e1bcff" />
            </mesh>
          </group>
          <group position={positions.retrieve!}>
            <mesh>
              <torusGeometry args={[0.3, 0.045, 8, 48]} />
              <meshBasicMaterial color={CYAN} />
            </mesh>
            <Line
              points={[
                [0.2, -0.22, 0],
                [0.4, -0.42, 0],
              ]}
              color={CYAN}
              lineWidth={3}
            />
          </group>
          <group position={positions.context!}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
              <boxGeometry args={[1.1, 0.8, 0.06]} />
              <meshStandardMaterial color="#1a3550" metalness={0.7} />
              <Edges color={CYAN} />
            </mesh>
            {[0, 1, 2].map((i) => (
              <group
                key={i}
                position={[(i - 1) * 0.22, i * 0.11, i * 0.05]}
                rotation={[0, -0.1, 0]}
              >
                <Paper small opacity={tour.stage >= 4 ? 0.9 : 0.3} />
              </group>
            ))}
          </group>
          {(cacheEnabled || tour.stage === 2) && (
            <>
              <group position={positions.cache!}>
                <mesh rotation={[0.4, 0.5, 0.3]}>
                  <octahedronGeometry args={[0.4]} />
                  <meshStandardMaterial
                    color="#a66a21"
                    emissive="#edaf58"
                    emissiveIntensity={0.4}
                    metalness={0.8}
                    roughness={0.2}
                  />
                  <Edges color="#ffd78a" />
                </mesh>
                <Glow color="#ffb94a" opacity={0.3} />
              </group>
            </>
          )}
          {tour.stage === 5 && (
            <>
              <group position={positions.tool!} scale={0.65}>
                <Portal color="#8cf1b5" shield />
              </group>
            </>
          )}
          <group position={positions.check!}>
            {tour.stage === 10 && atOutput(tour) && after?.ctx.released ? (
              <Paper color="#aaffce" />
            ) : (
              <Portal color={plan.blocked ? "#ff878d" : "#aaffce"} shield />
            )}
          </group>
        </>
      )}
      <group position={positions.model!} scale={1.12}>
        <Entity active={!prep && tour.stage === 7 && !plan.skipped} progress={progress} />
      </group>

      <TravellingData tour={tour} values={values} progress={progress} />
    </>
  );
}

function Stars() {
  const points = useMemo(
    () =>
      new Float32Array(
        Array.from({ length: 180 }, (_, n) => {
          const i = Math.floor(n / 3);
          return n % 3 === 0
            ? Math.sin(i * 43.7) * 14
            : n % 3 === 1
              ? Math.cos(i * 19.3) * 7
              : -4 - (i % 8);
        }),
      ),
    [],
  );
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.025} color="#79a9dc" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

export default function RagWorld(props: RagWorldProps) {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 2.1, 14], zoom: 60, near: 0.1, far: 50 }}
      dpr={[1, 2]}
      frameloop="demand"
      gl={{ antialias: true, alpha: false, powerPreference: "low-power" }}
      fallback={<span>3D unavailable. Use the step reader to follow the same transformation.</span>}
      onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
    >
      <World {...props} />
    </Canvas>
  );
}
