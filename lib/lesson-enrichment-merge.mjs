import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function cleanPattern(item) {
  return {
    pattern: cleanText(item.pattern),
    meaning: cleanText(item.meaning)
  };
}

function cleanVocabulary(item) {
  return {
    word: cleanText(item.word),
    meaning: cleanText(item.meaning)
  };
}

/**
 * Validate an AI enrichment candidate before it can be merged
 * into the canonical production manifest.
 *
 * Production safety requirements:
 * - schema validation must pass
 * - evidence validation must pass
 * - semantic review must pass
 * - explicit human/agent approval must be present
 */
export function validateEnrichmentCandidate(candidate, lesson) {
  const errors = [];

  if (!isPlainObject(candidate)) {
    return ["candidate must be a JSON object"];
  }

  if (candidate.id !== lesson.id) {
    errors.push(
      `candidate ID ${candidate.id} does not match lesson ${lesson.id}`
    );
  }

  if (candidate.sourceUrl !== lesson.sourceUrl) {
    errors.push(
      `candidate sourceUrl does not match lesson ${lesson.id}`
    );
  }

  if (candidate.status !== "ai-generated") {
    errors.push(
      `candidate ${lesson.id} must have status ai-generated`
    );
  }

  // Automated validation gate.
  if (
    candidate.validation?.schema !== "passed" ||
    candidate.validation?.evidenceQuotes !== "passed"
  ) {
    errors.push(
      `candidate ${lesson.id} must pass schema and evidence validation`
    );
  }

  // Semantic review / approval gate.
  //
  // A candidate MUST satisfy both conditions before it can enter
  // the canonical production manifest:
  //
  //   reviewStatus === "approved"
  //   validation.semanticReview === "passed"
  //
  // This prevents "pending" AI output from reaching production
  // even if all structural validations pass.
  if (candidate.reviewStatus !== "approved") {
    errors.push(
      `candidate ${lesson.id} must have reviewStatus "approved" (received "${candidate.reviewStatus ?? "missing"}")`
    );
  }

  if (candidate.validation?.semanticReview !== "passed") {
    errors.push(
      `candidate ${lesson.id} must have validation.semanticReview "passed" (received "${candidate.validation?.semanticReview ?? "missing"}")`
    );
  }

  if (typeof candidate.summary !== "string" || !cleanText(candidate.summary)) {
    errors.push(
      `candidate ${lesson.id} summary must be non-empty`
    );
  }

  if (!Array.isArray(candidate.keyPatterns) || candidate.keyPatterns.length > 5) {
    errors.push(
      `candidate ${lesson.id} keyPatterns must contain at most 5 items`
    );
  } else {
    candidate.keyPatterns.forEach((item, index) => {
      if (
        !isPlainObject(item) ||
        !cleanText(item.pattern) ||
        !cleanText(item.meaning)
      ) {
        errors.push(
          `candidate ${lesson.id} keyPatterns[${index}] is incomplete`
        );
      }
    });
  }

  if (!Array.isArray(candidate.vocabulary) || candidate.vocabulary.length > 10) {
    errors.push(
      `candidate ${lesson.id} vocabulary must contain at most 10 items`
    );
  } else {
    candidate.vocabulary.forEach((item, index) => {
      if (
        !isPlainObject(item) ||
        !cleanText(item.word) ||
        !cleanText(item.meaning)
      ) {
        errors.push(
          `candidate ${lesson.id} vocabulary[${index}] is incomplete`
        );
      }
    });
  }

  return errors;
}

export function applyEnrichmentToManifest(manifest, candidates) {
  const lessons = manifest?.lessons;

  if (!Array.isArray(lessons)) {
    throw new Error("manifest lessons must be an array");
  }

  const candidatesById = new Map(
    candidates.map(candidate => [candidate.id, candidate])
  );

  const errors = [];
  let applied = 0;

  const mergedLessons = lessons.map(lesson => {
    const candidate = candidatesById.get(lesson.id);

    if (!candidate) {
      return lesson;
    }

    const candidateErrors = validateEnrichmentCandidate(
      candidate,
      lesson
    );

    if (candidateErrors.length) {
      errors.push(...candidateErrors);
      return lesson;
    }

    applied += 1;

    return {
      ...lesson,
      summary: cleanText(candidate.summary),
      keyPatterns: candidate.keyPatterns.map(cleanPattern),
      vocabulary: candidate.vocabulary.map(cleanVocabulary),
      metadata: {
        ...(lesson.metadata ?? {}),
        aiStatus: candidate.status,
        aiModel: candidate.model,
        aiGeneratedAt: candidate.generatedAt,
        aiReviewStatus: candidate.reviewStatus,
        aiValidation: candidate.validation,
        aiError: undefined,
        aiAttemptedAt: undefined
      }
    };
  });

  // IMPORTANT:
  // Never write a partially merged manifest when even one candidate
  // fails validation or approval.
  if (errors.length) {
    throw new Error(
      `AI enrichment merge failed: ${errors.join("; ")}`
    );
  }

  return {
    manifest: {
      ...manifest,
      lessons: mergedLessons
    },
    applied
  };
}

// Marks lessons whose latest enrichment attempt failed.
// Study fields are left untouched (never fabricated).
export function markEnrichmentFailures(manifest, failures) {
  const failuresById = new Map(
    failures.map(failure => [failure.id, failure])
  );

  let marked = 0;

  const lessons = manifest.lessons.map(lesson => {
    const failure = failuresById.get(lesson.id);

    if (!failure || lesson.metadata?.aiStatus === "ai-generated") {
      return lesson;
    }

    marked += 1;

    return {
      ...lesson,
      metadata: {
        ...(lesson.metadata ?? {}),
        aiStatus: "failed",
        aiError: cleanText(failure.error).slice(0, 300),
        aiAttemptedAt: failure.attemptedAt
      }
    };
  });

  return {
    manifest: {
      ...manifest,
      lessons
    },
    marked
  };
}

export async function readEnrichmentFailures(directory) {
  let names;

  try {
    names = await readdir(directory);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }

  const files = names
    .filter(name => /^\d+\.error\.json$/.test(name));

  return Promise.all(
    files.map(async filename =>
      JSON.parse(
        await readFile(
          path.join(directory, filename),
          "utf8"
        )
      )
    )
  );
}

export async function readEnrichmentCandidates(directory) {
  let names;

  try {
    names = await readdir(directory);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }

  const files = names
    .filter(name => /^\d+\.json$/.test(name))
    .sort(
      (first, second) =>
        Number.parseInt(first, 10) -
        Number.parseInt(second, 10)
    );

  return Promise.all(
    files.map(async filename =>
      JSON.parse(
        await readFile(
          path.join(directory, filename),
          "utf8"
        )
      )
    )
  );
}