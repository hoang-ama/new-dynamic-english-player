import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { extractSourceLesson } from "../lib/source-content.mjs";

const BASE = "https://lopngoaingu.com/Dynamic_English_Study";
const OUT_DIR = path.resolve("data/source-lessons");
const CHECKPOINT_IDS = [1, 113, 340];
const FETCH_TIMEOUT_MS = 20_000;

async function fetchLesson(id) {
  const sourceUrl = `${BASE}/index.php?id=${id}`;
  const fetchedAt = new Date().toISOString();

  try {
    const response = await fetch(sourceUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
    return extractSourceLesson(await response.text(), id, sourceUrl, fetchedAt);
  } catch (error) {
    return {
      id,
      sourceUrl,
      title: "",
      content: "",
      sections: [],
      fetchedAt,
      status: "failed",
      error: String(error)
    };
  }
}

const ids = process.argv.includes("--all")
  ? Array.from({ length: 340 }, (_, index) => index + 1)
  : CHECKPOINT_IDS;

await mkdir(OUT_DIR, { recursive: true });

let failures = 0;
for (const id of ids) {
  const record = await fetchLesson(id);
  await writeFile(path.join(OUT_DIR, `${id}.json`), `${JSON.stringify(record, null, 2)}\n`, "utf8");
  if (record.status === "failed") failures += 1;
  console.log(`${record.status.toUpperCase()} ${id}: ${record.title || record.error} (${record.content.length} chars, ${record.sections.length} sections)`);
}

console.log(`\nWrote ${ids.length} source lesson records to ${OUT_DIR}; ${failures} failed.`);
if (failures) process.exitCode = 1;