import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = "https://lopngoaingu.com/Dynamic_English_Study";
const INDEX_URL = `${BASE}/index.php`;
const OUT = path.resolve("data/lessons.json");

const PARTS = [
  { part: 1, min: 1, max: 100 },
  { part: 2, min: 101, max: 200 },
  { part: 3, min: 201, max: 300 },
  { part: 4, min: 301, max: 340 }
];

function partFor(id) {
  return PARTS.find(p => id >= p.min && id <= p.max)?.part ?? null;
}

function absUrl(value) {
  if (!value) return null;
  return new URL(value, BASE + "/").href;
}

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(s) {
  return stripTags(s);
}

function extractLessonLinks(html) {
  const records = new Map();

  // Prefer links explicitly containing "Anh ngữ sinh động bài".
  const re = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const m of html.matchAll(re)) {
    const href = m[1];
    const text = decodeEntities(m[2]);
    const n = text.match(/Anh\s*ngữ\s*sinh\s*động\s*bài\s*0*(\d{1,3})/i);
    if (!n) continue;
    const id = Number(n[1]);
    if (id < 1 || id > 340) continue;
    records.set(id, {
      id,
      part: partFor(id),
      lessonNumber: id,
      title: `Anh Ngữ Sinh Động Bài ${id}`,
      sourceUrl: absUrl(href)
    });
  }

  // Fallback: the site's current navigation uses index.php?id=N.
  for (let id = 1; id <= 340; id++) {
    if (!records.has(id)) {
      records.set(id, {
        id,
        part: partFor(id),
        lessonNumber: id,
        title: `Anh Ngữ Sinh Động Bài ${id}`,
        sourceUrl: `${INDEX_URL}?id=${id}`
      });
    }
  }

  return [...records.values()].sort((a, b) => a.id - b.id);
}

function extractTitle(html, fallback) {
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) {
    const title = decodeEntities(h1[1]);
    if (title) return title;
  }
  const titleTag = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  if (titleTag) {
    const title = decodeEntities(titleTag[1]).replace(/\s*-\s*New Dynamic English.*$/i, "").trim();
    if (title) return title;
  }
  return fallback;
}

function extractAudioUrl(html, id) {
  // Handles <audio src>, <source src>, and links to .mp3.
  const patterns = [
    /<audio\b[^>]*\bsrc\s*=\s*["']([^"']+\.mp3[^"']*)["']/i,
    /<source\b[^>]*\bsrc\s*=\s*["']([^"']+\.mp3[^"']*)["']/i,
    /href\s*=\s*["']([^"']+\.mp3[^"']*)["']/i
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return absUrl(m[1]);
  }

  // The current site exposes the lesson audio using this stable path pattern.
  return `${BASE}/audio/${id}.mp3`;
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "DynamicEnglishDataPipeline/1.0" }
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  return await res.text();
}

async function main() {
  console.log(`Fetching catalog: ${INDEX_URL}`);
  const indexHtml = await fetchText(INDEX_URL);
  const records = extractLessonLinks(indexHtml);

  if (records.length !== 340) {
    throw new Error(`Expected 340 lessons, found ${records.length}`);
  }

  const now = new Date().toISOString();
  const lessons = [];

  // Fetch lesson pages sequentially to be polite to the source site.
  for (const record of records) {
    process.stdout.write(`Fetching ${String(record.id).padStart(3, "0")}/340 ... `);
    try {
      const html = await fetchText(record.sourceUrl);
      const title = extractTitle(html, record.title);
      const audioUrl = extractAudioUrl(html, record.id);

      lessons.push({
        id: record.id,
        part: record.part,
        lessonNumber: record.lessonNumber,
        title,
        sourceUrl: record.sourceUrl,
        audioUrl,
        summary: null,
        keyPatterns: [],
        vocabulary: [],
        transcript: {
          mode: "source-proxy",
          endpoint: `/api/transcript?id=${record.id}`
        },
        metadata: {
          source: "lopngoaingu.com",
          fetchedAt: now,
          contentStatus: "source-page-linked",
          aiStatus: "pending"
        }
      });

      console.log("OK");
    } catch (err) {
      console.log("FAILED");
      lessons.push({
        id: record.id,
        part: record.part,
        lessonNumber: record.lessonNumber,
        title: record.title,
        sourceUrl: record.sourceUrl,
        audioUrl: `${BASE}/audio/${record.id}.mp3`,
        summary: null,
        keyPatterns: [],
        vocabulary: [],
        transcript: {
          mode: "source-proxy",
          endpoint: `/api/transcript?id=${record.id}`
        },
        metadata: {
          source: "lopngoaingu.com",
          fetchedAt: now,
          contentStatus: "fetch-error",
          error: String(err),
          aiStatus: "pending"
        }
      });
    }
  }

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify({
    schemaVersion: "1.0.0",
    generatedAt: now,
    source: {
      name: "LopNgoaiNgu.com — Dynamic English",
      catalogUrl: INDEX_URL,
      lessonCount: 340
    },
    parts: PARTS.map(({ part, min, max }) => ({
      part, firstLesson: min, lastLesson: max, lessonCount: max - min + 1
    })),
    lessons
  }, null, 2) + "\n", "utf8");

  console.log(`\nWrote ${lessons.length} lessons to ${OUT}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
