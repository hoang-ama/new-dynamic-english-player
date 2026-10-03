import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { enrichLesson } from "../lib/ai-enrichment.mjs";

const SOURCE_DIR = path.resolve("data/source-lessons");
const OUT_DIR = path.resolve("data/ai-enrichment");
const CHECKPOINT_IDS = [1, 113, 340];

function parseIds(args) {
  if (args.includes("--all")) return Array.from({ length: 340 }, (_, index) => index + 1);
  const idsArg = args.find(arg => arg.startsWith("--ids="));
  if (!idsArg) return CHECKPOINT_IDS;

  const values = idsArg.slice("--ids=".length).split(",");
  const ids = values.map(value => Number(value.trim()));
  if (ids.some(id => !Number.isInteger(id) || id < 1 || id > 340)) {
    throw new Error("--ids must be comma-separated integers from 1 to 340");
  }
  return [...new Set(ids)];
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set. Configure it in the server environment; do not put it in source files.");
  process.exit(1);
}

const args = process.argv.slice(2);
const ids = parseIds(args);
const force = args.includes("--force");
await mkdir(OUT_DIR, { recursive: true });

let failures = 0;
for (const id of ids) {
  const outputPath = path.join(OUT_DIR, `${id}.json`);
  if (!force) {
    try {
      await readFile(outputPath, "utf8");
      console.log(`SKIPPED ${id}: output already exists (use --force to replace)`);
      continue;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  try {
    const sourceLesson = JSON.parse(await readFile(path.join(SOURCE_DIR, `${id}.json`), "utf8"));
    const result = await enrichLesson(sourceLesson, {
      apiKey,
      onRetry: ({ attempt, nextAttempt, status, delay }) => {
        console.warn(`RETRY ${id}: Gemini HTTP ${status}; attempt ${nextAttempt}/3 in ${delay}ms (after attempt ${attempt})`);
      }
    });
    await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    console.log(`AI-GENERATED ${id}: ${result.keyPatterns.length} patterns, ${result.vocabulary.length} vocabulary items; semantic review pending`);
  } catch (error) {
    failures += 1;
    console.error(`FAILED ${id}: ${error.message}`);
  }
}

console.log(`\nProcessed ${ids.length} requested lessons; ${failures} failed. Candidate outputs: ${OUT_DIR}`);
if (failures) process.exitCode = 1;