import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyEnrichmentToManifest, readEnrichmentCandidates } from "../lib/lesson-enrichment-merge.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "data", "lessons.json");
const enrichmentDirectory = path.join(root, "data", "ai-enrichment");
const dryRun = process.argv.includes("--dry-run");

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const candidates = await readEnrichmentCandidates(enrichmentDirectory);
const { manifest: mergedManifest, applied } = applyEnrichmentToManifest(manifest, candidates);

if (!dryRun) {
  await writeFile(manifestPath, `${JSON.stringify(mergedManifest, null, 2)}\n`, "utf8");
}

console.log(`${dryRun ? "Would apply" : "Applied"} ${applied} AI enrichment record${applied === 1 ? "" : "s"} to ${manifestPath}`);
