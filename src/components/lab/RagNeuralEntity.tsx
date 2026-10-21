import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";

const rimVertex = `varying vec3 vNormal; varying vec3 vView; void main(){vec4 p=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vView=normalize(-p.xyz);gl_Position=projectionMatrix*p;}`;
const rimFragment = `uniform vec3 tint; uniform float strength; varying vec3 vNormal; varying vec3 vView; void main(){float a=pow(1.-abs(dot(vNormal,vView)),2.8)*strength;gl_FragColor=vec4(tint*a,a);}`;
export function HoloRim({
  radius,
  color,
  strength = 0.5,
}: {
  radius: number;
  color: string;
  strength?: number;
}) {
  const uniforms = useMemo(
    () => ({ tint: { value: new THREE.Color(color) }, strength: { value: strength } }),
    [color, strength],
  );
  return (
    <mesh>
      <sphereGeometry args={[radius, 48, 32]} />
      <shaderMaterial
        vertexShader={rimVertex}
        fragmentShader={rimFragment}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

/** An open neural sculpture. Activity is a visual metaphor, never a trace of model reasoning. */
export function RagNeuralEntity({ active, time }: { active: boolean; time: RefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const nodeMaterial = useRef<THREE.ShaderMaterial>(null);
  const wireMaterial = useRef<THREE.ShaderMaterial>(null);
  const sparks = useRef<THREE.InstancedMesh>(null);
  const matrix = useMemo(() => new THREE.Object3D(), []);
  const graph = useMemo(() => {
    const nodes: THREE.Vector3[] = [];
    const tint: number[] = [];
    const seeds: number[] = [];
    for (let i = 0; i < 700; i++) {
      const y = 1 - (2 * (i + 0.5)) / 700;
      const a = i * Math.PI * (3 - Math.sqrt(5));
      const r = Math.sqrt(1 - y * y);
      const radius = 1.75 * (0.92 + 0.06 * Math.sin(i * 7.17));
      const p = new THREE.Vector3(Math.cos(a) * r * radius, y * radius, Math.sin(a) * r * radius);
      // The missing front sector reveals the inner network instead of closing a solid ball.
      if (p.z > 0.45 && p.x > 0.05 && p.y > -0.8) continue;
      nodes.push(p);
      seeds.push(i * 0.1337);
      const c = new THREE.Color(i % 9 === 0 ? "#b9a68b" : i % 3 === 0 ? "#a088c7" : "#6aa6bd");
      tint.push(c.r, c.g, c.b);
    }
    for (let i = 0; i < 100; i++) {
      const a = i * 2.39996,
        y = Math.sin(i * 37.1);
      const r = 0.35 + ((i % 13) / 13) * 0.9;
      nodes.push(new THREE.Vector3(Math.cos(a) * r, y * r, Math.sin(a) * r));
      seeds.push(i * 0.17);
      const c = new THREE.Color(i % 3 === 0 ? "#b9987e" : "#a184c0");
      tint.push(c.r, c.g, c.b);
    }
    const edges: [THREE.Vector3, THREE.Vector3][] = [];
    for (let i = 0; i < nodes.length; i++) {
      let count = 0;
      for (let j = i + 1; j < nodes.length && count < 3; j++) {
        const distance = nodes[i]!.distanceTo(nodes[j]!);
        if (distance < 0.43 && distance > 0.08) {
          edges.push([nodes[i]!, nodes[j]!]);
          count++;
        }
      }
    }
    return {
      positions: new Float32Array(nodes.flatMap((p) => p.toArray())),
      tint: new Float32Array(tint),
      seeds: new Float32Array(seeds),
      lines: new Float32Array(edges.flatMap((e) => e.flatMap((p) => p.toArray()))),
      edges,
    };
  }, []);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uActivity: { value: 0 } }), []);
  const wireUniforms = useMemo(() => ({ uTime: { value: 0 }, uActivity: { value: 0 } }), []);
  useFrame(() => {
    const t = time.current;
    if (group.current) {
      group.current.rotation.set(
        0.12 + Math.sin(t * 0.09) * 0.04,
        t * 0.045,
        -0.12 + Math.sin(t * 0.12) * 0.025,
      );
    }
    if (nodeMaterial.current) {
      nodeMaterial.current.uniforms["uTime"]!.value = t;
      nodeMaterial.current.uniforms["uActivity"]!.value = active ? 1 : 0.25;
    }
    if (wireMaterial.current) {
      wireMaterial.current.uniforms["uTime"]!.value = t;
      wireMaterial.current.uniforms["uActivity"]!.value = active ? 1 : 0.25;
    }
    if (sparks.current) {
      for (let i = 0; i < 24; i++) {
        const edge = graph.edges[(i * 43 + 17) % graph.edges.length]!;
        const p = (t * (active ? 0.45 : 0.12) + i * 0.731) % 1;
        matrix.position.copy(edge[0]).lerp(edge[1], p);
        matrix.scale.setScalar(0.6 + Math.sin(p * Math.PI) * 0.6);
        matrix.updateMatrix();
        sparks.current.setMatrixAt(i, matrix.matrix);
      }
      sparks.current.instanceMatrix.needsUpdate = true;
    }
  });
  return (
    <group ref={group}>
      <HoloRim radius={1.81} color="#77c8ff" strength={active ? 0.16 : 0.07} />
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[graph.positions, 3]} />
          <bufferAttribute attach="attributes-aTint" args={[graph.tint, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[graph.seeds, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={nodeMaterial}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.NormalBlending}
          toneMapped={false}
          vertexShader={`attribute vec3 aTint;attribute float aSeed;uniform float uTime;uniform float uActivity;varying vec3 vTint;varying float vFire;void main(){float wave=sin(uTime*(1.1+uActivity)+aSeed*7.-length(position)*3.);vFire=pow(max(0.,wave),12.);vTint=aTint;vec3 p=position*(1.+sin(uTime*.7+aSeed)*.009);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((2.4+vFire*(3.+uActivity*1.6))*(16./-mv.z),1.25,9.);}`}
          fragmentShader={`varying vec3 vTint;varying float vFire;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;float halo=pow(1.-d,2.);gl_FragColor=vec4(vTint*(1.+vFire*.85),halo*(.5+vFire*.35));}`}
        />
      </points>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[graph.lines, 3]} />
        </bufferGeometry>
        <shaderMaterial
          ref={wireMaterial}
          uniforms={wireUniforms}
          transparent
          depthWrite={false}
          blending={THREE.NormalBlending}
          toneMapped={false}
          vertexShader={`uniform float uTime;varying float vPulse;varying float vDepth;void main(){vPulse=pow(max(0.,sin(uTime*2.4-dot(position,vec3(2.,3.,1.7)))),10.);vec4 p=modelViewMatrix*vec4(position,1.);vDepth=position.z;gl_Position=projectionMatrix*p;}`}
          fragmentShader={`uniform float uActivity;varying float vPulse;varying float vDepth;void main(){vec3 c=mix(vec3(.22,.42,.59),vec3(.55,.45,.7),vPulse);float a=.14+vPulse*(.12+uActivity*.14);gl_FragColor=vec4(c*(1.+vPulse*.25),a);}`}
        />
      </lineSegments>
      <instancedMesh ref={sparks} args={[undefined, undefined, 24]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshBasicMaterial color="#b7a6d2" />
      </instancedMesh>
      {[0, 1, 2].map((i) => (
        <group key={i} rotation={[0.65 + i * 0.6, i * 0.9, 0.4 - i * 0.35]}>
          <Line
            points={Array.from({ length: 90 }, (_, n) => {
              const a = (n / 89) * Math.PI * (1.15 + i * 0.12);
              return [Math.cos(a) * (1.84 + i * 0.05), Math.sin(a) * (1.84 + i * 0.05), 0] as [
                number,
                number,
                number,
              ];
            })}
            color={i === 1 ? "#c6a0ff" : "#74dfff"}
            lineWidth={0.65}
            transparent
            opacity={0.18}
            toneMapped={false}
          />
        </group>
      ))}
    </group>
  );
}
