import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Edges, Line } from "@react-three/drei";
import * as THREE from "three";
import { RagFocus } from "./RagFocus";
import { RagNeuralEntity } from "./RagNeuralEntity";
import { RagKnowledgeGlobe } from "./RagKnowledgeGlobe";
import { cameraPose, sceneRegion } from "@/lib/rag-camera";
import type { Line2 } from "three-stdlib";
import type { EvidenceRecord } from "@/content/apollo";
import { buildKnowledgeIndex } from "@/lib/knowledge-index";
import { atOutput, stageInput, stageOutput, type WalkthroughState } from "@/lib/rag-walkthrough";
import {
  scenePlan,
  flowRoute,
  flowStyle,
  nodeEmphasis,
  REQUEST_CONNECTIONS,
  transferProgress,
  sceneProgressRange,
  travelPoint,
  type Point3,
  type SceneNode,
} from "@/lib/rag-scene";

export interface RagWorldProps {
  tour: WalkthroughState;
  record: EvidenceRecord;
  records: EvidenceRecord[];
  reduced: boolean;
  paused: boolean;
  visible: boolean;
  duration: number;
  replay: number;
  scrollProgress?: number;
  flowLabel?: React.RefObject<HTMLDivElement | null>;
  overview?: boolean;
  labels?: React.RefObject<Map<SceneNode, HTMLDivElement>>;
}
const CYAN = "#64fff1";
const VIOLET = "#bc83ff";
/** A per-entity GPU dimmer: geometry remains in place while unrelated objects recede. */
function EntityFocus({
  strength,
  instant,
  children,
  ...transform
}: {
  strength: number;
  instant: boolean;
  children: ReactNode;
  position: Point3;
  rotation?: Point3;
  scale?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const light = useRef({ value: strength });
  const patched = useRef(new Map<THREE.Material, () => void>());
  useLayoutEffect(() => {
    if (instant) light.current.value = strength;
    group.current?.traverse((object) => {
      const source = (object as THREE.Mesh).material;
      if (!source) return;
      (Array.isArray(source) ? source : [source]).forEach((material) => {
        if (patched.current.has(material)) return;
        const compile = material.onBeforeCompile;
        const cacheKey = material.customProgramCacheKey;
        material.onBeforeCompile = function (shader, renderer) {
          compile.call(this, shader, renderer);
          shader.uniforms["uSceneLight"] = light.current;
          shader.fragmentShader =
            "uniform float uSceneLight;\n" +
            shader.fragmentShader.replace(/}\s*$/, "gl_FragColor.rgb *= uSceneLight;\n}");
        };
        material.customProgramCacheKey = function () {
          return cacheKey.call(this) + ":entity-focus";
        };
        material.needsUpdate = true;
        patched.current.set(material, () => {
          material.onBeforeCompile = compile;
          material.customProgramCacheKey = cacheKey;
        });
      });
    });
  });
  useEffect(() => {
    const materials = patched.current;
    return () => {
      materials.forEach((restore) => restore());
      materials.clear();
    };
  }, []);
  useFrame((_, delta) => {
    light.current.value = instant
      ? strength
      : THREE.MathUtils.lerp(light.current.value, strength, 1 - Math.exp(-delta * 5));
  });
  return (
    <group ref={group} {...transform}>
      {children}
    </group>
  );
}

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
        opacity={opacity * 0.35}
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
                  emissiveIntensity={0.2}
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

function Portal({ color = CYAN, shield = false }: { color?: string; shield?: boolean }) {
  return (
    <group>
      <Glow color={color} scale={2.2} opacity={0.4} />
      <mesh rotation={[0, 0.2, shield ? Math.PI / 6 : 0]}>
        <torusGeometry args={[0.46, 0.055, 8, shield ? 6 : 64]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.22}
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

/** A person and a question/answer sheet share the same endpoint of the request loop. */
function UserTerminal({ released }: { released: boolean }) {
  const color = released ? "#a5ffcb" : CYAN;
  return (
    <group>
      <mesh position={[0, 0.24, 0]}>
        <sphereGeometry args={[0.18, 18, 12]} />
        <meshStandardMaterial color="#13384b" emissive={color} emissiveIntensity={0.12} />
        <Edges color={color} />
      </mesh>
      <Line
        points={[
          [-0.36, -0.5, 0],
          [-0.29, -0.13, 0],
          [0, -0.02, 0],
          [0.29, -0.13, 0],
          [0.36, -0.5, 0],
        ]}
        color={color}
        lineWidth={2}
      />
      <group position={[0.6, -0.15, 0.1]} scale={0.7}>
        <Paper small color={color} />
      </group>
      {released && <Glow color={color} scale={2} opacity={0.3} />}
    </group>
  );
}

function CacheStore({ active, enabled }: { active: boolean; enabled: boolean }) {
  const color = enabled ? "#ffc875" : "#9a8b6f";
  return (
    <group>
      {[-0.23, 0, 0.23].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.13, 32]} />
          <meshStandardMaterial
            color="#2b2530"
            metalness={0.7}
            roughness={0.3}
            emissive={color}
            emissiveIntensity={active ? 0.5 : 0.08}
          />
          <Edges color={color} />
        </mesh>
      ))}
      {active && <Glow color="#ffc875" opacity={0.3} />}
    </group>
  );
}

/** A keypad-shaped tool dock; the executable fixture remains a bounded passage lookup. */
function ToolConsole({ active }: { active: boolean }) {
  const color = active ? "#b7ffdf" : "#83a7b9";
  return (
    <group rotation={[0.08, -0.18, -0.08]}>
      <mesh>
        <boxGeometry args={[0.7, 0.9, 0.15]} />
        <meshStandardMaterial color="#102b38" metalness={0.7} roughness={0.3} />
        <Edges color={color} />
      </mesh>
      <mesh position={[0, 0.25, 0.085]}>
        <boxGeometry args={[0.49, 0.18, 0.025]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.85 : 0.35} />
      </mesh>
      {Array.from({ length: 9 }, (_, n) => (
        <mesh key={n} position={[((n % 3) - 1) * 0.17, -0.01 - Math.floor(n / 3) * 0.16, 0.09]}>
          <boxGeometry args={[0.1, 0.08, 0.035]} />
          <meshBasicMaterial color={color} transparent opacity={active ? 0.8 : 0.35} />
        </mesh>
      ))}
      {active && <Glow color="#a5ffcb" scale={2} opacity={0.25} />}
    </group>
  );
}

function Connection({
  from,
  to,
  active,
  moving,
  emphasis,
  time,
  color = CYAN,
  via = [],
}: {
  from: Point3;
  to: Point3;
  via?: Point3[];
  active: boolean;
  moving: boolean;
  emphasis: number;
  time: React.RefObject<number>;
  color?: string;
}) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      Array.from(
        { length: 25 },
        (_, i) => new THREE.Vector3(...travelPoint(from, to, i / 24, via)),
      ),
    );
    return {
      curve,
      tube: new THREE.TubeGeometry(curve, 72, 0.026, 6, false),
      points: curve.getSpacedPoints(80),
    };
  }, [from, to, via]);
  useEffect(() => () => geometry.tube.dispose(), [geometry]);
  const line = useRef<Line2>(null),
    arrow = useRef<THREE.Mesh>(null);
  const packets = useRef<THREE.Mesh[]>([]);
  const tangent = useMemo(() => new THREE.Vector3(), []);
  const axis = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const signal = useMemo(() => new THREE.Color(color).multiplyScalar(1.8), [color]);
  useFrame(() => {
    if (line.current && moving) line.current.material.dashOffset = -time.current * 0.5;
    if (arrow.current) {
      geometry.curve.getPointAt(0.91, arrow.current.position);
      geometry.curve.getTangentAt(0.91, tangent);
      arrow.current.quaternion.setFromUnitVectors(axis, tangent);
    }
    packets.current.forEach((mesh, i) => {
      mesh.visible = moving;
      const t = (time.current * 0.17 - i * 0.019 + 10) % 1;
      geometry.curve.getPointAt(t, mesh.position);
    });
  });
  return (
    <group>
      <mesh geometry={geometry.tube}>
        <meshBasicMaterial
          color={signal}
          transparent
          opacity={active ? 0.18 : 0}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
      {/* The complete route and its arrow stay crisp even when no data is moving. */}
      <Line
        points={geometry.points}
        color={color}
        lineWidth={active ? 2 : 1.3}
        transparent
        opacity={0.15 + emphasis * 0.75}
        toneMapped={false}
        depthWrite={false}
      />
      <Line
        ref={line}
        points={geometry.points}
        color={signal}
        lineWidth={2}
        dashed
        dashSize={0.16}
        gapSize={0.2}
        transparent
        opacity={active ? 0.8 : 0}
        toneMapped={false}
        depthWrite={false}
      />
      <mesh ref={arrow}>
        <coneGeometry args={[0.085, 0.26, 3]} />
        <meshBasicMaterial
          color={active ? signal : color}
          transparent
          opacity={0.2 + emphasis * 0.7}
          toneMapped={false}
        />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh
          key={i}
          ref={(mesh) => {
            if (mesh) packets.current[i] = mesh;
          }}
          visible={false}
        >
          <sphereGeometry args={[0.055 - i * 0.005, 10, 10]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={1 - i * 0.15}
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function Director({
  tour,
  reduced,
  paused,
  visible,
  overview,
  time,
}: {
  tour: WalkthroughState;
  reduced: boolean;
  paused: boolean;
  visible: boolean;
  overview: boolean;
  time: React.RefObject<number>;
}) {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3());
  const initialized = useRef(false);
  const pose = cameraPose(tour, overview);
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const region = sceneRegion(size.width, size.height);
    cam.setViewOffset(
      size.width,
      size.height,
      size.width / 2 - region.x,
      size.height / 2 - region.y,
      size.width,
      size.height,
    );
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  useFrame((_, delta) => {
    if (!visible) return;
    const region = sceneRegion(size.width, size.height);
    const halfFov = Math.tan(THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov / 2));
    const distance = Math.max(
      (pose.span[0] * size.height) / (2 * halfFov * region.width),
      (pose.span[1] * size.height) / (2 * halfFov * region.height),
    );
    const target = new THREE.Vector3(...pose.target);
    const position = target.clone().add(new THREE.Vector3(0.15, 0.35, distance));
    if (!reduced && !paused) {
      position.x += Math.sin(time.current * 0.13) * 0.22;
      position.y += Math.sin(time.current * 0.17) * 0.12;
    }
    if (reduced || paused || !initialized.current) {
      camera.position.copy(position);
      look.current.copy(target);
      initialized.current = true;
    } else {
      const k = 1 - Math.exp(-delta * 3);
      camera.position.lerp(position, k);
      look.current.lerp(target, k);
    }
    camera.lookAt(look.current);
    camera.updateMatrixWorld();
  }, -1);
  return null;
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
  const { from, to, via } = flowRoute(plan.positions, plan.transfer.from, plan.transfer.to);
  const split = plan.transfer.kind === "split";
  const encode = plan.transfer.kind === "encode";
  const vector = plan.transfer.kind === "vector";
  const count = split ? 10 : plan.transfer.kind === "evidence" ? 3 : 1;
  useFrame(() => {
    if (!group.current) return;
    const t = transferProgress(tour, progress.current);
    group.current.position.set(...travelPoint(from, to, t, via));
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
      <Glow
        color={flowStyle(plan.transfer.from, plan.transfer.to).color}
        scale={1.8}
        opacity={0.35}
      />
      <group ref={document} scale={1.18}>
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
  const {
    tour,
    records,
    record,
    reduced,
    paused,
    visible,
    duration,
    replay,
    overview = false,
  } = props;
  const plan = scenePlan(tour);
  const prep = tour.phase === "knowledge";
  const index = useMemo(() => buildKnowledgeIndex(records), [records]);
  const values = index.chunks.find((c) => c.id === record.id)?.vector ?? [];
  const [begin, end] = sceneProgressRange(tour);
  const time = useRef(0);
  const elapsed = useRef(0);
  const progress = useRef(reduced ? end : begin);
  const controlledProgress = useRef(props.scrollProgress);
  controlledProgress.current = props.scrollProgress;
  const { invalidate, size, camera } = useThree();
  const after = stageOutput(tour);
  useEffect(() => {
    elapsed.current = 0;
    progress.current = controlledProgress.current ?? (reduced || !plan.moving ? end : begin);
    invalidate();
  }, [
    tour.phase,
    tour.stage,
    tour.beat,
    record.id,
    replay,
    reduced,
    plan.moving,
    begin,
    end,
    invalidate,
  ]);
  useEffect(() => {
    if (props.scrollProgress !== undefined) {
      progress.current = props.scrollProgress;
      invalidate();
    }
  }, [props.scrollProgress, invalidate]);
  useEffect(() => {
    invalidate();
  }, [paused, visible, overview, invalidate]);
  useFrame((_, delta) => {
    if (!visible || paused || reduced) return;
    const dt = Math.min(delta, 0.08);
    time.current += dt;
    if (props.scrollProgress === undefined && plan.moving && progress.current < end) {
      elapsed.current += dt;
      progress.current = begin + (end - begin) * Math.min(1, elapsed.current / duration);
    }
    invalidate();
  }, -2);
  const projected = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (props.flowLabel?.current) {
      const { from, to, via } = flowRoute(plan.positions, plan.transfer.from, plan.transfer.to);
      const point = travelPoint(from, to, transferProgress(tour, progress.current), via);
      projected.set(point[0], point[1], point[2] + 0.1).project(camera);
      const element = props.flowLabel.current;
      const region = sceneRegion(size.width, size.height);
      const left = region.x - region.width / 2,
        right = region.x + region.width / 2;
      const top = region.y - region.height / 2,
        bottom = region.y + region.height / 2;
      const halfWidth = element.offsetWidth / 2 + 8,
        labelHeight = element.offsetHeight;
      const x = (projected.x * 0.5 + 0.5) * size.width;
      const y = (-projected.y * 0.5 + 0.5) * size.height;
      const above = y - 34 - labelHeight >= top || y + 34 + labelHeight > bottom;
      element.dataset["placement"] = above ? "above" : "below";
      element.style.left = `${THREE.MathUtils.clamp(x, left + halfWidth, right - halfWidth)}px`;
      element.style.top = `${above ? Math.max(top + labelHeight, Math.min(bottom - 20, y - 34)) : Math.max(top, Math.min(bottom - labelHeight, y + 34))}px`;
      element.style.opacity = !overview && projected.z < 1 ? "1" : "0";
    }
    props.labels?.current.forEach((element, node) => {
      const point = plan.positions[node];
      if (!point) return;
      const offset =
        node === "model"
          ? -2.35
          : node === "index"
            ? -1.95
            : node === "chunks"
              ? -1.02
              : node === "small"
                ? -1.1
                : node === "tool"
                  ? 0.95
                  : node === "cache"
                    ? -0.7
                    : -0.9;
      projected.set(point[0], point[1] + offset, point[2] + 0.2).project(camera);
      const region = sceneRegion(size.width, size.height);
      const x = (projected.x * 0.5 + 0.5) * size.width;
      const y = (-projected.y * 0.5 + 0.5) * size.height;
      const halfWidth = element.offsetWidth / 2 + 4;
      const inArea =
        x > region.x - region.width / 2 + halfWidth &&
        x < region.x + region.width / 2 - halfWidth &&
        y > region.y - region.height / 2 &&
        y < region.y + region.height / 2;
      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
      element.style.opacity = projected.z < 1 && inArea ? String(0.4 + emphasis(node) * 0.6) : "0";
    });
  });
  const active = (n: SceneNode) => plan.active === n;
  const emphasis = (n: SceneNode) => nodeEmphasis(plan, n, overview);
  const positions = plan.positions;
  const connection = (from: SceneNode, to: SceneNode) => {
    const focused = plan.transfer.from === from && plan.transfer.to === to;
    const nearby = from === plan.active || to === plan.active;
    return (
      <Connection
        key={`${from}-${to}`}
        {...flowRoute(positions, from, to)}
        color={flowStyle(from, to).color}
        emphasis={overview ? 0.65 : focused ? 1 : nearby ? 0.3 : 0.06}
        active={plan.moving && focused}
        moving={plan.moving && focused}
        time={time}
      />
    );
  };
  return (
    <>
      <color attach="background" args={["#040711"]} />
      <fog attach="fog" args={["#040711", 100, 400]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[-3, 5, 8]} intensity={1.3} color="#94c9ff" />
      <pointLight position={[3, 2, 4]} intensity={3} color="#9987bd" distance={12} />
      <pointLight position={[-4, 1, 3]} intensity={2.5} color={CYAN} distance={10} />
      <Director
        tour={tour}
        reduced={reduced}
        paused={paused}
        visible={visible}
        overview={overview}
        time={time}
      />
      <Stars time={time} />
      <group position={[-5, 3, -10]}>
        <Glow color="#244ddd" scale={40} opacity={0.24} />
      </group>
      <group position={[6, -2, -9]}>
        <Glow color="#7137a3" scale={35} opacity={0.22} />
      </group>
      {prep ? (
        <>
          {connection("source", "chunks")}
          {connection("chunks", "vectors")}
          {connection("vectors", "index")}
          <EntityFocus
            strength={emphasis("source")}
            instant={reduced || paused}
            position={positions.source!}
            rotation={[0.04, -0.22, -0.08]}
          >
            <group position={[0.13, -0.1, -0.18]}>
              <Paper opacity={0.45} />
            </group>
            <Paper />
            {active("source") && <Glow color={CYAN} scale={2.8} opacity={0.4} />}
          </EntityFocus>

          <EntityFocus
            strength={emphasis("chunks")}
            instant={reduced || paused}
            position={positions.chunks!}
          >
            {(tour.stage > 1 || (tour.stage === 1 && atOutput(tour))) &&
              index.chunks.map((c, i) => (
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
            {tour.stage < 1 && <Paper small opacity={0.3} />}
            {active("chunks") && <Glow color={CYAN} scale={3} opacity={0.35} />}
          </EntityFocus>
          <EntityFocus
            strength={emphasis("vectors")}
            instant={reduced || paused}
            position={positions.vectors!}
          >
            {(tour.stage > 2 || (tour.stage === 2 && atOutput(tour))) && (
              <VectorBars values={values} />
            )}
            <Line
              points={[
                [-0.6, -0.45, 0.1],
                [0.6, -0.45, 0.1],
              ]}
              color="#385e7d"
              lineWidth={1}
            />
            {active("vectors") && <Glow color={CYAN} scale={2.5} opacity={0.5} />}
          </EntityFocus>

          <EntityFocus
            strength={emphasis("index")}
            instant={reduced || paused}
            position={positions.index!}
          >
            <RagKnowledgeGlobe
              chunks={index.chunks}
              selected={record.id}
              active={active("index")}
              ready={!prep || (tour.stage === 3 && atOutput(tour))}
              time={time}
            />
          </EntityFocus>
        </>
      ) : (
        <>
          {REQUEST_CONNECTIONS.map(([from, to]) => connection(from, to))}
          <EntityFocus
            strength={emphasis("index")}
            instant={reduced || paused}
            position={positions.index!}
          >
            <RagKnowledgeGlobe
              chunks={index.chunks}
              selected={record.id}
              active={tour.stage === 3 || active("index")}
              ready
              time={time}
            />
          </EntityFocus>
          <EntityFocus
            strength={emphasis("question")}
            instant={reduced || paused}
            position={positions.question!}
          >
            <UserTerminal
              released={tour.stage === 10 && atOutput(tour) && Boolean(after?.ctx.released)}
            />
            {active("question") && <Glow scale={2} opacity={0.3} color="#a5ffcb" />}
          </EntityFocus>
          <EntityFocus
            strength={emphasis("input")}
            instant={reduced || paused}
            position={positions.input!}
          >
            <Portal shield color={tour.stage === 1 && plan.blocked ? "#ff878d" : CYAN} />
          </EntityFocus>
          <EntityFocus
            strength={emphasis("small")}
            instant={reduced || paused}
            position={positions.small!}
            scale={0.48}
          >
            <RagNeuralEntity
              active={tour.stage === 7 && plan.generator === "small" && !plan.skipped}
              time={time}
            />
          </EntityFocus>
          <EntityFocus
            strength={emphasis("router")}
            instant={reduced || paused}
            position={positions.router!}
          >
            <mesh rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.28, 0.28, 0.28]} />
              <meshStandardMaterial
                color={VIOLET}
                emissive={VIOLET}
                emissiveIntensity={active("router") ? 0.6 : 0.1}
              />
              <Edges color="#e1bcff" />
            </mesh>
          </EntityFocus>
          <EntityFocus
            strength={emphasis("retrieve")}
            instant={reduced || paused}
            position={positions.retrieve!}
          >
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
          </EntityFocus>
          <EntityFocus
            strength={emphasis("context")}
            instant={reduced || paused}
            position={positions.context!}
          >
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
          </EntityFocus>
          <EntityFocus
            strength={emphasis("cache")}
            instant={reduced || paused}
            position={positions.cache!}
          >
            <CacheStore active={active("cache")} enabled={stageInput(tour).config.answerCache} />
          </EntityFocus>
          <EntityFocus
            strength={emphasis("tool")}
            instant={reduced || paused}
            position={positions.tool!}
            scale={0.9}
          >
            <ToolConsole active={tour.stage === 5 && stageInput(tour).config.tool !== "off"} />
          </EntityFocus>
          <EntityFocus
            strength={emphasis("check")}
            instant={reduced || paused}
            position={positions.check!}
          >
            <Portal color={plan.blocked && tour.stage >= 8 ? "#ff878d" : "#aaffce"} shield />
          </EntityFocus>
        </>
      )}
      <EntityFocus
        strength={emphasis("model")}
        instant={reduced || paused}
        position={positions.model!}
        scale={1.12}
      >
        <RagNeuralEntity
          active={!prep && tour.stage === 7 && plan.generator === "model" && !plan.skipped}
          time={time}
        />
      </EntityFocus>

      <TravellingData tour={tour} values={values} progress={progress} />
      <RagFocus active={plan.moving} reduced={reduced} />
    </>
  );
}

function Stars({ time }: { time: React.RefObject<number> }) {
  const group = useRef<THREE.Points>(null);
  const points = useMemo(
    () =>
      new Float32Array(
        Array.from({ length: 4500 }, (_, n) => {
          const i = Math.floor(n / 3);
          return n % 3 === 0
            ? Math.sin(i * 43.7) * 35
            : n % 3 === 1
              ? Math.cos(i * 19.3) * 21
              : -5 - (i % 30);
        }),
      ),
    [],
  );
  useFrame(() => {
    if (group.current) {
      group.current.rotation.y = Math.sin(time.current * 0.025) * 0.035;
      group.current.rotation.z = Math.sin(time.current * 0.017) * 0.018;
    }
  });
  return (
    <points ref={group}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#91b7f0"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export default function RagWorld(props: RagWorldProps) {
  return (
    <Canvas
      camera={{ position: [0, 2, 17], fov: 42, near: 0.1, far: 150 }}
      dpr={[1, 1.75]}
      frameloop="demand"
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      aria-hidden
      onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
    >
      <World {...props} />
    </Canvas>
  );
}
