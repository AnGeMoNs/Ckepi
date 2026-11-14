import { build } from "esbuild";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const output = await mkdtemp(join(process.cwd(), ".ckepi-tests-"));
try {
  const files = (await readdir("tests")).filter((name) => /\.test\.tsx?$/.test(name));
  const entries = files.map((name) => join("tests", name));
  await build({ entryPoints: entries, bundle: true, platform: "node", format: "esm", packages: "external",
    outdir: output, outExtension: { ".js": ".mjs" },
    plugins: [{
      // DOM tests exercise page state; WebGL rendering belongs to the browser suite.
      name: "dom-map-stubs",
      setup(context) {
        context.onResolve({ filter: /components\/map\/(AnalogMap|PlanetaryMap)$/ },
          (args) => ({ path: args.path, namespace: "test-map" }));
        context.onLoad({ filter: /.*/, namespace: "test-map" }, () => ({
          contents: "export const AnalogMap = () => null; export const PlanetaryMap = () => null;",
        }));
      },
    }],
  });
  const result = spawnSync(process.execPath, ["--test", ...files.map((name) =>
    join(output, name.replace(/\.tsx?$/, ".mjs")))], { stdio: "inherit" });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  await rm(output, { recursive: true, force: true });
}
