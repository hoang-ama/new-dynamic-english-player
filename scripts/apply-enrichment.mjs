import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  applyEnrichmentToManifest,
  markEnrichmentFailures,
  readEnrichmentCandidates,
  readEnrichmentFailures,
} from "../lib/lesson-enrichment-merge.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "data", "lessons.json");
const enrichmentDirectory = path.join(root, "data", "ai-enrichment");
const dryRun = process.argv.includes("--dry-run");

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const candidates = await readEnrichmentCandidates(enrichmentDirectory);

/**
 * Production safety gate:
 *
 * Only semantically reviewed and explicitly approved enrichment
 * may be merged into the canonical production manifest.
 *
 * Required:
 *   reviewStatus === "approved"
 *   validation.semanticReview === "passed"
 */
const pendingCandidates = candidates.filter((candidate) => {
  return (
    candidate.reviewStatus !== "approved" ||
    candidate.validation?.semanticReview !== "passed"
  );
});

if (pendingCandidates.length > 0) {
  const details = pendingCandidates
    .map((candidate) => {
      const reviewStatus = candidate.reviewStatus ?? "missing";
      const semanticReview =
        candidate.validation?.semanticReview ?? "missing";

      return `- Lesson ${candidate.id}: reviewStatus=${reviewStatus}, semanticReview=${semanticReview}`;
    })
    .join("\n");

  throw new Error(
    [
      "AI enrichment merge blocked by production safety gate.",
      "",
      "The following candidates are not semantically approved:",
      details,
      "",
      'Only candidates with reviewStatus="approved" AND validation.semanticReview="passed" can be applied.',
      "",
      "Review the candidates first, then run npm run apply-enrichment again.",
    ].join("\n"),
  );
}

const { manifest: mergedManifest, applied } =
  applyEnrichmentToManifest(manifest, candidates);

const failures = await readEnrichmentFailures(enrichmentDirectory);

const { manifest: finalManifest, marked } =
  markEnrichmentFailures(mergedManifest, failures);

if (!dryRun) {
  await writeFile(
    manifestPath,
    `${JSON.stringify(finalManifest, null, 2)}\n`,
    "utf8",
  );
}

console.log(
  `${dryRun ? "Would apply" : "Applied"} ${applied} AI enrichment record${applied === 1 ? "" : "s"
  } to ${manifestPath}`,
);

console.log(
  `${dryRun ? "Would mark" : "Marked"} ${marked} lesson${marked === 1 ? "" : "s"
  } as aiStatus "failed"`,
);