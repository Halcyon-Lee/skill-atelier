export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(value: string, style: "short" | "long" = "short"): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: style === "long" ? "long" : "short",
    day: "numeric",
  }).format(date);
}

export function formatRelative(value: string): string {
  const date = new Date(value).getTime();
  if (Number.isNaN(date)) return "—";

  const days = Math.floor((Date.now() - date) / 86_400_000);
  if (days <= 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 30) return `${days} 天前`;
  if (days < 365) return `${Math.floor(days / 30)} 个月前`;
  return `${Math.floor(days / 365)} 年前`;
}

export function initials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "A";

  const words = trimmed.split(/\s+/);
  if (words.length > 1) {
    return `${Array.from(words[0])[0] ?? ""}${Array.from(words[words.length - 1])[0] ?? ""}`.toUpperCase();
  }

  return Array.from(trimmed).slice(0, 2).join("").toUpperCase();
}

export function normalizeTags(input: string): string[] {
  const seen = new Set<string>();
  return input
    .split(/[,，、]/)
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter((tag) => {
      const key = tag.toLowerCase();
      if (!tag || seen.has(key) || tag.length > 24) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6);
}

export function parseTags(value: string): string[] {
  try {
    const tags = JSON.parse(value);
    return Array.isArray(tags) ? tags.filter((tag): tag is string => typeof tag === "string") : [];
  } catch {
    return [];
  }
}

export function avatarColorFor(seed: string): string {
  const colors = ["#d94f2b", "#4f6752", "#3b5b91", "#7a587d", "#806937", "#497074", "#913e44"];
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return colors[hash % colors.length];
}

export function pluralize(count: number, noun: string): string {
  return `${count} ${noun}`;
}
