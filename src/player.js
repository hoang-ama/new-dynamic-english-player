import { PLAYBACK_SPEEDS } from "./progress-store.js";

export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function createAudioPlayer(audio, { progress, onStateChange = () => {}, onError = () => {}, onEnded = () => {} }) {
  let currentLesson = null;
  let currentSpeed = progress.getSpeed();
  let lastPositionSave = 0;
  let loading = false;

  function notify(extra = {}) {
    onStateChange({
      lesson: currentLesson,
      playing: !audio.paused,
      loading,
      currentTime: audio.currentTime || 0,
      duration: Number.isFinite(audio.duration) ? audio.duration : 0,
      volume: audio.volume,
      speed: currentSpeed,
      ...extra
    });
  }

  function savePosition(force = false) {
    if (!currentLesson || !Number.isFinite(audio.currentTime)) return;
    const now = Date.now();
    if (force || now - lastPositionSave >= 4000) {
      progress.setPosition(currentLesson.id, audio.currentTime);
      lastPositionSave = now;
    }
  }

  audio.addEventListener("play", () => notify({ error: "" }));
  audio.addEventListener("pause", () => {
    loading = false;
    savePosition(true);
    notify();
  });
  audio.addEventListener("timeupdate", () => {
    savePosition();
    notify();
  });
  audio.addEventListener("seeked", () => {
    savePosition(true);
    notify();
  });
  audio.addEventListener("loadedmetadata", () => {
    if (currentLesson) {
      const savedPosition = progress.getPosition(currentLesson.id);
      if (savedPosition > 0 && savedPosition < audio.duration) audio.currentTime = savedPosition;
    }
    notify();
  });
  audio.addEventListener("durationchange", () => notify());
  audio.addEventListener("waiting", () => {
    loading = true;
    notify();
  });
  audio.addEventListener("canplay", () => {
    loading = false;
    notify();
  });
  audio.addEventListener("playing", () => {
    loading = false;
    notify({ error: "" });
  });
  audio.addEventListener("error", () => {
    onError("Audio could not be played. The original source may be unavailable.");
    notify({ error: "Audio could not be played. The original source may be unavailable." });
  });
  audio.addEventListener("ended", () => {
    if (currentLesson) progress.setPosition(currentLesson.id, 0);
    notify({ ended: true });
    onEnded(currentLesson);
  });

  return {
    setLesson(lesson, { autoplay = false } = {}) {
      if (!lesson) return;
      audio.pause();
      currentLesson = lesson;
      lastPositionSave = 0;
      loading = false;
      audio.playbackRate = currentSpeed;

      if (lesson.audioUrl) {
        audio.src = lesson.audioUrl;
        audio.load();
      } else {
        audio.removeAttribute("src");
        audio.load();
      }

      if (autoplay) this.play();
      notify({ error: lesson.audioUrl ? "" : "No audio URL is available for this lesson." });
    },
    play() {
      if (!currentLesson?.audioUrl) {
        onError("No audio URL is available for this lesson.");
        notify({ error: "No audio URL is available for this lesson." });
        return;
      }
      audio.play().catch(() => {
        const message = "Playback was blocked or the source could not be loaded.";
        onError(message);
        notify({ error: message });
      });
    },
    pause() {
      audio.pause();
    },
    toggle() {
      if (audio.paused) this.play();
      else this.pause();
    },
    seek(seconds) {
      if (Number.isFinite(audio.duration) && Number.isFinite(seconds)) {
        audio.currentTime = Math.max(0, Math.min(seconds, audio.duration));
        savePosition(true);
        notify();
      }
    },
    setVolume(volume) {
      if (!Number.isFinite(volume)) return;
      audio.volume = Math.max(0, Math.min(volume, 1));
      notify();
    },
    setSpeed(speed) {
      const value = Number(speed);
      if (!PLAYBACK_SPEEDS.includes(value)) return;
      currentSpeed = value;
      audio.playbackRate = value;
      progress.setSpeed(value);
      notify();
    },
    getLesson() {
      return currentLesson;
    },
    destroy() {
      savePosition(true);
      audio.pause();
    }
  };
}