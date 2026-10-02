// Remotion config. Path A mounts the app's REAL components from APP.
// Each setting below fixed a real failure; see references/pipeline.md §2 in the skill.
//  - @app alias into the app's source
//  - one React / react-dom (react-dom goes through the inline-portal shim)
//  - shared libraries resolve from the app's node_modules (same instances)
//  - ESM apps with extensionless imports (fullySpecified: false)
//  - Vite-style `?raw` imports
//  - stubs for the API client and anything heavy or real-time the film never renders
import path from "node:path";
import fs from "node:fs";
import { Config } from "@remotion/cli/config";
import { webpack } from "@remotion/bundler";
// Tailwind v4 apps: keep this. Tailwind v3: use @remotion/tailwind's enableTailwind instead.
// No Tailwind: remove it and return `current` below.
import { enableTailwind } from "@remotion/tailwind-v4";

const ROOT = process.cwd();
const APP = path.resolve(ROOT, "../stc.com"); // the product's frontend (path A); ignored if missing
const HAS_APP = fs.existsSync(path.join(APP, "package.json"));
const local = (m: string) => path.resolve(ROOT, "node_modules", m);

Config.setVideoImageFormat("png");
Config.setConcurrency(6);
Config.setChromiumOpenGlRenderer("angle");

// Modules to swap for inert stubs: [request regex, stub file]
const STUBS: [RegExp, string][] = [
  // [/[\\/]utils[\\/]api(\.js)?$/, "src/stubs/api.js"],      // the app's API client (import.meta.env…)
  // [/[\\/]ThreeScene(\.jsx)?$/, "src/stubs/empty.jsx"],       // 3D / real-time things the film never shows
  // [/^html2canvas(-pro)?$/, "src/stubs/html2canvas.js"],      // canvas exporters
];

Config.overrideWebpackConfig((current) => {
  const base = enableTailwind(current);
  const rules = (base.module?.rules ?? []).map((rule) => {
    // Remotion's asset rule would also grab `file.svg?raw`
    if (rule && typeof rule === "object" && rule.test instanceof RegExp && rule.test.test("x.svg")) {
      return { ...rule, resourceQuery: { not: [/raw/] } };
    }
    return rule;
  });
  return {
    ...base,
    resolve: {
      ...base.resolve,
      alias: {
        ...(base.resolve?.alias ?? {}),
        ...(HAS_APP ? { "@app": path.resolve(APP, "src") } : {}),
        "react-dom$": path.resolve(ROOT, "src/stubs/react-dom.js"),
        "react-dom/client": local("react-dom/client"),
      },
      modules: ["node_modules", ...(HAS_APP ? [path.resolve(APP, "node_modules")] : [])],
    },
    module: {
      ...base.module,
      rules: [
        ...rules,
        { resourceQuery: /raw/, type: "asset/source" },
        { test: /\.m?jsx?$/, resolve: { fullySpecified: false } },
      ],
    },
    plugins: [
      ...(base.plugins ?? []),
      ...STUBS.map(([re, file]) => new webpack.NormalModuleReplacementPlugin(re, path.resolve(ROOT, file))),
    ],
  };
});
