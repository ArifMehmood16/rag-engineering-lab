// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  plugins: [
    {
      name: "three-scene-source-compatibility",
      configResolved(config) {
        // TanStack's DOM source tags are invalid properties on Three.js objects.
        // Keep editor inspection everywhere else, including the scene's HTML shell.
        const transform = config.plugins.find(
          (plugin) => plugin.name === "@tanstack/devtools:inject-source",
        )?.transform;
        if (transform && typeof transform === "object") {
          const original = transform.handler;
          transform.handler = function (code, id, ...args) {
            if (
              /\/Rag(?:World|TheatreWorld|NeuralEntity|KnowledgeGlobe)\.tsx$/.test(
                id.split("?")[0] ?? "",
              )
            )
              return null;
            return original.call(this, code, id, ...args);
          };
        }
      },
    },
  ],
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
