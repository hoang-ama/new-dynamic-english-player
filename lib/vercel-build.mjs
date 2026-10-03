import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const FRONTEND_MODULES = ["lessons.js", "player.js", "progress-store.js"];

export async function stageLessonManifest({ sourcePath, sourceModulesDirectory, publicDirectory }) {
  const manifest = JSON.parse(await readFile(sourcePath, "utf8"));
  const lessons = manifest?.lessons;

  if (!Array.isArray(lessons) || lessons.length !== 340) {
    throw new Error("Vercel build requires the canonical 340-lesson manifest");
  }

  const ids = new Set(lessons.map(lesson => lesson?.id));
  if (ids.size !== 340 || Array.from({ length: 340 }, (_, index) => index + 1).some(id => !ids.has(id))) {
    throw new Error("Vercel build requires each lesson ID from 1 to 340 exactly once");
  }

  const outputDirectory = path.join(publicDirectory, "data");
  const manifestPath = path.join(outputDirectory, "lessons.json");
  await mkdir(outputDirectory, { recursive: true });
  await copyFile(sourcePath, manifestPath);

  const moduleDirectory = path.join(publicDirectory, "src");
  await mkdir(moduleDirectory, { recursive: true });
  const modulePaths = [];
  for (const filename of FRONTEND_MODULES) {
    const sourceModulePath = path.join(sourceModulesDirectory, filename);
    const outputModulePath = path.join(moduleDirectory, filename);
    await copyFile(sourceModulePath, outputModulePath);
    modulePaths.push(outputModulePath);
  }

  return { manifestPath, modulePaths };
}