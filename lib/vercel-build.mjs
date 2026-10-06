import { copyFile, mkdir, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const FRONTEND_MODULES = ["lessons.js", "player.js", "progress-store.js"];
const SOURCE_BASE_URL = "https://lopngoaingu.com/Dynamic_English_Study/index.php";

export async function validateTranscriptCache(directory) {
  let names;
  try {
    names = await readdir(directory);
  } catch (error) {
    if (error.code === "ENOENT") {
      // The live source rejects Vercel's runtime fetches, so deploying without the cache breaks every transcript.
      throw new Error(`Vercel deployment requires the transcript cache at ${directory}; run \`npm run extract -- --all\``);
    }
    throw error;
  }
  const files = names.filter(name => /^\d+\.json$/.test(name));
  if (files.length !== 340) {
    throw new Error(`Vercel deployment requires 340 cached transcript records; found ${files.length}`);
  }

  for (let id = 1; id <= 340; id += 1) {
    const filename = `${id}.json`;
    if (!files.includes(filename)) throw new Error(`Cached transcript ${id} is missing`);
    const record = JSON.parse(await readFile(path.join(directory, filename), "utf8"));
    if (record.id !== id || record.sourceUrl !== `${SOURCE_BASE_URL}?id=${id}` || record.status !== "fetched" ||
        typeof record.content !== "string" || !record.content.trim() || !Array.isArray(record.sections)) {
      throw new Error(`Cached transcript ${id} is invalid`);
    }
  }

  return files.length;
}

export async function stageLessonManifest({ sourcePath, sourceModulesDirectory, sourceLessonsDirectory, publicDirectory }) {
  const manifest = JSON.parse(await readFile(sourcePath, "utf8"));
  const lessons = manifest?.lessons;

  if (!Array.isArray(lessons) || lessons.length !== 340) {
    throw new Error("Vercel build requires the canonical 340-lesson manifest");
  }

  const ids = new Set(lessons.map(lesson => lesson?.id));
  if (ids.size !== 340 || Array.from({ length: 340 }, (_, index) => index + 1).some(id => !ids.has(id))) {
    throw new Error("Vercel build requires each lesson ID from 1 to 340 exactly once");
  }
  const transcriptCacheCount = sourceLessonsDirectory
    ? await validateTranscriptCache(sourceLessonsDirectory)
    : 0;

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

  return { manifestPath, modulePaths, transcriptCacheCount };
}
