import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getValidEmoji(emojiUrl, defaultEmoji = "📦") {
  if (!emojiUrl || emojiUrl === "string" || emojiUrl === "strring") {
    return defaultEmoji;
  }
  return emojiUrl;
}
