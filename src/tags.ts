import type { Priority } from "./types";

const AUTO: Record<string, Priority> = {
  вуз: "iu",
  итс: "in",
  семья: "chaos",
  отдых: "nn",
};

function hashtagsIn(title: string) {
  return [...title.toLowerCase().matchAll(/#([a-zа-яё0-9_-]+)/gi)].map((m) => m[1].toLowerCase());
}

export function priorityFromHashtags(title: string): Priority | null {
  const tags = hashtagsIn(title);
  const set = new Set(tags);
  if (set.has("итс") && set.has("босс")) return "nu";
  for (const tag of tags) {
    const prio = AUTO[tag];
    if (prio) return prio;
  }
  return null;
}

export function resolvePriority(title: string, fallback: Priority): Priority {
  return priorityFromHashtags(title) ?? fallback;
}
