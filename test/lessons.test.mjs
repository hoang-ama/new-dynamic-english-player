import assert from "node:assert/strict";
import test from "node:test";
import { findLesson, loadLessons, searchLessons } from "../src/lessons.js";

const lessons = Array.from({ length: 340 }, (_, index) => ({
  id: index + 1,
  lessonNumber: index + 1,
  part: index < 100 ? 1 : index < 200 ? 2 : index < 300 ? 3 : 4,
  title: `Anh Ngữ Bài ${index + 1}`
}));

test("loads a complete, ordered manifest", async () => {
  const loaded = await loadLessons("/data/lessons.json", async () => ({
    ok: true,
    json: async () => ({ lessons })
  }));
  assert.equal(loaded.length, 340);
  assert.equal(loaded[339].id, 340);
});

test("rejects incomplete lesson manifests", async () => {
  await assert.rejects(loadLessons("/data/lessons.json", async () => ({
    ok: true,
    json: async () => ({ lessons: lessons.slice(0, 12) })
  })), /incomplete or malformed/);
});

test("searches lesson number, title, and part without changing the list", () => {
  assert.deepEqual(searchLessons(lessons, "113").map(lesson => lesson.id), [113]);
  assert.equal(searchLessons(lessons, "  Anh NGỮ bài 2 ").some(lesson => lesson.id === 2), true);
  assert.equal(searchLessons(lessons, "", 4).length, 40);
  assert.equal(findLesson(lessons, "340").part, 4);
});