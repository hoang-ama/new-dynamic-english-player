export const PARTS = [
  { id: 1, label: "Part 1", first: 1, last: 100 },
  { id: 2, label: "Part 2", first: 101, last: 200 },
  { id: 3, label: "Part 3", first: 201, last: 300 },
  { id: 4, label: "Part 4", first: 301, last: 340 }
];

export async function loadLessons(url = "/data/lessons.json", fetchImpl = fetch) {
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`Lesson data could not be loaded (${response.status})`);

  const manifest = await response.json();
  if (!Array.isArray(manifest.lessons) || manifest.lessons.length !== 340) {
    throw new Error("Lesson data is incomplete or malformed");
  }

  const lessons = [...manifest.lessons].sort((first, second) => first.id - second.id);
  const ids = new Set(lessons.map(lesson => lesson.id));
  if (ids.size !== 340 || lessons.some((lesson, index) => lesson.id !== index + 1)) {
    throw new Error("Lesson data must contain each lesson ID from 1 to 340 exactly once");
  }

  return lessons;
}

export function findLesson(lessons, id) {
  return lessons.find(lesson => lesson.id === Number(id)) ?? null;
}

export function searchLessons(lessons, query = "", part = 0) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const exactLessonId = /^\d+$/.test(normalizedQuery) ? Number(normalizedQuery) : null;
  return lessons.filter(lesson => {
    if (part && lesson.part !== part) return false;
    if (!normalizedQuery) return true;
    if (exactLessonId !== null) return lesson.id === exactLessonId;

    const searchableText = `${lesson.part} ${lesson.title}`.toLocaleLowerCase();
    return searchableText.includes(normalizedQuery);
  });
}