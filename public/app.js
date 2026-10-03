import { findLesson, loadLessons, PARTS, searchLessons } from "/src/lessons.js";
import { createProgressStore } from "/src/progress-store.js";
import { createAudioPlayer, formatTime } from "/src/player.js";

const elements = Object.fromEntries([
  "lesson-sidebar", "main-column", "sidebar-close", "drawer-scrim", "menu-open", "lesson-search", "lesson-list",
  "part-tabs", "lesson-result-count", "progress-count", "progress-bar", "progress-fill", "breadcrumb-part",
  "topbar-current-label", "lesson-part-label", "lesson-sequence", "lesson-title", "lesson-subtitle",
  "complete-button", "complete-label", "audio-title", "audio-element", "play-button", "previous-button",
  "next-button", "speed-select", "seek-slider", "current-time", "duration-time", "audio-state", "audio-error",
  "volume-slider", "summary-content", "patterns-content", "vocabulary-content", "notes-status",
  "transcript-toggle", "transcript-panel", "transcript-content", "dock-title", "dock-previous", "dock-play",
  "dock-next", "dock-current-time", "dock-duration", "dock-progress-fill", "dock-expand", "toast"
].map(id => [id, document.getElementById(id)]));
const mobileViewport = window.matchMedia("(max-width: 760px)");

let lessons = [];
let currentLesson = null;
let currentPart = 0;
let transcriptCache = new Map();
let transcriptRequest = null;
let toastTimer = 0;

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 2400);
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

let progress = createProgressStore({ lessonIds: [] });
const player = createAudioPlayer(elements["audio-element"], {
  progress,
  onStateChange: updatePlayerState,
  onError: showToast,
  onEnded: lesson => {
    const next = findLesson(lessons, lesson?.id + 1);
    if (next) selectLesson(next.id, { autoplay: true });
  }
});

function updatePlayerState(state) {
  const currentTime = formatTime(state.currentTime);
  const duration = formatTime(state.duration);
  const playLabel = state.playing ? "Pause audio" : "Play audio";
  const playText = state.playing ? "Ⅱ" : "▶";
  elements["play-button"].setAttribute("aria-label", playLabel);
  elements["play-button"].textContent = playText;
  elements["dock-play"].setAttribute("aria-label", playLabel);
  elements["dock-play"].textContent = playText;
  elements["current-time"].textContent = currentTime;
  elements["duration-time"].textContent = duration;
  elements["dock-current-time"].textContent = currentTime;
  elements["dock-duration"].textContent = duration;
  elements["seek-slider"].max = String(state.duration || 0);
  elements["seek-slider"].value = String(Math.min(state.currentTime || 0, state.duration || 0));
  elements["dock-progress-fill"].style.width = `${state.duration ? Math.min(100, state.currentTime / state.duration * 100) : 0}%`;
  elements["audio-state"].textContent = state.loading ? "Buffering audio…" : state.playing ? "Now playing" : "Ready to play";
  elements["audio-error"].hidden = !state.error;
  elements["audio-error"].textContent = state.error || "";
  elements["speed-select"].value = String(state.speed);
}

function updateProgressSummary() {
  const completedCount = progress.getCompleted().size;
  elements["progress-count"].textContent = `${completedCount} / ${lessons.length}`;
  elements["progress-fill"].style.width = `${lessons.length ? completedCount / lessons.length * 100 : 0}%`;
  elements["progress-bar"].setAttribute("aria-valuenow", String(completedCount));
}

function renderLessonList() {
  const matches = searchLessons(lessons, elements["lesson-search"].value, currentPart);
  const completed = progress.getCompleted();
  const fragment = document.createDocumentFragment();

  if (!matches.length) {
    const empty = createElement("li", "lesson-empty", "No lessons match this search.");
    fragment.append(empty);
  }

  for (const lesson of matches) {
    const item = createElement("li", "lesson-list-item");
    const button = createElement("button", "lesson-link");
    button.type = "button";
    button.dataset.lessonId = String(lesson.id);
    button.setAttribute("aria-current", lesson.id === currentLesson?.id ? "page" : "false");
    if (lesson.id === currentLesson?.id) button.classList.add("is-current");

    const number = createElement("span", "lesson-number", String(lesson.id).padStart(3, "0"));
    const title = createElement("span", "lesson-link-title", lesson.title || `Lesson ${lesson.id}`);
    const done = createElement("span", "lesson-done", completed.has(lesson.id) ? "✓" : "");
    done.setAttribute("aria-label", completed.has(lesson.id) ? "Completed" : "Not completed");
    button.append(number, title, done);
    item.append(button);
    fragment.append(item);
  }

  elements["lesson-list"].replaceChildren(fragment);
  elements["lesson-result-count"].textContent = String(matches.length);
}

function renderStudyNotes(lesson) {
  elements["summary-content"].replaceChildren();
  elements["patterns-content"].replaceChildren();
  elements["vocabulary-content"].replaceChildren();

  if (typeof lesson.summary === "string" && lesson.summary.trim()) {
    elements["summary-content"].append(createElement("p", "", lesson.summary));
  } else {
    elements["summary-content"].append(createElement("p", "study-placeholder", "Study notes are not available for this lesson yet."));
  }

  const patterns = Array.isArray(lesson.keyPatterns) ? lesson.keyPatterns : [];
  if (patterns.length) {
    for (const item of patterns) {
      const row = createElement("div", "pattern-item");
      row.append(createElement("strong", "", item.pattern || ""), createElement("span", "", item.meaning || ""));
      elements["patterns-content"].append(row);
    }
  } else {
    elements["patterns-content"].append(createElement("p", "study-placeholder", "No verified patterns available yet."));
  }

  const vocabulary = Array.isArray(lesson.vocabulary) ? lesson.vocabulary : [];
  if (vocabulary.length) {
    for (const item of vocabulary) {
      const row = createElement("div", "vocabulary-item");
      row.append(createElement("strong", "", item.word || ""), createElement("span", "", item.meaning || ""));
      elements["vocabulary-content"].append(row);
    }
  } else {
    elements["vocabulary-content"].append(createElement("p", "study-placeholder", "No verified vocabulary available yet."));
  }

  elements["notes-status"].textContent = lesson.summary || patterns.length || vocabulary.length
    ? "SOURCE-GROUNDED"
    : "NOT ENRICHED";
}

function updateCompleteButton() {
  const isCompleted = progress.getCompleted().has(currentLesson.id);
  elements["complete-button"].setAttribute("aria-pressed", String(isCompleted));
  elements["complete-label"].textContent = isCompleted ? "Completed" : "Mark complete";
}

function renderLesson(lesson) {
  currentLesson = lesson;
  const part = PARTS.find(item => item.id === lesson.part);
  const title = lesson.title || `Lesson ${lesson.id}`;
  elements["lesson-title"].textContent = title;
  elements["lesson-subtitle"].textContent = `Anh Ngữ Sinh Động · Lesson ${lesson.id}`;
  elements["lesson-part-label"].textContent = part?.label.toUpperCase() ?? `PART ${lesson.part}`;
  elements["breadcrumb-part"].textContent = part?.label.toUpperCase() ?? `PART ${lesson.part}`;
  elements["lesson-sequence"].textContent = `LESSON ${String(lesson.id).padStart(2, "0")} OF ${lessons.length}`;
  elements["topbar-current-label"].textContent = `Lesson ${lesson.id}`;
  elements["audio-title"].textContent = `Lesson ${lesson.id}`;
  elements["dock-title"].textContent = `Lesson ${lesson.id}`;
  renderStudyNotes(lesson);
  updateCompleteButton();
  progress.setCurrentLesson(lesson.id);
  player.setLesson(lesson);
  renderLessonList();
  updateProgressSummary();
  resetTranscriptPanel();
}

function selectLesson(id, { autoplay = false } = {}) {
  const lesson = findLesson(lessons, id);
  if (!lesson) return;
  renderLesson(lesson);
  if (autoplay) player.play();
  if (window.matchMedia("(max-width: 760px)").matches) closeLessonDrawer();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderTranscriptSection(section) {
  if (!section || typeof section !== "object") return null;
  if (section.type === "heading") {
    const level = Math.min(4, Math.max(3, Number(section.level) || 3));
    const heading = createElement(`h${level}`, "", section.text || "");
    return heading;
  }
  if (section.type === "quote") return createElement("blockquote", "", section.text || "");
  if (section.type === "list" && Array.isArray(section.items)) {
    const list = document.createElement(section.ordered ? "ol" : "ul");
    for (const item of section.items) list.append(createElement("li", "", String(item)));
    return list;
  }
  if (["paragraph", "text", "list-item"].includes(section.type)) {
    return createElement("p", "", section.text || "");
  }
  return null;
}

function showTranscript(record) {
  elements["transcript-content"].replaceChildren();
  const sections = Array.isArray(record.sections) ? record.sections : [];
  const rendered = sections.map(renderTranscriptSection).filter(Boolean);
  if (rendered.length) {
    elements["transcript-content"].append(...rendered);
  } else if (typeof record.content === "string" && record.content) {
    elements["transcript-content"].append(createElement("p", "", record.content));
  } else {
    elements["transcript-content"].append(createElement("p", "transcript-error", "No transcript content was returned."));
  }
}

function resetTranscriptPanel() {
  if (transcriptRequest) transcriptRequest.abort();
  transcriptRequest = null;
  elements["transcript-panel"].hidden = true;
  elements["transcript-toggle"].setAttribute("aria-expanded", "false");
  elements["transcript-toggle"].innerHTML = "Show transcript <span aria-hidden=\"true\">＋</span>";
  elements["transcript-content"].replaceChildren();
}

async function openTranscript() {
  if (!currentLesson) return;
  elements["transcript-panel"].hidden = false;
  elements["transcript-toggle"].setAttribute("aria-expanded", "true");
  elements["transcript-toggle"].innerHTML = "Hide transcript <span aria-hidden=\"true\">−</span>";

  if (transcriptCache.has(currentLesson.id)) {
    showTranscript(transcriptCache.get(currentLesson.id));
    return;
  }

  transcriptRequest?.abort();
  transcriptRequest = new AbortController();
  const requestedLessonId = currentLesson.id;
  elements["transcript-content"].replaceChildren(createElement("p", "transcript-loading", "Loading transcript…"));

  try {
    const response = await fetch(`/api/transcript?id=${requestedLessonId}`, { signal: transcriptRequest.signal });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Transcript could not be loaded.");
    transcriptCache.set(requestedLessonId, result);
    if (currentLesson?.id === requestedLessonId && !elements["transcript-panel"].hidden) showTranscript(result);
  } catch (error) {
    if (error.name === "AbortError") return;
    elements["transcript-content"].replaceChildren();
    const message = createElement("span", "transcript-error", error.message || "Transcript could not be loaded.");
    const retry = createElement("button", "transcript-retry", "Try again");
    retry.type = "button";
    retry.addEventListener("click", openTranscript, { once: true });
    elements["transcript-content"].append(message, retry);
  }
}

function closeLessonDrawer() {
  elements["lesson-sidebar"].classList.remove("is-open");
  elements["drawer-scrim"].classList.remove("is-visible");
  elements["menu-open"].setAttribute("aria-expanded", "false");
  elements["main-column"].inert = false;
  elements["lesson-sidebar"].inert = mobileViewport.matches;
  elements["lesson-sidebar"].setAttribute("aria-hidden", String(mobileViewport.matches));
  if (mobileViewport.matches) {
    elements["lesson-sidebar"].setAttribute("role", "dialog");
    elements["lesson-sidebar"].setAttribute("aria-modal", "true");
    elements["menu-open"].focus();
  } else {
    elements["lesson-sidebar"].setAttribute("role", "complementary");
    elements["lesson-sidebar"].removeAttribute("aria-modal");
  }
}

function openLessonDrawer() {
  if (!mobileViewport.matches) return;
  elements["lesson-sidebar"].classList.add("is-open");
  elements["drawer-scrim"].classList.add("is-visible");
  elements["menu-open"].setAttribute("aria-expanded", "true");
  elements["lesson-sidebar"].inert = false;
  elements["lesson-sidebar"].setAttribute("aria-hidden", "false");
  elements["lesson-sidebar"].setAttribute("role", "dialog");
  elements["lesson-sidebar"].setAttribute("aria-modal", "true");
  elements["main-column"].inert = true;
  elements["lesson-search"].focus();
}

function syncDrawerForViewport() {
  if (mobileViewport.matches) {
    if (!elements["lesson-sidebar"].classList.contains("is-open")) {
      elements["lesson-sidebar"].inert = true;
      elements["lesson-sidebar"].setAttribute("aria-hidden", "true");
      elements["lesson-sidebar"].setAttribute("role", "dialog");
      elements["lesson-sidebar"].setAttribute("aria-modal", "true");
    }
    return;
  }

  elements["lesson-sidebar"].classList.remove("is-open");
  elements["drawer-scrim"].classList.remove("is-visible");
  elements["lesson-sidebar"].inert = false;
  elements["lesson-sidebar"].setAttribute("aria-hidden", "false");
  elements["lesson-sidebar"].setAttribute("role", "complementary");
  elements["lesson-sidebar"].removeAttribute("aria-modal");
  elements["main-column"].inert = false;
  elements["menu-open"].setAttribute("aria-expanded", "false");
}

function moveLesson(offset, autoplay = false) {
  const nextLesson = findLesson(lessons, currentLesson.id + offset);
  if (nextLesson) selectLesson(nextLesson.id, { autoplay });
  else showToast(offset > 0 ? "You are at the last lesson." : "You are at the first lesson.");
}

elements["lesson-search"].addEventListener("input", renderLessonList);
elements["lesson-list"].addEventListener("click", event => {
  const button = event.target.closest("[data-lesson-id]");
  if (button) selectLesson(Number(button.dataset.lessonId));
});
elements["part-tabs"].addEventListener("click", event => {
  const button = event.target.closest("[data-part]");
  if (!button) return;
  currentPart = Number(button.dataset.part);
  for (const tab of elements["part-tabs"].querySelectorAll("[data-part]")) {
    const selected = tab === button;
    tab.classList.toggle("is-active", selected);
    tab.setAttribute("aria-pressed", String(selected));
  }
  renderLessonList();
});
elements["complete-button"].addEventListener("click", () => {
  const isCompleted = progress.toggleCompleted(currentLesson.id);
  updateCompleteButton();
  updateProgressSummary();
  renderLessonList();
  showToast(isCompleted ? "Lesson marked complete." : "Lesson marked incomplete.");
});
elements["play-button"].addEventListener("click", () => player.toggle());
elements["dock-play"].addEventListener("click", () => player.toggle());
elements["previous-button"].addEventListener("click", () => moveLesson(-1));
elements["next-button"].addEventListener("click", () => moveLesson(1));
elements["dock-previous"].addEventListener("click", () => moveLesson(-1));
elements["dock-next"].addEventListener("click", () => moveLesson(1));
elements["speed-select"].addEventListener("change", event => player.setSpeed(event.target.value));
elements["seek-slider"].addEventListener("input", event => player.seek(Number(event.target.value)));
elements["volume-slider"].addEventListener("input", event => player.setVolume(Number(event.target.value)));
elements["transcript-toggle"].addEventListener("click", () => {
  if (elements["transcript-panel"].hidden) openTranscript();
  else {
    elements["transcript-panel"].hidden = true;
    elements["transcript-toggle"].setAttribute("aria-expanded", "false");
    elements["transcript-toggle"].innerHTML = "Show transcript <span aria-hidden=\"true\">＋</span>";
  }
});
elements["menu-open"].addEventListener("click", openLessonDrawer);
elements["sidebar-close"].addEventListener("click", closeLessonDrawer);
elements["drawer-scrim"].addEventListener("click", closeLessonDrawer);
elements["dock-expand"].addEventListener("click", () => elements["audio-title"].scrollIntoView({ behavior: "smooth", block: "center" }));
document.addEventListener("keydown", event => {
  if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    elements["lesson-search"].focus();
  }
  const drawerOpen = elements["lesson-sidebar"].classList.contains("is-open");
  if (event.key === "Escape" && drawerOpen) {
    closeLessonDrawer();
    return;
  }

  if (event.key === "Tab" && drawerOpen) {
    const focusable = [...elements["lesson-sidebar"].querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )].filter(element => !element.hidden && element.getClientRects().length);
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
});

mobileViewport.addEventListener("change", syncDrawerForViewport);
syncDrawerForViewport();

async function initialize() {
  try {
    lessons = await loadLessons();
    progress = createProgressStore({ lessonIds: lessons.map(lesson => lesson.id) });
  } catch (error) {
    elements["lesson-title"].textContent = "Lessons unavailable";
    elements["lesson-subtitle"].textContent = error.message;
    elements["lesson-list"].replaceChildren(createElement("li", "lesson-empty", "Could not load the lesson catalog."));
    return;
  }

  const savedLessonId = progress.getProgress().currentLesson;
  currentLesson = findLesson(lessons, savedLessonId) ?? lessons[0];
  renderLesson(currentLesson);
  player.setSpeed(progress.getSpeed());
}

initialize();