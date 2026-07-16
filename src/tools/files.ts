import { z } from "zod";
import { getClient, resolveChat } from "../lib/client.js";
import { chatField, parseModeField } from "../lib/fields.js";
import { summarizeMessage } from "../lib/serialize.js";

// ─── send_file ────────────────────────────────────────────────────────────────
const SendFileInput = z.object({
  chat: chatField,
  file: z
    .string()
    .min(1)
    .describe(
      "The file to send: an absolute local filesystem path, or an HTTP(S) URL that Telegram will download. Images are sent as photos unless force_document is true.",
    ),
  caption: z
    .string()
    .max(1024)
    .optional()
    .describe("Optional caption under the file, 0–1024 characters."),
  parse_mode: parseModeField,
  force_document: z
    .boolean()
    .optional()
    .describe(
      "When true, send images/media as an uncompressed file (document) instead of an inline photo/video.",
    ),
  silent: z
    .boolean()
    .optional()
    .describe("When true, sends without a notification sound."),
});

async function handleSendFile(input: z.infer<typeof SendFileInput>) {
  const client = await getClient();
  const message = await client.sendFile(resolveChat(input.chat), {
    file: input.file,
    caption: input.caption,
    parseMode: input.parse_mode,
    forceDocument: input.force_document,
    silent: input.silent,
  });
  return summarizeMessage(message);
}

export const SendFile = {
  name: "send_file",
  description:
    "Send a photo or document to a chat from your account. `file` may be a local path or a public URL. By default images go as inline photos; set force_document to preserve the original bytes uncompressed. Returns the sent message summary (with a media label). Telegram enforces a per-file size limit (~2 GB for user accounts).",
  input: SendFileInput,
  handler: handleSendFile,
};
