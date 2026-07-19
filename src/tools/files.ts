import { z } from "zod";
import { Api } from "telegram";
import { getExtension } from "telegram/Utils.js";
import bigInt from "big-integer";
import { mkdir } from "node:fs/promises";
import { dirname, isAbsolute, join } from "node:path";
import { getClient } from "../lib/client.js";
import { validateChat } from "../utils/chat.js";
import { rootPath } from "../config/config.js";
import { ParseMode } from "../constants.js";
import { prompts } from "../lib/prompts.js";
import { annotate } from "../lib/register-tool.js";
import { summarizeMessage } from "../lib/serialize.js";
import { sanitizeLine } from "../lib/sanitize.js";

// send_file
const sendFilePrompt = prompts.get("send_file");
const f = sendFilePrompt.fields;
const SendFileInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(sendFilePrompt.fields.chat.description),
  file: z.string().min(1).describe(f.file.description),
  caption: z.string().max(1024).optional().describe(f.caption.description),
  parse_mode: z
    .enum(ParseMode)
    .optional()
    .describe(sendFilePrompt.fields.parse_mode.description),
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
  chat: z
    .union([z.string(), z.number()])
    .describe(downloadMediaPrompt.fields.chat.description),
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

function defaultFileName(msg: Api.Message): string {
  const ext = getExtension(msg.media);
  const dotExt = ext && !ext.startsWith(".") ? `.${ext}` : ext;
  return `media_${msg.id}${dotExt}`;
}

async function handleDownloadMedia(input: z.infer<typeof DownloadMediaInput>) {
  const client = await getClient();
  const [msg] = await client.getMessages(validateChat(input.chat), {
    ids: input.message_id,
  });
  if (!msg || !msg.media) {
    return {
      downloaded: false,
      reason: "error: no downloadable media found",
    };
  }

  const filename = defaultFileName(msg);
  let outPath;
  if (input.output_path && isAbsolute(input.output_path)) {
    outPath = input.output_path;
  } else {
    outPath = join(rootPath, "downloads", input.output_path || filename);
  }
  await mkdir(dirname(outPath), { recursive: true });

  await client.downloadMedia(msg, { outputFile: outPath });
  return {
    downloaded: true,
    type: msg.media.className,
    path: outPath,
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

async function handleGetStickerSets(
  _input: z.infer<typeof GetStickerSetsInput>,
) {
  const client = await getClient();
  const response = await client.invoke(
    new Api.messages.GetAllStickers({
      hash: bigInt(0),
    }),
  );
  if (response.className === "messages.AllStickersNotModified") {
    return { sets: [], count: 0 };
  }
  const sets = response.sets || [];
  return {
    count: sets.length,
    sets: sets.map((s) => ({
      id: String(s.id),
      title: sanitizeLine(s.title),
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
