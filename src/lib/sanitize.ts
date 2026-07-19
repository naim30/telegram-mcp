const controlChar = /[\p{Cc}\p{Cf}]/u;

const hiddenCharArr = [
  [0x200b, 0x200f], // zero-width space, ZWNJ, ZWJ, LRM, RLM
  [0x2028, 0x2029], // line separator, paragraph separator
  [0x202a, 0x202e], // bidi embedding / override
  [0x2060, 0x2064], // word joiner, invisible operators
  [0xfeff, 0xfeff], // zero-width no-break space / BOM
  [0xfff9, 0xfffb], // interlinear annotation anchors
];
const hiddenChar = new Set();
for (const [from, to] of hiddenCharArr) {
  for (let ch = from; ch <= to; ch++) {
    hiddenChar.add(String.fromCharCode(ch));
  }
}

function filterChar(text: string): string {
  let out = "";
  for (const ch of text) {
    if (ch === "\n" || ch === "\t") {
      out += ch;
    } else if (controlChar.test(ch) || hiddenChar.has(ch)) {
    } else {
      out += ch;
    }
  }
  return out;
}

export function sanitizeText(text: unknown, maxLength = 4096): string {
  if (typeof text !== "string" || text.length === 0) {
    return "[empty]";
  }
  let out = filterChar(text)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!out) {
    return "[empty]";
  }
  if (out.length > maxLength) {
    out = out.slice(0, maxLength) + "... [truncated]";
  }
  return out;
}

export function sanitizeLine(text: unknown, maxLength = 256): string {
  const out = sanitizeText(text, maxLength)
    .replace(/[\n\r]/g, " ")
    .replace(/ {2,}/g, " ")
    .trim();
  return out;
}
