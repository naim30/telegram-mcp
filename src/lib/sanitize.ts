/**
 * Sanitize user-controlled Telegram content before returning it in tool
 * results. Message text, names, and titles are attacker-controlled — a
 * malicious message could try to smuggle instructions to the LLM consuming the
 * output. Two layers defend against this:
 *   1. Structural: tool results are JSON, so user content lives inside string
 *      values and can't be confused with field names or instructions.
 *   2. Content (this module): strip control / zero-width characters, collapse
 *      runaway newlines, and truncate — defence-in-depth inside the JSON value.
 * Adapted from the Telethon-based telegram-mcp (chigwell/telegram-mcp).
 */

const EXCESSIVE_NEWLINES = /\n{3,}/g;

// Zero-width / invisible code points that can hide content or reorder text.
// Built numerically so no literal invisible characters appear in the source.
const INVISIBLE_CODE_POINTS = new Set<string>();
for (const [from, to] of [
  [0x200b, 0x200f], // zero-width space, ZWNJ, ZWJ, LRM, RLM
  [0x2028, 0x2029], // line separator, paragraph separator
  [0x202a, 0x202e], // bidi embedding / override
  [0x2060, 0x2064], // word joiner, invisible operators
  [0xfeff, 0xfeff], // zero-width no-break space / BOM
  [0xfff9, 0xfffb], // interlinear annotation anchors
] as const) {
  for (let c = from; c <= to; c++) INVISIBLE_CODE_POINTS.add(String.fromCharCode(c));
}

const CONTROL_OR_FORMAT = /[\p{Cc}\p{Cf}]/u;

/**
 * Strip Unicode control (Cc), format (Cf), and known invisible characters,
 * keeping only newline and tab from the control range.
 */
function stripHidden(text: string): string {
  let out = "";
  for (const ch of text) {
    if (ch === "\n" || ch === "\t") {
      out += ch;
    } else if (CONTROL_OR_FORMAT.test(ch) || INVISIBLE_CODE_POINTS.has(ch)) {
      // drop it
    } else {
      out += ch;
    }
  }
  return out;
}

/** Sanitize free-form text (message bodies, captions). */
export function sanitizeText(text: unknown, maxLength = 4096): string {
  if (typeof text !== "string" || text.length === 0) return "[empty]";

  let result = stripHidden(text).replace(EXCESSIVE_NEWLINES, "\n\n").trim();

  if (!result) return "[empty]";
  if (result.length > maxLength) {
    result = result.slice(0, maxLength) + "... [truncated]";
  }
  return result;
}

/** Sanitize a single-line display name (username, chat title, sender name). */
export function sanitizeName(text: unknown, maxLength = 256): string {
  return sanitizeText(text, maxLength)
    .replace(/[\n\r]/g, " ")
    .replace(/ {2,}/g, " ")
    .trim();
}
