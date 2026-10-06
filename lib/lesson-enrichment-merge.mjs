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

export function validateEnrichmentCandidate(candidate, lesson) {
  const errors = [];
  if (!isPlainObject(candidate)) return ["candidate must be a JSON object"];

  if (candidate.id !== lesson.id) errors.push(`candidate ID ${candidate.id} does not match lesson ${lesson.id}`);
  if (candidate.sourceUrl !== lesson.sourceUrl) errors.push(`candidate sourceUrl does not match lesson ${lesson.id}`);
  if (candidate.status !== "ai-generated") errors.push(`candidate ${lesson.id} must have status ai-generated`);
  if (candidate.validation?.schema !== "passed" || candidate.validation?.evidenceQuotes !== "passed") {
    errors.push(`candidate ${lesson.id} must pass schema and evidence validation`);
  }
  if (typeof candidate.summary !== "string" || !cleanText(candidate.summary)) {
    errors.push(`candidate ${lesson.id} summary must be non-empty`);
  }

  if (!Array.isArray(candidate.keyPatterns) || candidate.keyPatterns.length > 5) {
    errors.push(`candidate ${lesson.id} keyPatterns must contain at most 5 items`);
  } else {
    candidate.keyPatterns.forEach((item, index) => {
      if (!isPlainObject(item) || !cleanText(item.pattern) || !cleanText(item.meaning)) {
        errors.push(`candidate ${lesson.id} keyPatterns[${index}] is incomplete`);
      }
    });
  }

  if (!Array.isArray(candidate.vocabulary) || candidate.vocabulary.length > 10) {
    errors.push(`candidate ${lesson.id} vocabulary must contain at most 10 items`);
  } else {
    candidate.vocabulary.forEach((item, index) => {
      if (!isPlainObject(item) || !cleanText(item.word) || !cleanText(item.meaning)) {
        errors.push(`candidate ${lesson.id} vocabulary[${index}] is incomplete`);
      }
    });
  }

  return errors;
}

export function applyEnrichmentToManifest(manifest, candidates) {
  const lessons = manifest?.lessons;
  if (!Array.isArray(lessons)) throw new Error("manifest lessons must be an array");

  const candidatesById = new Map(candidates.map(candidate => [candidate.id, candidate]));
  const errors = [];
  let applied = 0;

  const mergedLessons = lessons.map(lesson => {
    const candidate = candidatesById.get(lesson.id);
    if (!candidate) return lesson;

    const candidateErrors = validateEnrichmentCandidate(candidate, lesson);
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
        aiReviewStatus: candidate.reviewStatus ?? "pending",
        aiValidation: candidate.validation
      }
    };
  });

  if (errors.length) throw new Error(`AI enrichment merge failed: ${errors.join("; ")}`);

  return {
    manifest: { ...manifest, lessons: mergedLessons },
    applied
  };
}

export async function readEnrichmentCandidates(directory) {
  let names;
  try {
    names = await readdir(directory);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const files = names.filter(name => /^\d+\.json$/.test(name)).sort((first, second) => Number.parseInt(first, 10) - Number.parseInt(second, 10));
  return Promise.all(files.map(async filename => JSON.parse(await readFile(path.join(directory, filename), "utf8"))));
}
