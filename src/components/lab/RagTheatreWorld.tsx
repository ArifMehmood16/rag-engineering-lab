import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Edges, Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { RagNeuralEntity } from "./RagNeuralEntity";
import type { LearningTheatre } from "@/lib/rag-theatre";
import type { Point3 } from "@/lib/rag-scene";

const C = {
  input: "#86b7d2",
  prefix: "#d6b184",
  model: "#b49dce",
  evidence: "#83c7bb",
  pass: "#a0cbaa",
  fail: "#d99e97",
  idle: "#405569",
};

/** Dedicated teaching camera: uses the area above the result strip, beside the reader. */
function Camera({ reduced, paused }: { reduced: boolean; paused: boolean }) {
  const { camera, size } = useThree();
  const target = useMemo(() => new THREE.Vector3(0, 0.1, 0), []);
  useFrame((_, delta) => {
    const wide = size.width >= 1000;
    const reader = size.width <= 1100 ? 390 : size.width < 1200 ? 440 : 480;
    const left = wide ? 30 : 18,
      right = wide ? size.width - reader - 45 : size.width - 18;
    const top = wide ? 185 : 239,
      bottom = wide ? size.height - 165 : size.height * 0.48 - 8;
    const width = right - left,
      height = Math.max(100, bottom - top);
    const cam = camera as THREE.PerspectiveCamera;
    const halfFov = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const distance = Math.max(
      (12.2 * size.height) / (2 * halfFov * width),
      ((wide ? 6.6 : 5.7) * size.height) / (2 * halfFov * height),
    );
    cam.setViewOffset(
      size.width,
      size.height,
      size.width / 2 - (left + right) / 2,
      size.height / 2 - (top + bottom) / 2,
      size.width,
      size.height,
    );
    const goal = new THREE.Vector3(0.15, 0.55, distance);
    if (reduced || paused) cam.position.copy(goal);
    else cam.position.lerp(goal, 1 - Math.exp(-delta * 5));
    cam.lookAt(target);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
  }, -1);
  return null;
}

function Label({
  position,
  children,
  tone = "",
  compact,
}: {
  position: Point3;
  children: React.ReactNode;
  tone?: string;
  compact?: string;
}) {
  return (
    <Html
      center
      position={position}
      zIndexRange={[3, 1]}
      className={`theatre-object-label ${tone}`}
      style={{ pointerEvents: "none" }}
    >
      {compact ? (
        <>
          <span className="theatre-full-label">{children}</span>
          <span className="theatre-compact-label">{compact}</span>
        </>
      ) : (
        children
      )}
    </Html>
  );
}
function Tile({
  position,
  label,
  color = C.input,
  dim = false,
  width = 0.9,
}: {
  position: Point3;
  label?: string;
  color?: string;
  dim?: boolean;
  width?: number;
}) {
  return (
    <group position={position}>
      <mesh rotation={[0.04, -0.12, 0]}>
        <boxGeometry args={[width, 0.46, 0.19]} />
        <meshStandardMaterial
          color={dim ? "#0b1723" : "#183143"}
          metalness={0.55}
          roughness={0.35}
        />
        <Edges color={color} transparent opacity={dim ? 0.25 : 0.9} />
      </mesh>
      {label && (
        <Label
          position={[0, 0, 0.15]}
          tone={`${dim ? "muted" : ""} token ${["REUSED", "STATE", "POLICY", "SCHEMA", "EXAMPLES"].includes(label) ? "" : "mobile-keep"}`}
          compact={
            label === "ANSWER CACHE"
              ? "CACHE"
              : label === "NEW DATA"
                ? "INPUT"
                : label === "NEW DRAFT"
                  ? "DRAFT"
                  : label.includes("PASS")
                    ? "PASS"
                    : label === "TEST FAIL"
                      ? "FAIL"
                      : label
          }
        >
          {label}
        </Label>
      )}
    </group>
  );
}
function Route({
  points,
  time,
  color = C.input,
  active = true,
  offset = 0,
  packet = true,
  packetLabel,
  wire = true,
}: {
  points: Point3[];
  time: RefObject<number>;
  color?: string;
  active?: boolean;
  offset?: number;
  packet?: boolean;
  packetLabel?: string;
  wire?: boolean;
}) {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
    [points],
  );
  const path = useMemo(() => curve.getPoints(64), [curve]);
  const arrow = useMemo(
    () =>
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        curve.getTangent(0.88).normalize(),
      ),
    [curve],
  );
  const signal = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!signal.current) return;
    const phase = (time.current / 10 + offset) % 1;
    signal.current.position.copy(curve.getPoint(phase));
    // Hand off to the fixed source/result labels before moving IDs overlap them.
    signal.current.visible = !packetLabel || (phase > 0.19 && phase < 0.8);
  });
  return (
    <group>
      {wire && (
        <>
          <Line
            points={path}
            color={color}
            lineWidth={active ? 1.8 : 1}
            transparent
            opacity={active ? 0.7 : 0.2}
          />
          <mesh position={curve.getPoint(0.88)} quaternion={arrow}>
            <coneGeometry args={[0.075, 0.19, 6]} />
            <meshBasicMaterial color={color} transparent opacity={active ? 0.9 : 0.28} />
          </mesh>
        </>
      )}
      {active && packet && (
        <group ref={signal}>
          {packetLabel ? (
            <Tile position={[0, 0, 0.4]} label={packetLabel} width={0.65} color={color} />
          ) : (
            <mesh>
              <boxGeometry args={[0.18, 0.13, 0.13]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} />
              <Edges color="#d5e6ec" />
            </mesh>
          )}
        </group>
      )}
    </group>
  );
}
function PrefixFlight({ time, index }: { time: RefObject<number>; index: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!group.current) return;
    const t = (time.current / 12 + index * 0.12) % 1;
    const from = new THREE.Vector3(-4.2, 1.7 - index * 0.58, 0);
    const gate = new THREE.Vector3(-2.25, 1.45, 0.3);
    const to = new THREE.Vector3(-0.95 + index * 0.94, 1.6, 0);
    const p = t < 0.5 ? from.lerp(gate, t * 2) : gate.lerp(to, (t - 0.5) * 2);
    group.current.position.copy(p);
    group.current.visible = t < 0.93;
  });
  return (
    <group ref={group}>
      <Tile position={[0, 0, 0]} width={0.55} color={C.prefix} />
    </group>
  );
}
function PrefixStage({ scene, time }: { scene: LearningTheatre; time: RefObject<number> }) {
  const warm = scene.mode === "warm",
    answer = scene.mode === "answer";
  if (scene.mode === "compare")
    return (
      <group>
        {scene.lanes.map((lane, i) => {
          const y = 1.9 - i * 1.85;
          return (
            <group key={lane.mode}>
              <Label position={[-3.65, y + 0.65, 0]}>{lane.name}</Label>
              <Tile position={[-4.35, y, 0]} label="Q" />
              <Route
                points={[
                  [-3.8, y, 0],
                  [-2, y, 0.2],
                  [0, y, 0],
                  [3.65, y, 0],
                ]}
                time={time}
                color={lane.mode === "answer" ? C.pass : lane.mode === "warm" ? C.prefix : C.input}
              />
              {lane.mode !== "answer" ? (
                <>
                  <Tile
                    position={[-1.95, y, 0]}
                    label={lane.mode === "warm" ? "REUSE" : "PREFILL"}
                    color={C.prefix}
                    width={1.2}
                  />
                  <group position={[0.6, y, 0]} scale={0.32}>
                    <RagNeuralEntity active time={time} />
                  </group>
                  <Label position={[0.6, y - 0.67, 0]}>LLM</Label>
                </>
              ) : (
                <Tile position={[-0.6, y, 0]} label="ANSWER CACHE" color={C.pass} width={2.1} />
              )}
              <Tile
                position={[4.05, y, 0]}
                label={`${lane.calls} ${lane.calls === 1 ? "call" : "calls"}`}
                color={C.pass}
                width={1.15}
              />
              <Label position={[2.5, y + 0.6, 0]}>{lane.reused} prefix tokens reused</Label>
            </group>
          );
        })}
      </group>
    );
  return (
    <group>
      {/* A physical boundary distinguishes model-side prefix state from the application cache. */}
      <mesh position={[0, 0.1, -0.65]}>
        <boxGeometry args={[5.2, 4.8, 0.13]} />
        <meshStandardMaterial
          color="#0a1725"
          metalness={0.4}
          roughness={0.65}
          transparent
          opacity={0.45}
        />
        <Edges color={C.model} transparent opacity={0.45} />
      </mesh>
      <Label position={[0, 2.85, 0]} tone="heading" compact="Prefix state">
        Model-side prefix state · schematic
      </Label>
      {!answer &&
        ["POLICY", "SCHEMA", "EXAMPLES"].map((label, i) => (
          <Tile
            key={label}
            position={[-4.2, 1.7 - i * 0.58, 0]}
            label={label}
            color={C.prefix}
            dim={warm}
            width={1.18}
          />
        ))}
      {!answer && (
        <Label position={[-4.15, 2.45, 0]} tone="mobile-keep">
          Shared prefix
        </Label>
      )}
      <Tile
        position={[-2.25, 1.45, 0.25]}
        label={warm ? "SKIP" : "PREFILL"}
        color={C.prefix}
        width={1.1}
        dim={warm || answer}
      />
      <Route
        points={[
          [-3.5, 1.7, 0],
          [-2.5, 1.9, 0.3],
          [-1.8, 1.65, 0.3],
          [0, 1.6, 0],
        ]}
        active={!warm && !answer}
        packet={false}
        time={time}
        color={C.prefix}
      />
      {[0, 1, 2].map((i) => (
        <Tile
          key={i}
          position={[-0.95 + i * 0.94, 1.6, 0]}
          label={warm ? "REUSED" : "STATE"}
          color={C.prefix}
          dim={answer}
          width={0.83}
        />
      ))}
      {!warm && !answer && [0, 1, 2].map((i) => <PrefixFlight key={i} index={i} time={time} />)}
      <Label position={[0, 2.15, 0]}>
        {warm
          ? `${scene.prefixTokens} assumed tokens reused`
          : answer
            ? "Prefix state idle"
            : "Store processed prefix"}
      </Label>
      <group position={[0.1, -0.6, 0]} scale={0.72}>
        <RagNeuralEntity active={!answer} time={time} />
      </group>
      <Label position={[0.1, -2.2, 0]} tone="heading" compact={answer ? "LLM · idle" : "LLM"}>
        LLM {answer ? "· idle" : "· new generation"}
      </Label>
      <Tile position={[-4.15, -1.25, 0]} label="NEW DATA" width={1.35} dim={answer} />
      <Label position={[-4.15, -2, 0]}>Question + evidence</Label>
      <Route
        points={[
          [-3.4, -1.25, 0],
          [-2, -1.1, 0.35],
          [-1.2, -0.65, 0],
        ]}
        active={!answer}
        time={time}
      />
      <Route
        points={[
          [0.1, 1.25, 0],
          [0.35, 0.7, 0.4],
          [0.1, 0.2, 0],
        ]}
        active={!answer}
        time={time}
        color={C.prefix}
      />
      <Route
        points={[
          [1.35, -0.6, 0],
          [2.5, -0.6, 0.25],
          [3.8, -0.6, 0],
        ]}
        active={!answer}
        time={time}
        color={C.model}
      />
      <Tile
        position={[4.35, -0.6, 0]}
        label={answer ? "REUSE" : "NEW DRAFT"}
        color={C.pass}
        width={1.35}
      />
      <Label position={[4.25, -1.3, 0]} tone="heading desktop-detail">
        {scene.calls} new model {scene.calls === 1 ? "call" : "calls"}
      </Label>
      <Label position={[4.25, -1.85, 0]}>Checks still apply</Label>
      {answer && (
        <>
          <Tile position={[-4.1, 1.1, 0.4]} label="ANSWER CACHE" color={C.pass} width={1.8} />
          <Route
            points={[
              [-3.15, 1.1, 0.4],
              [-2.4, 2.5, 1],
              [2.9, 2.5, 1],
              [4.35, -0.25, 0],
            ]}
            time={time}
            color={C.pass}
          />
        </>
      )}
    </group>
  );
}

function Arrival({
  time,
  offset,
  position,
  color = C.pass,
}: {
  time: RefObject<number>;
  offset: number;
  position: Point3;
  color?: string;
}) {
  const lamp = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!lamp.current) return;
    const phase = (time.current / 10 + offset) % 1;
    const pulse = Math.max(0, 1 - Math.abs(phase - 0.94) / 0.09);
    lamp.current.scale.setScalar(0.8 + pulse * 0.65);
    (lamp.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + pulse * 0.65;
  });
  return (
    <mesh ref={lamp} position={position}>
      <sphereGeometry args={[0.09, 12, 12]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} />
    </mesh>
  );
}

function FactRack({
  found,
  required,
  position,
}: {
  found: number;
  required: number;
  position: Point3;
}) {
  return (
    <group position={position}>
      {Array.from({ length: required }, (_, i) => (
        <group key={i} position={[(i - 1) * 0.52, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.34, 0.85, 0.16]} />
            <meshStandardMaterial color={i < found ? "#184236" : "#241e26"} />
            <Edges
              color={i < found ? C.evidence : C.fail}
              transparent
              opacity={i < found ? 0.9 : 0.45}
            />
          </mesh>
          {i >= found && (
            <Line
              points={[
                [-0.13, -0.2, 0.1],
                [0.13, 0.2, 0.1],
              ]}
              color={C.fail}
              lineWidth={2}
            />
          )}
        </group>
      ))}
    </group>
  );
}
function EvaluationStage({ scene, time }: { scene: LearningTheatre; time: RefObject<number> }) {
  const batch = scene.mode === "batch",
    missing = scene.mode === "retrieval",
    judge = scene.mode === "judge";
  if (judge)
    return (
      <group>
        <Tile position={[-4.1, 1.25, 0]} label="CLAIM" color={C.fail} width={1.4} />
        <Label position={[-4.1, 2, 0]}>Collins walked on the Moon</Label>
        <Tile position={[-4.1, -1.2, 0]} label="SOURCE" color={C.evidence} width={1.4} />
        <Label position={[-4, -1.95, 0]}>Collins remained in orbit</Label>
        <Route
          points={[
            [-3.3, 1.25, 0],
            [-2, 1, 0.4],
            [-1, 0.4, 0],
          ]}
          time={time}
          color={C.fail}
        />
        <Route
          points={[
            [-3.3, -1.2, 0],
            [-2, -0.9, 0.4],
            [-1, -0.4, 0],
          ]}
          time={time}
          color={C.evidence}
          offset={0.5}
        />
        <group scale={0.65}>
          <RagNeuralEntity active time={time} />
        </group>
        <Label position={[0, 2, 0]} tone="heading" compact="Judge · simulated">
          Judge · simulated rubric
        </Label>
        <Label position={[0, -1.9, 0]}>Fixture verdict · no live model</Label>
        {scene.results.map((r, i) => (
          <group key={r.label}>
            <Route
              points={[
                [1.2, 0, 0],
                [2, 1.3 - i * 1.3, 0.3],
                [3.5, 1.3 - i * 1.3, 0],
              ]}
              time={time}
              color={r.value === "PASS" ? C.pass : C.fail}
              offset={i * 0.2}
            />
            <Tile
              position={[4, 1.3 - i * 1.3, 0]}
              label={r.value}
              color={r.value === "PASS" ? C.pass : C.fail}
              width={1.1}
            />
            <Label position={[4, 1.9 - i * 1.3, 0]}>{r.label}</Label>
          </group>
        ))}
      </group>
    );
  return (
    <group>
      <Label position={[-4.1, 2.5, 0]} tone="heading desktop-detail">
        {batch ? "Reviewed test set" : "Same test question · Q1"}
      </Label>
      {(batch ? scene.cases : scene.cases.slice(0, 1)).map((q, i) => {
        const y = batch ? 1.35 - i * 1.35 : 0;
        return (
          <group key={q.id}>
            <Tile position={[-4.2, y, 0]} label={q.id} width={0.9} />
            <Label position={[-4.2, y - 0.48, 0]}>{q.label}</Label>
            <Route
              points={[
                [-3.7, y, 0],
                [-2.8, y, 0.3],
                [-2, y * 0.5, 0],
              ]}
              time={time}
              packet={!batch}
              offset={i * 0.25}
            />
          </group>
        );
      })}
      <FactRack found={batch ? 3 : scene.factsFound} required={3} position={[-1.4, 0, 0]} />
      <Label position={[-1.4, 1.6, 0]} tone="heading">
        Retrieval
      </Label>
      <Label position={[-1.4, -1.1, 0]}>
        {missing
          ? `${scene.factsFound}/${scene.factsRequired} facts · gap`
          : batch
            ? "Check required facts"
            : "Evidence found"}
      </Label>
      <Route
        points={[
          [-0.5, 0.25, 0],
          [0.2, 0.4, 0.3],
          [0.6, 0.25, 0],
        ]}
        time={time}
        packet={!batch}
        active={!missing}
        color={C.evidence}
      />
      <group position={[1.4, 0.15, 0]} scale={0.55}>
        <RagNeuralEntity active={!missing} time={time} />
      </group>
      <Label position={[1.4, 1.6, 0]} tone="heading">
        LLM {missing ? "· idle" : "· fixture"}
      </Label>
      <Label position={[1.4, -1.25, 0]}>
        {missing ? "0 generation calls" : batch ? "Q1 + Q2 generate" : "One wrong claim"}
      </Label>
      {batch ? (
        scene.cases.map((q, i) => {
          const y = 1.35 - i * 1.35;
          return (
            <group key={q.id}>
              <Route
                points={
                  q.calls
                    ? [
                        [2.4, 0.15, 0],
                        [3, y, 0.35],
                        [3.8, y, 0],
                      ]
                    : [
                        [-1.4, -0.7, 0],
                        [-0.5, -2.25, 0.4],
                        [3, -2.25, 0.4],
                        [4, -1.6, 0],
                      ]
                }
                time={time}
                packet={false}
                color={q.calls ? C.model : C.evidence}
              />
              <Route
                points={
                  q.calls
                    ? [
                        [-4.2, y, 0],
                        [-2.8, y, 0.3],
                        [-1.4, y * 0.3, 0],
                        [1.4, 0.15, 0],
                        [3, y, 0.35],
                        [4.3, y, 0],
                      ]
                    : [
                        [-4.2, y, 0],
                        [-2.8, -0.8, 0],
                        [-1.4, -0.7, 0],
                        [-0.5, -2.25, 0.4],
                        [3, -2.25, 0.4],
                        [4.3, y, 0],
                      ]
                }
                time={time}
                wire={false}
                packetLabel={q.id}
                offset={i * 0.25}
                color={q.calls ? C.input : C.evidence}
              />
              <Tile position={[4.3, y, 0]} label={`${q.id} PASS`} color={C.pass} width={1.3} />
              <Arrival time={time} offset={i * 0.25} position={[5.1, y, 0]} />
              <Label position={[4.3, y - 0.48, 0]}>
                {q.calls ? "Supported answer" : "Expected evidence gap"}
              </Label>
            </group>
          );
        })
      ) : (
        <>
          <Route
            points={
              missing
                ? [
                    [-1.4, -0.65, 0],
                    [-0.5, -2.05, 0.4],
                    [3, -2.05, 0.4],
                    [4.3, -0.4, 0],
                  ]
                : [
                    [2.4, 0.15, 0],
                    [3, 0.5, 0.3],
                    [3.7, 0.15, 0],
                  ]
            }
            time={time}
            color={C.fail}
          />
          <Tile position={[4.3, 0.15, 0]} label="TEST FAIL" color={C.fail} width={1.6} />
          <Label position={[4.3, 1.5, 0]} tone="heading">
            Answer scoring
          </Label>
          <Label position={[4.3, -0.6, 0]}>
            {missing
              ? "Safe stop ≠ task success"
              : `${scene.supported}/${scene.claims} supported links`}
          </Label>
        </>
      )}
    </group>
  );
}

export function RagTheatreWorld({
  scene,
  reduced,
  paused,
  visible,
}: {
  scene: LearningTheatre;
  reduced: boolean;
  paused: boolean;
  visible: boolean;
}) {
  const time = useRef(0);
  const { invalidate } = useThree();
  useEffect(() => {
    time.current = reduced ? 6 : 0;
    invalidate();
  }, [scene.mode, reduced, invalidate]);
  useFrame((_, delta) => {
    if (!visible || reduced || paused) return;
    time.current += Math.min(delta, 0.08);
    invalidate();
  }, -2);
  const stars = useMemo(
    () =>
      new Float32Array(
        Array.from({ length: 1800 }, (_, n) =>
          n % 3 === 0
            ? Math.sin(n * 8.3) * 35
            : n % 3 === 1
              ? Math.cos(n * 4.7) * 22
              : -10 - (n % 25),
        ),
      ),
    [],
  );
  return (
    <>
      <color attach="background" args={["#040711"]} />
      <ambientLight intensity={1} />
      <directionalLight position={[-3, 5, 8]} intensity={1.3} color="#9fbede" />
      <Camera reduced={reduced} paused={paused} />
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.025} color="#92a8ce" transparent opacity={0.4} depthWrite={false} />
      </points>
      {scene.kind === "prefix" ? (
        <PrefixStage scene={scene} time={time} />
      ) : (
        <EvaluationStage scene={scene} time={time} />
      )}
    </>
  );
}
