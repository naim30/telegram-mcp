import { z } from "zod";
import { Api } from "telegram";
import { getClient } from "../lib/client.js";
import { validateChat } from "../utils/chat.js";
import { prompts } from "../lib/prompts.js";
import { annotate } from "../lib/register-tool.js";
import { summarizeEntity } from "../lib/serialize.js";

// list_participants
const listParticipantsPrompt = prompts.get("list_participants");
const ListParticipantsInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(listParticipantsPrompt.fields.chat.description),
  search: z
    .string()
    .default("")
    .describe(listParticipantsPrompt.fields.search.description),
  limit: z
    .number()
    .int()
    .default(20)
    .describe(listParticipantsPrompt.fields.limit.description),
});

async function handleListParticipants(
  input: z.infer<typeof ListParticipantsInput>,
) {
  const client = await getClient();
  const participants = await client.getParticipants(validateChat(input.chat), {
    limit: input.limit,
    search: input.search,
  });
  return {
    participants: participants.map((p) => summarizeEntity(p)),
    total: participants.total || participants.length,
  };
}

export const ListParticipants = {
  name: listParticipantsPrompt.name,
  description: listParticipantsPrompt.description,
  input: ListParticipantsInput,
  handler: handleListParticipants,
  annotations: annotate("List Participants", "read"),
};

// get_admins
const getAdminsPrompt = prompts.get("get_admins");
const GetAdminsInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(getAdminsPrompt.fields.chat.description),
  limit: z
    .number()
    .int()
    .default(20)
    .describe(getAdminsPrompt.fields.limit.description),
});

async function handleGetAdmins(input: z.infer<typeof GetAdminsInput>) {
  const client = await getClient();
  const admins = await client.getParticipants(validateChat(input.chat), {
    filter: new Api.ChannelParticipantsAdmins(),
    limit: input.limit,
  });
  return {
    admins: admins.map((a) => summarizeEntity(a)),
    total: admins.total || admins.length,
  };
}

export const GetAdmins = {
  name: getAdminsPrompt.name,
  description: getAdminsPrompt.description,
  input: GetAdminsInput,
  handler: handleGetAdmins,
  annotations: annotate("Get Admins", "read"),
};

// join_chat
const joinChatPrompt = prompts.get("join_chat");
const JoinChatInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(joinChatPrompt.fields.chat.description),
});

async function handleJoinChat(input: z.infer<typeof JoinChatInput>) {
  const client = await getClient();
  const raw = String(input.chat);
  // Private invites arrive as t.me/+HASH, t.me/joinchat/HASH, or a bare +HASH.
  const invite = raw.match(/(?:t\.me\/\+|t\.me\/joinchat\/|^\+)([\w-]+)/i);
  let response;
  if (invite) {
    response = await client.invoke(
      new Api.messages.ImportChatInvite({ hash: invite[1] }),
    );
  } else {
    response = await client.invoke(
      new Api.channels.JoinChannel({ channel: raw }),
    );
  }
  return { joined: true };
}

export const JoinChat = {
  name: joinChatPrompt.name,
  description: joinChatPrompt.description,
  input: JoinChatInput,
  handler: handleJoinChat,
  annotations: annotate("Join Chat", "write"),
};

// leave_chat
const leaveChatPrompt = prompts.get("leave_chat");
const LeaveChatInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(leaveChatPrompt.fields.chat.description),
});

async function handleLeaveChat(input: z.infer<typeof LeaveChatInput>) {
  const client = await getClient();
  const entity = await client.getEntity(input.chat);
  if (entity.className === "Chat") {
    await client.invoke(
      new Api.messages.DeleteChatUser({
        chatId: (entity as Api.Chat).id,
        userId: "me",
      }),
    );
  } else {
    await client.invoke(
      new Api.channels.LeaveChannel({
        channel: entity,
      }),
    );
  }
  return { left: true };
}

export const LeaveChat = {
  name: leaveChatPrompt.name,
  description: leaveChatPrompt.description,
  input: LeaveChatInput,
  handler: handleLeaveChat,
  annotations: annotate("Leave Chat", "write"),
};

// set_slow_mode
const setSlowModePrompt = prompts.get("set_slow_mode");
const SetSlowModeInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(setSlowModePrompt.fields.chat.description),
  seconds: z
    .number()
    .int()
    .describe(setSlowModePrompt.fields.seconds.description),
});

async function handleSetSlowMode(input: z.infer<typeof SetSlowModeInput>) {
  const client = await getClient();
  await client.invoke(
    new Api.channels.ToggleSlowMode({
      channel: validateChat(input.chat),
      seconds: input.seconds,
    }),
  );
  return { slow_mode_seconds: input.seconds };
}

export const SetSlowMode = {
  name: setSlowModePrompt.name,
  description: setSlowModePrompt.description,
  input: SetSlowModeInput,
  handler: handleSetSlowMode,
  annotations: annotate("Set Slow Mode", "write"),
};

// export_chat_invite
const exportChatInvitePrompt = prompts.get("export_chat_invite");
const ExportChatInviteInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(exportChatInvitePrompt.fields.chat.description),
});

async function handleExportChatInvite(
  input: z.infer<typeof ExportChatInviteInput>,
) {
  const client = await getClient();
  const response = await client.invoke(
    new Api.messages.ExportChatInvite({
      peer: validateChat(input.chat),
    }),
  );
  const invite = response as Api.ChatInviteExported;
  return { link: invite.link };
}

export const ExportChatInvite = {
  name: exportChatInvitePrompt.name,
  description: exportChatInvitePrompt.description,
  input: ExportChatInviteInput,
  handler: handleExportChatInvite,
  annotations: annotate("Export Chat Invite", "write"),
};
