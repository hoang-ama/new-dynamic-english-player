export const STORAGE_KEYS = {
  progress: "dynamicEnglishProgress",
  speed: "dynamicEnglishPlaybackSpeed",
  currentLesson: "dynamicEnglishLastLesson",
  positions: "dynamicEnglishPositions"
};

export const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 2];

function browserStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export function createProgressStore({ storage = browserStorage(), lessonIds = [] } = {}) {
  const validIds = new Set(lessonIds);
  const defaultLesson = lessonIds[0] ?? 1;

  function readJson(key, fallback) {
    if (!storage) return fallback;
    try {
      const value = storage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    if (!storage) return false;
    try {
      storage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function isValidLessonId(id) {
    return Number.isInteger(id) && (validIds.size === 0 ? id >= 1 && id <= 340 : validIds.has(id));
  }

  function getProgress() {
    const saved = readJson(STORAGE_KEYS.progress, {});
    const savedCurrent = Number(readJson(STORAGE_KEYS.currentLesson, saved.currentLesson));
    const completed = Array.isArray(saved.completed)
      ? [...new Set(saved.completed.map(Number).filter(isValidLessonId))].sort((a, b) => a - b)
      : [];

    return {
      completed,
      currentLesson: isValidLessonId(savedCurrent) ? savedCurrent : defaultLesson
    };
  }

  function getPositions() {
    const saved = readJson(STORAGE_KEYS.positions, {});
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};

    return Object.fromEntries(Object.entries(saved)
      .filter(([id, position]) => isValidLessonId(Number(id)) && Number.isFinite(position) && position >= 0)
      .map(([id, position]) => [id, position]));
  }

  function saveProgress(progress) {
    writeJson(STORAGE_KEYS.progress, progress);
    writeJson(STORAGE_KEYS.currentLesson, progress.currentLesson);
  }

  return {
    getProgress,
    getCompleted: () => new Set(getProgress().completed),
    setCurrentLesson(id) {
      const lessonId = Number(id);
      if (!isValidLessonId(lessonId)) return false;
      saveProgress({ ...getProgress(), currentLesson: lessonId });
      return true;
    },
    toggleCompleted(id) {
      const lessonId = Number(id);
      if (!isValidLessonId(lessonId)) return false;
      const progress = getProgress();
      const completed = new Set(progress.completed);
      if (completed.has(lessonId)) completed.delete(lessonId);
      else completed.add(lessonId);
      saveProgress({ ...progress, completed: [...completed].sort((a, b) => a - b) });
      return completed.has(lessonId);
    },
    getPosition(id) {
      return getPositions()[String(id)] ?? 0;
    },
    setPosition(id, seconds) {
      const lessonId = Number(id);
      if (!isValidLessonId(lessonId) || !Number.isFinite(seconds)) return false;
      const positions = getPositions();
      positions[lessonId] = Math.max(0, seconds);
      return writeJson(STORAGE_KEYS.positions, positions);
    },
    getSpeed() {
      const speed = Number(readJson(STORAGE_KEYS.speed, 1));
      return PLAYBACK_SPEEDS.includes(speed) ? speed : 1;
    },
    setSpeed(speed) {
      const value = Number(speed);
      if (!PLAYBACK_SPEEDS.includes(value)) return false;
      return writeJson(STORAGE_KEYS.speed, value);
    }
  };
}