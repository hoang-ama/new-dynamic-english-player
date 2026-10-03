import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { stageLessonManifest } from "../lib/vercel-build.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("stages the canonical 340-lesson manifest inside public static assets", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "dynamic-english-vercel-"));
  try {
    const sourcePath = path.join(root, "data", "lessons.json");
    const outputPath = await stageLessonManifest({ sourcePath, publicDirectory: directory });
    const [source, output] = await Promise.all([
      readFile(sourcePath, "utf8"),
      readFile(outputPath, "utf8")
    ]);
    assert.equal(output, source);
    assert.equal(JSON.parse(output).lessons.length, 340);
    assert.equal(path.relative(directory, outputPath), path.join("data", "lessons.json"));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("refuses to stage an incomplete manifest", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "dynamic-english-vercel-"));
  try {
    const sourcePath = path.join(directory, "lessons.json");
    await writeFile(sourcePath, JSON.stringify({ lessons: [{ id: 1 }] }));
    await assert.rejects(stageLessonManifest({ sourcePath, publicDirectory: path.join(directory, "public") }), /canonical 340-lesson manifest/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});