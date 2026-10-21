import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector2 } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

/** Only HDR transfer strokes receive a restrained halo. The full route map stays sharp. */
export function RagFocus({ active, reduced }: { active: boolean; reduced: boolean }) {
  const { gl, scene, camera, size, viewport, invalidate } = useThree();
  const effect = useMemo(() => {
    const composer = new EffectComposer(gl);
    const render = new RenderPass(scene, camera);
    const bloom = new UnrealBloomPass(new Vector2(800, 600), 0.22, 0.25, 1.05);
    const output = new OutputPass();
    composer.addPass(render);
    composer.addPass(bloom);
    composer.addPass(output);
    return { composer, bloom, render, output };
  }, [gl, scene, camera]);
  useEffect(() => {
    effect.composer.setPixelRatio(viewport.dpr);
    effect.composer.setSize(size.width, size.height);
    invalidate();
  }, [effect, viewport.dpr, size.width, size.height, invalidate]);
  useEffect(
    () => () => {
      effect.composer.dispose();
      effect.bloom.dispose();
      effect.render.dispose();
      effect.output.dispose();
    },
    [effect],
  );
  useFrame((_, delta) => {
    effect.bloom.enabled = active && !reduced;
    if (effect.bloom.enabled) effect.composer.render(delta);
    else gl.render(scene, camera);
  }, 1);
  return null;
}
