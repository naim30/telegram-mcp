import { z } from "zod";
import { Api } from "telegram";
import bigInt from "big-integer";
import { mkdir, stat } from "node:fs/promises";
import { dirname, isAbsolute, join } from "node:path";
import { getClient } from "../lib/client.js";
import { validateChat } from "../utils/chat.js";
import { rootPath } from "../config/config.js";
import { ParseMode } from "../constants.js";
import { prompts } from "../lib/prompts.js";
import { annotate } from "../lib/register-tool.js";
import { mediaLabel, summarizeMessage } from "../lib/serialize.js";
import { sanitizeName } from "../lib/sanitize.js";

// send_file
const sendFilePrompt = prompts.get("send_file");
const f = sendFilePrompt.fields;
const SendFileInput = z.object({
  chat: z.union([z.string(), z.number()]).describe(sendFilePrompt.fields.chat.description),
  file: z.string().min(1).describe(f.file.description),
  caption: z.string().max(1024).optional().describe(f.caption.description),
  parse_mode: z.enum(ParseMode).optional().describe(sendFilePrompt.fields.parse_mode.description),
  force_document: z.boolean().optional().describe(f.force_document.description),
  supports_streaming: z
    .boolean()
    .optional()
    .describe(f.supports_streaming.description),
  voice_note: z.boolean().optional().describe(f.voice_note.description),
  video_note: z.boolean().optional().describe(f.video_note.description),
  reply_to: z.number().int().optional().describe(f.reply_to.description),
  silent: z.boolean().optional().describe(f.silent.description),
});

async function handleSendFile(input: z.infer<typeof SendFileInput>) {
  const client = await getClient();
  const message = await client.sendFile(validateChat(input.chat), {
    file: input.file,
    caption: input.caption,
    parseMode: input.parse_mode,
    forceDocument: input.force_document,
    supportsStreaming: input.supports_streaming,
    voiceNote: input.voice_note,
    videoNote: input.video_note,
    replyTo: input.reply_to,
    silent: input.silent,
  });
  return summarizeMessage(message);
}

export const SendFile = {
  name: sendFilePrompt.name,
  description: sendFilePrompt.description,
  input: SendFileInput,
  handler: handleSendFile,
  annotations: annotate("Send File", "write"),
};

// download_media
const downloadMediaPrompt = prompts.get("download_media");
const DownloadMediaInput = z.object({
  chat: z.union([z.string(), z.number()]).describe(downloadMediaPrompt.fields.chat.description),
  message_id: z
    .number()
    .int()
    .describe(downloadMediaPrompt.fields.message_id.description),
  output_path: z
    .string()
    .min(1)
    .optional()
    .describe(downloadMediaPrompt.fields.output_path.description),
});

/** A reasonable default filename for a message's media. */
function defaultFileName(msg: Api.Message): string {
  const media = msg.media;
  if (media?.className === "MessageMediaPhoto") return `photo_${msg.id}.jpg`;
  if (media?.className === "MessageMediaDocument") {
    const doc = (media as Api.MessageMediaDocument).document as
      | Api.Document
      | undefined;
    const nameAttr = doc?.attributes?.find(
      (a) => a.className === "DocumentAttributeFilename",
    ) as Api.DocumentAttributeFilename | undefined;
    if (nameAttr?.fileName) return nameAttr.fileName;
  }
  return `media_${msg.id}`;
}

async function handleDownloadMedia(input: z.infer<typeof DownloadMediaInput>) {
  const client = await getClient();
  const [msg] = await client.getMessages(validateChat(input.chat), {
    ids: input.message_id,
  });
  if (!msg || !msg.media) {
    return { downloaded: false, reason: "message has no downloadable media" };
  }

  const outPath =
    input.output_path && isAbsolute(input.output_path)
      ? input.output_path
      : join(rootPath, "downloads", input.output_path ?? defaultFileName(msg));
  await mkdir(dirname(outPath), { recursive: true });

  await client.downloadMedia(msg, { outputFile: outPath });
  const { size } = await stat(outPath);
  return {
    downloaded: true,
    path: outPath,
    bytes: size,
    media_type: mediaLabel(msg) || "media",
  };
}

export const DownloadMedia = {
  name: downloadMediaPrompt.name,
  description: downloadMediaPrompt.description,
  input: DownloadMediaInput,
  handler: handleDownloadMedia,
  annotations: annotate("Download Media", "write"),
};

// get_sticker_sets
const getStickerSetsPrompt = prompts.get("get_sticker_sets");
const GetStickerSetsInput = z.object({});

async function handleGetStickerSets(_input: z.infer<typeof GetStickerSetsInput>) {
  const client = await getClient();
  const res = await client.invoke(
    new Api.messages.GetAllStickers({ hash: bigInt(0) }),
  );
  if (res.className === "messages.AllStickersNotModified") {
    return { count: 0, sets: [] };
  }
  const sets = (res as Api.messages.AllStickers).sets;
  return {
    count: sets.length,
    sets: sets.map((s) => ({
      id: String(s.id),
      title: sanitizeName(s.title),
      short_name: s.shortName,
      count: s.count,
    })),
  };
}

export const GetStickerSets = {
  name: getStickerSetsPrompt.name,
  description: getStickerSetsPrompt.description,
  input: GetStickerSetsInput,
  handler: handleGetStickerSets,
  annotations: annotate("Get Sticker Sets", "read"),
};
