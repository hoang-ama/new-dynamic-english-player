import { extractSourceLesson } from "./source-content.mjs";

const SOURCE_URL = "https://lopngoaingu.com/Dynamic_English_Study/index.php";
const FETCH_TIMEOUT_MS = 8_000;

function respond(res, statusCode, body) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(statusCode).json(body);
}

function requestedLessonId(req) {
  const query = new URL(req.url ?? "/", "https://dynamic-english.invalid").searchParams;
  const ids = query.getAll("id");
  if (ids.length !== 1 || !/^\d+$/.test(ids[0])) return null;

  const id = Number(ids[0]);
  return Number.isSafeInteger(id) && id >= 1 && id <= 340 ? id : null;
}

export function createTranscriptHandler({ lessons, fetchImpl = fetch, logger = console }) {
  return async function transcriptHandler(req, res) {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return respond(res, 405, { error: "Method not allowed" });
    }

    const id = requestedLessonId(req);
    if (id === null) return respond(res, 400, { error: "A valid lesson id from 1 to 340 is required" });

    const lesson = lessons.find(record => record.id === id);
    if (!lesson) return respond(res, 404, { error: "Lesson not found" });

    const expectedUrl = `${SOURCE_URL}?id=${id}`;
    if (lesson.sourceUrl !== expectedUrl) {
      return respond(res, 500, { error: "Lesson source configuration is invalid" });
    }

    let html;
    try {
      const response = await fetchImpl(lesson.sourceUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
      });
      if (!response.ok) {
        logger.error("Transcript source returned an error", { lessonId: id, status: response.status });
        return respond(res, 502, { error: "Transcript source is unavailable" });
      }
      html = await response.text();
    } catch (error) {
      logger.error("Transcript source request failed", {
        lessonId: id,
        errorName: error?.name ?? "UnknownError",
        causeCode: error?.cause?.code ?? "unknown"
      });
      return respond(res, 502, { error: "Transcript source is unavailable" });
    }

    try {
      const transcript = extractSourceLesson(html, id, lesson.sourceUrl, new Date().toISOString());
      return respond(res, 200, transcript);
    } catch (error) {
      logger.error("Transcript extraction failed", { lessonId: id, errorName: error?.name ?? "UnknownError" });
      return respond(res, 502, { error: "Transcript could not be extracted from the source page" });
    }
  };
}