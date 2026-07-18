import { z } from "zod";
import { Api } from "telegram";
import { getClient } from "../lib/client.js";
import { validateChat } from "../utils/chat.js";
import { prompts } from "../lib/prompts.js";
import { annotate } from "../lib/register-tool.js";
import { idToString, summarizeMessage } from "../lib/serialize.js";
import { sanitizeName } from "../lib/sanitize.js";

// list_dialogs
const listDialogsPrompt = prompts.get("list_dialogs");
const ListDialogsInput = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(200)
    .optional()
    .describe(listDialogsPrompt.fields.limit.description),
});

async function handleListDialogs(input: z.infer<typeof ListDialogsInput>) {
  const client = await getClient();
  const dialogs = await client.getDialogs({ limit: input.limit ?? 30 });
  return dialogs.map((d) => ({
    id: idToString(d.id),
    name: d.name ? sanitizeName(d.name) : d.title ? sanitizeName(d.title) : null,
    type: d.isUser ? "user" : d.isChannel ? "channel" : "group",
    unread_count: d.unreadCount,
    pinned: Boolean(d.pinned),
    last_message: d.message ? summarizeMessage(d.message) : null,
  }));
}

export const ListDialogs = {
  name: listDialogsPrompt.name,
  description: listDialogsPrompt.description,
  input: ListDialogsInput,
  handler: handleListDialogs,
  annotations: annotate("List Dialogs", "read"),
};

// mute_chat / unmute_chat
// muteUntil = max int32 means "muted forever"; 0 clears the mute.
const MUTE_FOREVER = 2147483647;

async function setMute(chat: string | number | undefined, mute: boolean) {
  const client = await getClient();
  const peer = await client.getInputEntity(validateChat(chat));
  await client.invoke(
    new Api.account.UpdateNotifySettings({
      peer: new Api.InputNotifyPeer({ peer }),
      settings: new Api.InputPeerNotifySettings({
        muteUntil: mute ? MUTE_FOREVER : 0,
      }),
    }),
  );
}

const muteChatPrompt = prompts.get("mute_chat");
const MuteChatInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(muteChatPrompt.fields.chat.description),
});

async function handleMuteChat(input: z.infer<typeof MuteChatInput>) {
  await setMute(input.chat, true);
  return { muted: true };
}

export const MuteChat = {
  name: muteChatPrompt.name,
  description: muteChatPrompt.description,
  input: MuteChatInput,
  handler: handleMuteChat,
  annotations: annotate("Mute Chat", "write"),
};

const unmuteChatPrompt = prompts.get("unmute_chat");
const UnmuteChatInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(unmuteChatPrompt.fields.chat.description),
});

async function handleUnmuteChat(input: z.infer<typeof UnmuteChatInput>) {
  await setMute(input.chat, false);
  return { unmuted: true };
}

export const UnmuteChat = {
  name: unmuteChatPrompt.name,
  description: unmuteChatPrompt.description,
  input: UnmuteChatInput,
  handler: handleUnmuteChat,
  annotations: annotate("Unmute Chat", "write"),
};

// archive_chat / unarchive_chat
// Folder id 1 is the Archived Chats folder; 0 is the main list.
async function setFolder(chat: string | number | undefined, folderId: number) {
  const client = await getClient();
  const peer = await client.getInputEntity(validateChat(chat));
  await client.invoke(
    new Api.folders.EditPeerFolders({
      folderPeers: [new Api.InputFolderPeer({ peer, folderId })],
    }),
  );
}

const archiveChatPrompt = prompts.get("archive_chat");
const ArchiveChatInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(archiveChatPrompt.fields.chat.description),
});

async function handleArchiveChat(input: z.infer<typeof ArchiveChatInput>) {
  await setFolder(input.chat, 1);
  return { archived: true };
}

export const ArchiveChat = {
  name: archiveChatPrompt.name,
  description: archiveChatPrompt.description,
  input: ArchiveChatInput,
  handler: handleArchiveChat,
  annotations: annotate("Archive Chat", "write"),
};

const unarchiveChatPrompt = prompts.get("unarchive_chat");
const UnarchiveChatInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(unarchiveChatPrompt.fields.chat.description),
});

async function handleUnarchiveChat(input: z.infer<typeof UnarchiveChatInput>) {
  await setFolder(input.chat, 0);
  return { unarchived: true };
}

export const UnarchiveChat = {
  name: unarchiveChatPrompt.name,
  description: unarchiveChatPrompt.description,
  input: UnarchiveChatInput,
  handler: handleUnarchiveChat,
  annotations: annotate("Unarchive Chat", "write"),
};

// list_folders
const listFoldersPrompt = prompts.get("list_folders");
const ListFoldersInput = z.object({});

async function handleListFolders(_input: z.infer<typeof ListFoldersInput>) {
  const client = await getClient();
  const res = await client.invoke(new Api.messages.GetDialogFilters());
  const filters = (res as { filters?: unknown[] }).filters ?? [];
  return filters.map((f) => {
    const title = (f as { title?: unknown }).title;
    const titleText =
      typeof title === "string"
        ? title
        : (title as { text?: string })?.text ?? null;
    return {
      id: (f as { id?: number }).id ?? null,
      title: titleText ? sanitizeName(titleText) : null,
      type: (f as { className?: string }).className ?? null,
    };
  });
}

export const ListFolders = {
  name: listFoldersPrompt.name,
  description: listFoldersPrompt.description,
  input: ListFoldersInput,
  handler: handleListFolders,
  annotations: annotate("List Folders", "read"),
};
