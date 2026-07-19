import { z } from "zod";
import { Api } from "telegram";
import { getClient } from "../lib/client.js";
import { validateChat } from "../utils/chat.js";
import { prompts } from "../lib/prompts.js";
import { annotate } from "../lib/register-tool.js";
import { summarizeMessage } from "../lib/serialize.js";
import { sanitizeLine } from "../lib/sanitize.js";

// list_dialogs
const listDialogsPrompt = prompts.get("list_dialogs");
const ListDialogsInput = z.object({
  limit: z
    .number()
    .int()
    .default(20)
    .describe(listDialogsPrompt.fields.limit.description),
});

async function handleListDialogs(input: z.infer<typeof ListDialogsInput>) {
  const client = await getClient();
  const response = await client.getDialogs({
    limit: input.limit,
  });
  return response.map((item) => ({
    id: item.id ? String(item.id) : null,
    type: item.entity?.className,
    name: item.name ? sanitizeLine(item.name) : null,
    unread_count: item.unreadCount,
    pinned: Boolean(item.pinned),
    message: item.message ? summarizeMessage(item.message) : null,
  }));
}

export const ListDialogs = {
  name: listDialogsPrompt.name,
  description: listDialogsPrompt.description,
  input: ListDialogsInput,
  handler: handleListDialogs,
  annotations: annotate("List Dialogs", "read"),
};

// mute_chat
const muteChatPrompt = prompts.get("mute_chat");
const MuteChatInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(muteChatPrompt.fields.chat.description),
});

async function handleMuteChat(input: z.infer<typeof MuteChatInput>) {
  const client = await getClient();
  const peer = await client.getInputEntity(validateChat(input.chat));
  await client.invoke(
    new Api.account.UpdateNotifySettings({
      peer: new Api.InputNotifyPeer({ peer }),
      settings: new Api.InputPeerNotifySettings({
        muteUntil: 2147483647,
      }),
    }),
  );
  return { muted: true };
}

export const MuteChat = {
  name: muteChatPrompt.name,
  description: muteChatPrompt.description,
  input: MuteChatInput,
  handler: handleMuteChat,
  annotations: annotate("Mute Chat", "write"),
};

// unmute_chat
const unmuteChatPrompt = prompts.get("unmute_chat");
const UnmuteChatInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(unmuteChatPrompt.fields.chat.description),
});

async function handleUnmuteChat(input: z.infer<typeof UnmuteChatInput>) {
  const client = await getClient();
  const peer = await client.getInputEntity(validateChat(input.chat));
  await client.invoke(
    new Api.account.UpdateNotifySettings({
      peer: new Api.InputNotifyPeer({ peer }),
      settings: new Api.InputPeerNotifySettings({
        muteUntil: 0,
      }),
    }),
  );
  return { unmuted: true };
}

export const UnmuteChat = {
  name: unmuteChatPrompt.name,
  description: unmuteChatPrompt.description,
  input: UnmuteChatInput,
  handler: handleUnmuteChat,
  annotations: annotate("Unmute Chat", "write"),
};

// archive_chat
const archiveChatPrompt = prompts.get("archive_chat");
const ArchiveChatInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(archiveChatPrompt.fields.chat.description),
});

async function handleArchiveChat(input: z.infer<typeof ArchiveChatInput>) {
  const client = await getClient();
  const peer = await client.getInputEntity(validateChat(input.chat));
  await client.invoke(
    new Api.folders.EditPeerFolders({
      folderPeers: [
        new Api.InputFolderPeer({
          peer,
          folderId: 1,
        }),
      ],
    }),
  );
  return { archived: true };
}

export const ArchiveChat = {
  name: archiveChatPrompt.name,
  description: archiveChatPrompt.description,
  input: ArchiveChatInput,
  handler: handleArchiveChat,
  annotations: annotate("Archive Chat", "write"),
};

// unarchive_chat
const unarchiveChatPrompt = prompts.get("unarchive_chat");
const UnarchiveChatInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(unarchiveChatPrompt.fields.chat.description),
});

async function handleUnarchiveChat(input: z.infer<typeof UnarchiveChatInput>) {
  const client = await getClient();
  const peer = await client.getInputEntity(validateChat(input.chat));
  await client.invoke(
    new Api.folders.EditPeerFolders({
      folderPeers: [
        new Api.InputFolderPeer({
          peer,
          folderId: 0,
        }),
      ],
    }),
  );
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
  const response = await client.invoke(new Api.messages.GetDialogFilters());
  const folders = response.filters || [];
  return folders.map((item) => {
    const folder = item as any;
    return {
      id: folder.id || null,
      title: folder.title?.text ? sanitizeLine(folder.title?.text) : null,
      type: folder.className || null,
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
