import { useEffect, useMemo, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector2, Vector3 } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { scenePlan, travelPoint } from "@/lib/rag-scene";
import type { WalkthroughState } from "@/lib/rag-walkthrough";

// A bounded focus pull and a soft halo on bright edges. The HTML reader stays sharp.
const focusShader = {
  uniforms: {
    tDiffuse: { value: null },
    focus: { value: new Vector2(0.5, 0.5) },
    texel: { value: new Vector2() },
    strength: { value: 1 },
  },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 focus; uniform vec2 texel; uniform float strength; varying vec2 vUv;
    void main() {
      float blur = smoothstep(.12, .65, distance(vUv, focus)) * strength;
      vec2 d = texel * (1.0 + blur * 2.0);
      vec4 original = texture2D(tDiffuse, vUv);
      vec4 soft = original * .4;
      soft += (texture2D(tDiffuse, vUv + vec2(d.x, 0.0)) + texture2D(tDiffuse, vUv - vec2(d.x, 0.0)) + texture2D(tDiffuse, vUv + vec2(0.0, d.y)) + texture2D(tDiffuse, vUv - vec2(0.0, d.y))) * .1;
      soft += (texture2D(tDiffuse, vUv + d) + texture2D(tDiffuse, vUv - d) + texture2D(tDiffuse, vUv + vec2(d.x, -d.y)) + texture2D(tDiffuse, vUv + vec2(-d.x, d.y))) * .05;
      vec3 halo = max(soft.rgb - vec3(.22), vec3(0.0)) * .35;
      gl_FragColor = vec4(mix(original.rgb, soft.rgb, blur * .65) + halo, original.a);
    }`,
};

export function RagFocus({
  tour,
  progress,
  reduced,
}: {
  tour: WalkthroughState;
  progress: RefObject<number>;
  reduced: boolean;
}) {
  const { gl, scene, camera, size, invalidate } = useThree();
  const effect = useMemo(() => {
    const composer = new EffectComposer(gl);
    const render = new RenderPass(scene, camera);
    const focus = new ShaderPass(focusShader);
    const output = new OutputPass();
    composer.addPass(render);
    composer.addPass(focus);
    composer.addPass(output);
    return {
      composer,
      focus,
      render,
      output,
      target: new Vector3(),
      screen: new Vector2(0.5, 0.5),
    };
  }, [gl, scene, camera]);
  useEffect(() => {
    effect.composer.setPixelRatio(gl.getPixelRatio());
    effect.composer.setSize(size.width, size.height);
    (effect.focus.uniforms["texel"]!.value as Vector2).set(
      1 / (size.width * gl.getPixelRatio()),
      1 / (size.height * gl.getPixelRatio()),
    );
    invalidate();
  }, [effect, gl, size.width, size.height, invalidate]);
  useEffect(
    () => () => {
      effect.composer.dispose();
      effect.focus.dispose();
      effect.render.dispose();
      effect.output.dispose();
    },
    [effect],
  );
  const plan = scenePlan(tour);
  useFrame((_, delta) => {
    const position = plan.moving
      ? travelPoint(
          plan.positions[plan.transfer.from]!,
          plan.positions[plan.transfer.to]!,
          progress.current,
        )
      : plan.positions[plan.active]!;
    effect.target.set(...position).project(camera);
    effect.screen.set(effect.target.x * 0.5 + 0.5, effect.target.y * 0.5 + 0.5);
    (effect.focus.uniforms["focus"]!.value as Vector2).lerp(effect.screen, reduced ? 1 : 0.12);
    effect.focus.uniforms["strength"]!.value = reduced ? 0 : plan.moving ? 0.85 : 0.25;
    effect.composer.render(delta);
  }, 1);
  return null;
}
