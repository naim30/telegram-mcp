import { z } from "zod";

/** Reusable zod fields shared across the user-session Telegram tools. */

export const chatField = z
  .union([z.string(), z.number()])
  .optional()
  .describe(
    "Target chat/user. Accepts a @username (e.g. '@durov'), a numeric id, a string id, or the literal 'me' for your own Saved Messages. Numeric ids resolve reliably only after the entity has been seen this session (e.g. via list_dialogs) — prefer @username when possible. Optional: falls back to TELEGRAM_DEFAULT_CHAT when omitted.",
  );

export const parseModeField = z
  .enum(["md", "html"])
  .optional()
  .describe(
    "How to interpret formatting in the text: 'md' (Markdown) or 'html'. Omit to send as plain text.",
  );
