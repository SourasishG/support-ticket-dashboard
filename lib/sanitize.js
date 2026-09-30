// lib/sanitize.js
// Lightweight HTML sanitizer. Strips all tags except safe inline formatting.
// Does NOT use dangerouslySetInnerHTML — returns plain text.

const TAG_RE = /<\/?[^>]+(>|$)/g;

export function stripHtml(raw) {
  if (!raw || typeof raw !== "string") return "";
  return raw.replace(TAG_RE, "").trim();
}

export function isSafeUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isRtlText(text) {
  if (!text || typeof text !== "string") return false;
  // Matches Arabic, Hebrew, Syriac, Thaana, NKo, Samaritan, Mandaic, etc.
  const rtlRegex = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  return rtlRegex.test(text);
}

