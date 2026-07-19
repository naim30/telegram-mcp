import { z } from "zod";
import { Api } from "telegram";
import bigInt from "big-integer";
import { getClient } from "../lib/client.js";
import { validateChat } from "../utils/chat.js";
import { ParseMode } from "../constants.js";
import { prompts } from "../lib/prompts.js";
import { annotate } from "../lib/register-tool.js";
import { summarizeMessage } from "../lib/serialize.js";

// get_messages
const getMessagesPrompt = prompts.get("get_messages");
const GetMessagesInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(getMessagesPrompt.fields.chat.description),
  limit: z
    .number()
    .int()
    .default(20)
    .describe(getMessagesPrompt.fields.limit.description),
  offset_id: z
    .number()
    .int()
    .default(0)
    .describe(getMessagesPrompt.fields.offset_id.description),
});

async function handleGetMessages(input: z.infer<typeof GetMessagesInput>) {
  const client = await getClient();
  const messages = await client.getMessages(validateChat(input.chat), {
    limit: input.limit,
    offsetId: input.offset_id,
  });
  return messages.map(summarizeMessage);
}

export const GetMessages = {
  name: getMessagesPrompt.name,
  description: getMessagesPrompt.description,
  input: GetMessagesInput,
  handler: handleGetMessages,
  annotations: annotate("Get Messages", "read"),
};

// search_messages
const searchMessagesPrompt = prompts.get("search_messages");
const SearchMessagesInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(searchMessagesPrompt.fields.chat.description),
  search: z
    .string()
    .min(1)
    .describe(searchMessagesPrompt.fields.search.description),
  limit: z
    .number()
    .int()
    .default(20)
    .describe(searchMessagesPrompt.fields.limit.description),
});

async function handleSearchMessages(
  input: z.infer<typeof SearchMessagesInput>,
) {
  const client = await getClient();
  const messages = await client.getMessages(validateChat(input.chat), {
    search: input.search,
    limit: input.limit,
  });
  return messages.map(summarizeMessage);
}

export const SearchMessages = {
  name: searchMessagesPrompt.name,
  description: searchMessagesPrompt.description,
  input: SearchMessagesInput,
  handler: handleSearchMessages,
  annotations: annotate("Search Messages", "read"),
};

// send_message
const sendMessagePrompt = prompts.get("send_message");
const SendMessageInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(sendMessagePrompt.fields.chat.description),
  text: z.string().describe(sendMessagePrompt.fields.text.description),
  parse_mode: z
    .enum(ParseMode)
    .optional()
    .describe(sendMessagePrompt.fields.parse_mode.description),
  reply_to: z
    .number()
    .int()
    .optional()
    .describe(sendMessagePrompt.fields.reply_to.description),
  silent: z
    .boolean()
    .optional()
    .describe(sendMessagePrompt.fields.silent.description),
  schedule: z
    .number()
    .int()
    .optional()
    .describe(sendMessagePrompt.fields.schedule.description),
});

async function handleSendMessage(input: z.infer<typeof SendMessageInput>) {
  const client = await getClient();
  const message = await client.sendMessage(validateChat(input.chat), {
    message: input.text,
    parseMode: input.parse_mode,
    replyTo: input.reply_to,
    silent: input.silent,
    schedule: input.schedule,
  });
  return summarizeMessage(message);
}

export const SendMessage = {
  name: sendMessagePrompt.name,
  description: sendMessagePrompt.description,
  input: SendMessageInput,
  handler: handleSendMessage,
  annotations: annotate("Send Message", "write"),
};

// edit_message
const editMessagePrompt = prompts.get("edit_message");
const EditMessageInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(editMessagePrompt.fields.chat.description),
  message_id: z
    .number()
    .int()
    .describe(editMessagePrompt.fields.message_id.description),
  text: z.string().describe(editMessagePrompt.fields.text.description),
  parse_mode: z
    .enum(ParseMode)
    .optional()
    .describe(editMessagePrompt.fields.parse_mode.description),
});

async function handleEditMessage(input: z.infer<typeof EditMessageInput>) {
  const client = await getClient();
  const message = await client.editMessage(validateChat(input.chat), {
    message: input.message_id,
    text: input.text,
    parseMode: input.parse_mode,
  });
  return summarizeMessage(message);
}

export const EditMessage = {
  name: editMessagePrompt.name,
  description: editMessagePrompt.description,
  input: EditMessageInput,
  handler: handleEditMessage,
  annotations: annotate("Edit Message", "write"),
};

// delete_message
const deleteMessagePrompt = prompts.get("delete_message");
const DeleteMessageInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(deleteMessagePrompt.fields.chat.description),
  message_ids: z
    .array(z.number().int())
    .min(1)
    .describe(deleteMessagePrompt.fields.message_ids.description),
  revoke: z
    .boolean()
    .default(true)
    .describe(deleteMessagePrompt.fields.revoke.description),
});

async function handleDeleteMessage(input: z.infer<typeof DeleteMessageInput>) {
  const client = await getClient();
  await client.deleteMessages(validateChat(input.chat), input.message_ids, {
    revoke: input.revoke,
  });
  return { deleted: true };
}

export const DeleteMessage = {
  name: deleteMessagePrompt.name,
  description: deleteMessagePrompt.description,
  input: DeleteMessageInput,
  handler: handleDeleteMessage,
  annotations: annotate("Delete Message", "write", { destructive: true }),
};

// forward_message
const forwardMessagePrompt = prompts.get("forward_message");
const ForwardMessageInput = z.object({
  to: z
    .union([z.string(), z.number()])
    .describe(forwardMessagePrompt.fields.to.description),
  from: z
    .union([z.string(), z.number()])
    .describe(forwardMessagePrompt.fields.from.description),
  message_ids: z
    .array(z.number().int())
    .min(1)
    .describe(forwardMessagePrompt.fields.message_ids.description),
  silent: z
    .boolean()
    .optional()
    .describe(forwardMessagePrompt.fields.silent.description),
});

async function handleForwardMessage(
  input: z.infer<typeof ForwardMessageInput>,
) {
  const client = await getClient();
  const messages = await client.forwardMessages(input.to, {
    messages: input.message_ids,
    fromPeer: input.from,
    silent: input.silent,
  });
  return messages.map(summarizeMessage);
}

export const ForwardMessage = {
  name: forwardMessagePrompt.name,
  description: forwardMessagePrompt.description,
  input: ForwardMessageInput,
  handler: handleForwardMessage,
  annotations: annotate("Forward Message", "write"),
};

// mark_read
const markReadPrompt = prompts.get("mark_read");
const MarkReadInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(markReadPrompt.fields.chat.description),
});

async function handleMarkRead(input: z.infer<typeof MarkReadInput>) {
  const client = await getClient();
  const response = await client.markAsRead(validateChat(input.chat));
  return { marked_read: response };
}

export const MarkRead = {
  name: markReadPrompt.name,
  description: markReadPrompt.description,
  input: MarkReadInput,
  handler: handleMarkRead,
  annotations: annotate("Mark as Read", "write"),
};

// send_reaction
const sendReactionPrompt = prompts.get("send_reaction");
const SendReactionInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(sendReactionPrompt.fields.chat.description),
  message_id: z
    .number()
    .int()
    .describe(sendReactionPrompt.fields.message_id.description),
  emoji: z
    .string()
    .min(1)
    .optional()
    .describe(sendReactionPrompt.fields.emoji.description),
  big: z
    .boolean()
    .optional()
    .describe(sendReactionPrompt.fields.big.description),
});

async function handleSendReaction(input: z.infer<typeof SendReactionInput>) {
  const client = await getClient();
  await client.invoke(
    new Api.messages.SendReaction({
      peer: validateChat(input.chat),
      msgId: input.message_id,
      reaction: input.emoji
        ? [new Api.ReactionEmoji({ emoticon: input.emoji })]
        : [],
      big: input.big,
    }),
  );
  return {
    message_id: input.message_id,
    emoji: input.emoji || null,
    removed: !input.emoji,
  };
}

export const SendReaction = {
  name: sendReactionPrompt.name,
  description: sendReactionPrompt.description,
  input: SendReactionInput,
  handler: handleSendReaction,
  annotations: annotate("Send Reaction", "write"),
};

// save_draft
const saveDraftPrompt = prompts.get("save_draft");
const SaveDraftInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(saveDraftPrompt.fields.chat.description),
  text: z.string().max(4096).describe(saveDraftPrompt.fields.text.description),
  reply_to: z
    .number()
    .int()
    .optional()
    .describe(saveDraftPrompt.fields.reply_to.description),
});

async function handleSaveDraft(input: z.infer<typeof SaveDraftInput>) {
  const client = await getClient();
  await client.invoke(
    new Api.messages.SaveDraft({
      peer: validateChat(input.chat),
      message: input.text,
      replyTo: input.reply_to
        ? new Api.InputReplyToMessage({ replyToMsgId: input.reply_to })
        : undefined,
    }),
  );
  return { saved: true };
}

export const SaveDraft = {
  name: saveDraftPrompt.name,
  description: saveDraftPrompt.description,
  input: SaveDraftInput,
  handler: handleSaveDraft,
  annotations: annotate("Save Draft", "write"),
};

// search_global
const searchGlobalPrompt = prompts.get("search_global");
const SearchGlobalInput = z.object({
  query: z
    .string()
    .min(1)
    .describe(searchGlobalPrompt.fields.query.description),
  limit: z
    .number()
    .int()
    .default(20)
    .describe(searchGlobalPrompt.fields.limit.description),
});

async function handleSearchGlobal(input: z.infer<typeof SearchGlobalInput>) {
  const client = await getClient();
  const response = await client.invoke(
    new Api.messages.SearchGlobal({
      q: input.query,
      filter: new Api.InputMessagesFilterEmpty(),
      minDate: 0,
      maxDate: 0,
      offsetRate: 0,
      offsetPeer: new Api.InputPeerEmpty(),
      offsetId: 0,
      limit: input.limit,
    }),
  );
  const messages = (response as { messages?: Api.Message[] }).messages || [];
  return messages.map(summarizeMessage);
}

export const SearchGlobal = {
  name: searchGlobalPrompt.name,
  description: searchGlobalPrompt.description,
  input: SearchGlobalInput,
  handler: handleSearchGlobal,
  annotations: annotate("Search Global", "read"),
};

// pin_message
const pinMessagePrompt = prompts.get("pin_message");
const PinMessageInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(pinMessagePrompt.fields.chat.description),
  message_id: z
    .number()
    .int()
    .describe(pinMessagePrompt.fields.message_id.description),
  notify: z
    .boolean()
    .default(true)
    .describe(pinMessagePrompt.fields.notify.description),
});

async function handlePinMessage(input: z.infer<typeof PinMessageInput>) {
  const client = await getClient();
  await client.pinMessage(validateChat(input.chat), input.message_id, {
    notify: input.notify,
  });
  return { pinned: true };
}

export const PinMessage = {
  name: pinMessagePrompt.name,
  description: pinMessagePrompt.description,
  input: PinMessageInput,
  handler: handlePinMessage,
  annotations: annotate("Pin Message", "write"),
};

// unpin_message
const unpinMessagePrompt = prompts.get("unpin_message");
const UnpinMessageInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(unpinMessagePrompt.fields.chat.description),
  message_id: z
    .number()
    .int()
    .optional()
    .describe(unpinMessagePrompt.fields.message_id.description),
});

async function handleUnpinMessage(input: z.infer<typeof UnpinMessageInput>) {
  const client = await getClient();
  const chat = validateChat(input.chat);
  if (!input.message_id) {
    await client.unpinMessage(chat);
  } else {
    await client.unpinMessage(chat, input.message_id);
  }
  return { unpinned: true };
}

export const UnpinMessage = {
  name: unpinMessagePrompt.name,
  description: unpinMessagePrompt.description,
  input: UnpinMessageInput,
  handler: handleUnpinMessage,
  annotations: annotate("Unpin Message", "write"),
};

// get_pinned_messages
const getPinnedMessagesPrompt = prompts.get("get_pinned_messages");
const GetPinnedMessagesInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(getPinnedMessagesPrompt.fields.chat.description),
  limit: z
    .number()
    .int()
    .default(20)
    .describe(getPinnedMessagesPrompt.fields.limit.description),
});

async function handleGetPinnedMessages(
  input: z.infer<typeof GetPinnedMessagesInput>,
) {
  const client = await getClient();
  const messages = await client.getMessages(validateChat(input.chat), {
    filter: new Api.InputMessagesFilterPinned(),
    limit: input.limit,
  });
  return messages.map(summarizeMessage);
}

export const GetPinnedMessages = {
  name: getPinnedMessagesPrompt.name,
  description: getPinnedMessagesPrompt.description,
  input: GetPinnedMessagesInput,
  handler: handleGetPinnedMessages,
  annotations: annotate("Get Pinned Messages", "read"),
};

// get_message_read_by
const getMessageReadByPrompt = prompts.get("get_message_read_by");
const GetMessageReadByInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(getMessageReadByPrompt.fields.chat.description),
  message_id: z
    .number()
    .int()
    .describe(getMessageReadByPrompt.fields.message_id.description),
});

async function handleGetMessageReadBy(
  input: z.infer<typeof GetMessageReadByInput>,
) {
  const client = await getClient();
  const response = await client.invoke(
    new Api.messages.GetMessageReadParticipants({
      peer: validateChat(input.chat),
      msgId: input.message_id,
    }),
  );
  return { user_ids: response.map((p) => String(p.userId)) };
}

export const GetMessageReadBy = {
  name: getMessageReadByPrompt.name,
  description: getMessageReadByPrompt.description,
  input: GetMessageReadByInput,
  handler: handleGetMessageReadBy,
  annotations: annotate("Get Message Read By", "read"),
};

// list_scheduled_messages
const listScheduledMessagesPrompt = prompts.get("list_scheduled_messages");
const ListScheduledMessagesInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(listScheduledMessagesPrompt.fields.chat.description),
});

async function handleListScheduledMessages(
  input: z.infer<typeof ListScheduledMessagesInput>,
) {
  const client = await getClient();
  const response = await client.invoke(
    new Api.messages.GetScheduledHistory({
      peer: validateChat(input.chat),
      hash: bigInt(0),
    }),
  );
  const messages = (response as { messages?: Api.Message[] }).messages || [];
  return messages.map(summarizeMessage);
}

export const ListScheduledMessages = {
  name: listScheduledMessagesPrompt.name,
  description: listScheduledMessagesPrompt.description,
  input: ListScheduledMessagesInput,
  handler: handleListScheduledMessages,
  annotations: annotate("List Scheduled Messages", "read"),
};

// delete_scheduled_message
const deleteScheduledMessagePrompt = prompts.get("delete_scheduled_message");
const DeleteScheduledMessageInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(deleteScheduledMessagePrompt.fields.chat.description),
  message_ids: z
    .array(z.number().int())
    .min(1)
    .describe(deleteScheduledMessagePrompt.fields.message_ids.description),
});

async function handleDeleteScheduledMessage(
  input: z.infer<typeof DeleteScheduledMessageInput>,
) {
  const client = await getClient();
  await client.invoke(
    new Api.messages.DeleteScheduledMessages({
      peer: validateChat(input.chat),
      id: input.message_ids,
    }),
  );
  return { deleted: true };
}

export const DeleteScheduledMessage = {
  name: deleteScheduledMessagePrompt.name,
  description: deleteScheduledMessagePrompt.description,
  input: DeleteScheduledMessageInput,
  handler: handleDeleteScheduledMessage,
  annotations: annotate("Delete Scheduled Message", "write", {
    destructive: true,
  }),
};
