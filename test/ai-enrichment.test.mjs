import assert from "node:assert/strict";
import test from "node:test";
import { enrichLesson, GEMINI_MODEL, parseModelJson, validateEnrichment } from "../lib/ai-enrichment.mjs";
import { applyEnrichmentToManifest } from "../lib/lesson-enrichment-merge.mjs";

const content = "The lesson teaches: I come from New York. New York is a city. I come from California.";
const sourceLesson = {
  id: 1,
  title: "Lesson 1",
  sourceUrl: "https://lopngoaingu.com/Dynamic_English_Study/index.php?id=1",
  fetchedAt: "2026-10-02T00:00:00.000Z",
  status: "fetched",
  content
};
const validResult = {
  summary: "The lesson practices saying where a person comes from.",
  summaryEvidence: ["I come from New York.", "I come from California."],
  keyPatterns: [{
    pattern: "I come from [place].",
    meaning: "Say the place a person comes from.",
    evidence: "I come from New York."
  }],
  vocabulary: [{
    word: "city",
    meaning: "city",
    evidence: "New York is a city."
  }]
};

test("validates shape and exact source excerpts", () => {
  assert.deepEqual(validateEnrichment(content, validResult), []);
});

test("rejects evidence not present in source and unknown output fields", () => {
  const invalid = {
    ...validResult,
    extra: "unsupported",
    vocabulary: [{ ...validResult.vocabulary[0], evidence: "Paris is a capital." }]
  };
  const errors = validateEnrichment(content, invalid);
  assert.ok(errors.some(error => error.includes("unexpected field")));
  assert.ok(errors.some(error => error.includes("vocabulary[0]")));
});

test("fails without an API key and before making a request", async () => {
  let requested = false;
  await assert.rejects(
    enrichLesson(sourceLesson, { fetchImpl: () => { requested = true; } }),
    /GEMINI_API_KEY is required/
  );
  assert.equal(requested, false);
});

test("sends the selected model request with the key only in a header", async () => {
  let request;
  const result = await enrichLesson(sourceLesson, {
    apiKey: "test-secret",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return {
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify(validResult) }] }, finishReason: "STOP" }],
          usageMetadata: { promptTokenCount: 120, candidatesTokenCount: 80 }
        })
      };
    }
  });

  assert.equal(result.model, GEMINI_MODEL);
  assert.equal(result.status, "ai-generated");
  assert.equal(result.reviewStatus, "pending");
  assert.equal(request.options.headers["x-goog-api-key"], "test-secret");
  assert.equal(request.url.includes("test-secret"), false);
  assert.equal(request.options.body.includes("responseFormat"), true);
});

test("retries transient overload and succeeds without changing the model or payload", async () => {
  let calls = 0;
  const retries = [];
  const result = await enrichLesson(sourceLesson, {
    apiKey: "test-secret",
    waitImpl: async () => {},
    onRetry: retry => retries.push(retry),
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) return { status: 503, ok: false, json: async () => ({ error: { message: "high demand" } }) };
      return {
        status: 200,
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(validResult) }] } }] })
      };
    }
  });

  assert.equal(calls, 2);
  assert.equal(retries.length, 1);
  assert.equal(retries[0].status, 503);
  assert.equal(result.model, GEMINI_MODEL);
});

test("does not retry authentication or other non-transient errors", async () => {
  let calls = 0;
  await assert.rejects(enrichLesson(sourceLesson, {
    apiKey: "test-secret",
    waitImpl: async () => {},
    fetchImpl: async () => {
      calls += 1;
      return { status: 403, ok: false, json: async () => ({ error: { message: "key rejected" } }) };
    }
  }), /Gemini API request failed \(403\): key rejected/);
  assert.equal(calls, 1);
});

test("rejects malformed or unsupported model output", async () => {
  await assert.rejects(enrichLesson(sourceLesson, {
    apiKey: "test-secret",
    fetchImpl: async () => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: "not-json" }] } }] }) })
  }), /malformed JSON/);

  await assert.rejects(enrichLesson(sourceLesson, {
    apiKey: "test-secret",
    fetchImpl: async () => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ ...validResult, summaryEvidence: ["not in source"] }) }] } }] }) })
  }), /failed validation/);
});

test("parses model JSON wrapped in markdown or surrounding text", () => {
  assert.deepEqual(parseModelJson(`\`\`\`json\n${JSON.stringify(validResult)}\n\`\`\``), validResult);
  assert.deepEqual(parseModelJson(`Here is the JSON:\n${JSON.stringify(validResult)}`), validResult);
  assert.throws(() => parseModelJson("not-json"), /malformed JSON/);
});

test("applies validated enrichment candidates to the lesson manifest", () => {
  const manifest = {
    lessons: [{
      id: 1,
      sourceUrl: sourceLesson.sourceUrl,
      summary: null,
      keyPatterns: [],
      vocabulary: [],
      metadata: { aiStatus: "pending" }
    }]
  };
  const candidate = {
    ...validResult,
    id: 1,
    sourceUrl: sourceLesson.sourceUrl,
    model: GEMINI_MODEL,
    generatedAt: "2026-10-04T00:00:00.000Z",
    status: "ai-generated",
    reviewStatus: "pending",
    validation: { schema: "passed", evidenceQuotes: "passed", semanticReview: "pending" }
  };

  const { manifest: merged, applied } = applyEnrichmentToManifest(manifest, [candidate]);

  assert.equal(applied, 1);
  assert.equal(merged.lessons[0].summary, validResult.summary);
  assert.deepEqual(merged.lessons[0].keyPatterns, [{ pattern: "I come from [place].", meaning: "Say the place a person comes from." }]);
  assert.deepEqual(merged.lessons[0].vocabulary, [{ word: "city", meaning: "city" }]);
  assert.equal(merged.lessons[0].metadata.aiStatus, "ai-generated");
  assert.equal(merged.lessons[0].metadata.aiReviewStatus, "pending");
});
