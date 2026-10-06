import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyEnrichmentToManifest, markEnrichmentFailures, readEnrichmentCandidates, readEnrichmentFailures } from "../lib/lesson-enrichment-merge.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "data", "lessons.json");
const enrichmentDirectory = path.join(root, "data", "ai-enrichment");
const dryRun = process.argv.includes("--dry-run");

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const candidates = await readEnrichmentCandidates(enrichmentDirectory);
const { manifest: mergedManifest, applied } = applyEnrichmentToManifest(manifest, candidates);
const failures = await readEnrichmentFailures(enrichmentDirectory);
const { manifest: finalManifest, marked } = markEnrichmentFailures(mergedManifest, failures);

if (!dryRun) {
  await writeFile(manifestPath, `${JSON.stringify(finalManifest, null, 2)}\n`, "utf8");
}

console.log(`${dryRun ? "Would apply" : "Applied"} ${applied} AI enrichment record${applied === 1 ? "" : "s"} to ${manifestPath}`);
console.log(`${dryRun ? "Would mark" : "Marked"} ${marked} lesson${marked === 1 ? "" : "s"} as aiStatus "failed"`);
