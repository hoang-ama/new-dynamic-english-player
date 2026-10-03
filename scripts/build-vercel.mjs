import path from "node:path";
import { fileURLToPath } from "node:url";
import { stageLessonManifest } from "../lib/vercel-build.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { manifestPath, modulePaths } = await stageLessonManifest({
  sourcePath: path.join(root, "data", "lessons.json"),
  sourceModulesDirectory: path.join(root, "src"),
  publicDirectory: path.join(root, "public")
});

console.log(`Staged canonical lesson manifest for Vercel at ${manifestPath}`);
console.log(`Staged ${modulePaths.length} browser modules for Vercel.`);