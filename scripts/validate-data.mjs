import { readFile } from "node:fs/promises";

const file = "data/lessons.json";
const doc = JSON.parse(await readFile(file, "utf8"));
const lessons = doc.lessons;

const errors = [];
if (lessons.length !== 340) errors.push(`lesson count = ${lessons.length}, expected 340`);

const ids = lessons.map(x => x.id);
const unique = new Set(ids);
if (unique.size !== 340) errors.push("lesson IDs are not unique");

for (let i = 1; i <= 340; i++) {
  if (!unique.has(i)) errors.push(`missing lesson ${i}`);
}

for (const l of lessons) {
  const expectedPart =
    l.id <= 100 ? 1 :
    l.id <= 200 ? 2 :
    l.id <= 300 ? 3 : 4;

  if (l.part !== expectedPart) errors.push(`lesson ${l.id}: wrong part`);
  if (!l.sourceUrl?.includes(`id=${l.id}`)) errors.push(`lesson ${l.id}: bad sourceUrl`);
  if (!l.audioUrl?.endsWith(`/audio/${l.id}.mp3`)) {
    errors.push(`lesson ${l.id}: unexpected audioUrl ${l.audioUrl}`);
  }
  if (l.summary !== null && (typeof l.summary !== "string" || !l.summary.trim())) {
    errors.push(`lesson ${l.id}: summary must be null or a non-empty string`);
  }
  if (!Array.isArray(l.keyPatterns)) errors.push(`lesson ${l.id}: keyPatterns must be array`);
  else {
    l.keyPatterns.forEach((item, index) => {
      if (!item || typeof item.pattern !== "string" || !item.pattern.trim() ||
          typeof item.meaning !== "string" || !item.meaning.trim()) {
        errors.push(`lesson ${l.id}: keyPatterns[${index}] must include pattern and meaning`);
      }
    });
  }
  if (!Array.isArray(l.vocabulary)) errors.push(`lesson ${l.id}: vocabulary must be array`);
  else {
    l.vocabulary.forEach((item, index) => {
      if (!item || typeof item.word !== "string" || !item.word.trim() ||
          typeof item.meaning !== "string" || !item.meaning.trim()) {
        errors.push(`lesson ${l.id}: vocabulary[${index}] must include word and meaning`);
      }
    });
  }
}

if (errors.length) {
  console.error("VALIDATION FAILED");
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}

console.log("VALIDATION PASSED");
console.log(`340 lessons | 4 parts | IDs 1–340 | audio URL pattern validated`);
