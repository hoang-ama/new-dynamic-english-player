import assert from "node:assert/strict";
import test from "node:test";
import { createProgressStore, STORAGE_KEYS } from "../src/progress-store.js";

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, value); },
    values
  };
}

const lessonIds = [1, 2, 3];

test("persists completion and current lesson", () => {
  const storage = createStorage();
  const store = createProgressStore({ storage, lessonIds });
  assert.equal(store.toggleCompleted(2), true);
  assert.equal(store.setCurrentLesson(3), true);
  assert.deepEqual(store.getProgress(), { completed: [2], currentLesson: 3 });
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEYS.currentLesson)), 3);
});

test("persists lesson positions and supported playback speeds", () => {
  const store = createProgressStore({ storage: createStorage(), lessonIds });
  assert.equal(store.setPosition(2, 84.5), true);
  assert.equal(store.getPosition(2), 84.5);
  assert.equal(store.setPosition(2, -2), true);
  assert.equal(store.getPosition(2), 0);
  assert.equal(store.setSpeed(1.5), true);
  assert.equal(store.getSpeed(), 1.5);
  assert.equal(store.setSpeed(1.3), false);
});

test("ignores corrupt JSON, invalid lesson IDs, and invalid positions", () => {
  const storage = createStorage({
    [STORAGE_KEYS.progress]: "{bad json",
    [STORAGE_KEYS.currentLesson]: "340",
    [STORAGE_KEYS.positions]: JSON.stringify({ 2: -1, 340: 24, 3: 18 }),
    [STORAGE_KEYS.speed]: "8"
  });
  const store = createProgressStore({ storage, lessonIds });
  assert.deepEqual(store.getProgress(), { completed: [], currentLesson: 1 });
  assert.equal(store.getPosition(2), 0);
  assert.equal(store.getPosition(3), 18);
  assert.equal(store.getSpeed(), 1);
});

test("storage failures do not throw", () => {
  const storage = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); }
  };
  const store = createProgressStore({ storage, lessonIds });
  assert.deepEqual(store.getProgress(), { completed: [], currentLesson: 1 });
  assert.equal(store.toggleCompleted(1), true);
  assert.equal(store.getPosition(1), 0);
});