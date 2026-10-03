import assert from "node:assert/strict";
import test from "node:test";
import { createAudioPlayer, formatTime } from "../src/player.js";
import { createProgressStore } from "../src/progress-store.js";

class FakeAudio extends EventTarget {
  paused = true;
  readyState = 0;
  currentTime = 0;
  duration = 120;
  volume = 1;
  playbackRate = 1;
  src = "";
  load() { this.readyState = 1; }
  play() { this.paused = false; this.dispatchEvent(new Event("play")); return Promise.resolve(); }
  pause() { this.paused = true; this.dispatchEvent(new Event("pause")); }
  removeAttribute(name) { if (name === "src") this.src = ""; }
}

const lessons = [
  { id: 1, title: "Lesson 1", audioUrl: "https://example.test/1.mp3" },
  { id: 2, title: "Lesson 2", audioUrl: "https://example.test/2.mp3" }
];

test("formats audio durations", () => {
  assert.equal(formatTime(0), "0:00");
  assert.equal(formatTime(65.9), "1:05");
  assert.equal(formatTime(Number.NaN), "0:00");
});

test("restores position and applies volume, speed, seek, and play state", async () => {
  const audio = new FakeAudio();
  const values = new Map();
  const storage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); }
  };
  const progress = createProgressStore({ storage, lessonIds: [1, 2] });
  progress.setPosition(1, 42);
  const player = createAudioPlayer(audio, { progress });
  player.setLesson(lessons[0]);
  audio.dispatchEvent(new Event("loadedmetadata"));
  assert.equal(audio.currentTime, 42);
  player.setVolume(0.4);
  player.setSpeed(1.25);
  player.seek(67);
  player.play();
  await Promise.resolve();
  assert.equal(audio.volume, 0.4);
  assert.equal(audio.playbackRate, 1.25);
  assert.equal(audio.currentTime, 67);
  assert.equal(audio.paused, false);
});

test("does not report buffering before playback begins", () => {
  const audio = new FakeAudio();
  const progress = createProgressStore({ storage: null, lessonIds: [1, 2] });
  const states = [];
  const player = createAudioPlayer(audio, { progress, onStateChange: state => states.push(state) });
  player.setLesson(lessons[0]);
  assert.equal(states.at(-1).loading, false);
  audio.dispatchEvent(new Event("waiting"));
  assert.equal(states.at(-1).loading, true);
  audio.dispatchEvent(new Event("canplay"));
  assert.equal(states.at(-1).loading, false);
});

test("notifies the app when a track ends so it can auto-advance", () => {
  const audio = new FakeAudio();
  const progress = createProgressStore({ storage: null, lessonIds: [1, 2] });
  let endedLesson = null;
  const player = createAudioPlayer(audio, { progress, onEnded: lesson => { endedLesson = lesson; } });
  player.setLesson(lessons[0]);
  audio.dispatchEvent(new Event("ended"));
  assert.equal(endedLesson.id, 1);
  assert.equal(progress.getPosition(1), 0);
  assert.deepEqual(progress.getProgress().completed, []);
});