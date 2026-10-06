import assert from "node:assert/strict";
import test from "node:test";
import { createTranscriptHandler } from "../lib/transcript-api.mjs";

const lesson = {
  id: 1,
  sourceUrl: "https://lopngoaingu.com/Dynamic_English_Study/index.php?id=1"
};
const lessons = [lesson];
const page = "<div id='fontchu'><h3>Lesson one</h3><p>Source transcript text.</p><center><a href='index.php'>Menu Bài Học</a></center></div>";
const silentLogger = { error() {} };

function invoke(handler, { method = "GET", url = "/api/transcript?id=1" } = {}) {
  const res = {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(statusCode) { this.statusCode = statusCode; return this; },
    json(body) { this.body = body; return this; }
  };
  return handler({ method, url }, res).then(() => res);
}

test("rejects non-GET requests", async () => {
  const handler = createTranscriptHandler({ lessons, fetchImpl: () => assert.fail("must not fetch") });
  const res = await invoke(handler, { method: "POST" });
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, "GET");
});

test("rejects missing, malformed, duplicate, and out-of-range IDs", async t => {
  const handler = createTranscriptHandler({ lessons, fetchImpl: () => assert.fail("must not fetch") });
  for (const url of ["/api/transcript", "/api/transcript?id=1.5", "/api/transcript?id=1&id=2", "/api/transcript?id=341"]) {
    await t.test(url, async () => {
      const res = await invoke(handler, { url });
      assert.equal(res.statusCode, 400);
    });
  }
});

test("fetches only the manifest URL and returns cleaned structured content", async () => {
  const requestedUrls = [];
  const handler = createTranscriptHandler({
    lessons,
    fetchImpl: async url => {
      requestedUrls.push(url);
      return { ok: true, text: async () => page };
    }
  });
  const res = await invoke(handler, { url: "/api/transcript?id=1&url=https://example.com" });
  assert.deepEqual(requestedUrls, [lesson.sourceUrl]);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, "fetched");
  assert.equal(res.body.content.includes("Source transcript text."), true);
  assert.equal(res.body.content.includes("Menu Bài Học"), false);
  assert.ok(Array.isArray(res.body.sections));
});

test("serves a validated cached transcript without contacting the blocked source", async () => {
  const cached = {
    id: 1,
    sourceUrl: lesson.sourceUrl,
    title: "Lesson one",
    content: "Cached protected source transcript.",
    sections: [{ type: "paragraph", text: "Cached protected source transcript." }],
    fetchedAt: "2026-10-03T00:00:00.000Z",
    status: "fetched"
  };
  const handler = createTranscriptHandler({
    lessons,
    sourceLessonsDirectory: "/vercel/function/data/source-lessons",
    readFileImpl: async filePath => {
      assert.equal(filePath, "/vercel/function/data/source-lessons/1.json");
      return JSON.stringify(cached);
    },
    fetchImpl: () => assert.fail("cached response must not request the upstream source")
  });
  const res = await invoke(handler);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.content, cached.content);
});

test("maps source failures to 502 without returning fabricated content", async () => {
  const handler = createTranscriptHandler({
    lessons,
    logger: silentLogger,
    fetchImpl: async () => ({ ok: false, status: 503, text: async () => "" })
  });
  const res = await invoke(handler);
  assert.equal(res.statusCode, 502);
  assert.deepEqual(res.body, { error: "Transcript source is unavailable" });
});

test("maps extraction failures to 502", async () => {
  const handler = createTranscriptHandler({
    lessons,
    logger: silentLogger,
    fetchImpl: async () => ({ ok: true, text: async () => "<html><body>No lesson article</body></html>" })
  });
  const res = await invoke(handler);
  assert.equal(res.statusCode, 502);
  assert.deepEqual(res.body, { error: "Transcript could not be extracted from the source page" });
});

test("refuses a manifest URL that does not match the fixed source", async () => {
  const handler = createTranscriptHandler({
    lessons: [{ ...lesson, sourceUrl: "https://example.com/" }],
    fetchImpl: () => assert.fail("must not fetch")
  });
  const res = await invoke(handler);
  assert.equal(res.statusCode, 500);
});