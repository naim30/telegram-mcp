import { z } from "zod";
import { getClient, resolveChat } from "../lib/client.js";
import { chatField, parseModeField } from "../lib/fields.js";
import { summarizeMessage } from "../lib/serialize.js";

// ─── get_messages ─────────────────────────────────────────────────────────────
const GetMessagesInput = z.object({
  chat: chatField,
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Max messages to return, newest first (default 20)."),
  offset_id: z
    .number()
    .int()
    .optional()
    .describe(
      "Return only messages older than this message id — pass the smallest id from a previous page to paginate backwards through history. Omit to start from the latest message.",
    ),
});

async function handleGetMessages(input: z.infer<typeof GetMessagesInput>) {
  const client = await getClient();
  const messages = await client.getMessages(resolveChat(input.chat), {
    limit: input.limit ?? 20,
    offsetId: input.offset_id ?? 0,
  });
  return messages.map(summarizeMessage);
}

export const GetMessages = {
  name: "get_messages",
  description:
    "Read recent messages from a chat's history (newest first), as your account sees them — something a bot cannot do. Returns compact, sanitized message summaries (id, date, text, sender, media label, reply target). Paginate backwards with offset_id. Use list_dialogs first to find the chat id if you only have a name.",
  input: GetMessagesInput,
  handler: handleGetMessages,
};

// ─── search_messages ──────────────────────────────────────────────────────────
const SearchMessagesInput = z.object({
  chat: chatField,
  query: z
    .string()
    .min(1)
    .describe("Text to search for within the chat's message history."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Max matching messages to return, newest first (default 20)."),
});

async function handleSearchMessages(input: z.infer<typeof SearchMessagesInput>) {
  const client = await getClient();
  const messages = await client.getMessages(resolveChat(input.chat), {
    search: input.query,
    limit: input.limit ?? 20,
  });
  return messages.map(summarizeMessage);
}

export const SearchMessages = {
  name: "search_messages",
  description:
    "Full-text search a single chat's message history for a query string, returning matching messages (newest first) as sanitized summaries. Runs server-side on Telegram. Use this to find a specific message id before editing/deleting/forwarding it, or to pull context on a topic within one conversation.",
  input: SearchMessagesInput,
  handler: handleSearchMessages,
};

// ─── send_message ─────────────────────────────────────────────────────────────
const SendMessageInput = z.object({
  chat: chatField,
  text: z
    .string()
    .min(1)
    .max(4096)
    .describe("Message text to send, 1–4096 characters."),
  parse_mode: parseModeField,
  reply_to: z
    .number()
    .int()
    .optional()
    .describe("Optional id of a message in the same chat to reply to."),
  silent: z
    .boolean()
    .optional()
    .describe("When true, sends without a notification sound."),
});

async function handleSendMessage(input: z.infer<typeof SendMessageInput>) {
  const client = await getClient();
  const message = await client.sendMessage(resolveChat(input.chat), {
    message: input.text,
    parseMode: input.parse_mode,
    replyTo: input.reply_to,
    silent: input.silent,
  });
  return summarizeMessage(message);
}

export const SendMessage = {
  name: "send_message",
  description:
    "Send a text message to any chat, group, or user FROM your own account (MTProto). Unlike a bot, this can message people who have never contacted you and post to chats you belong to. Supports Markdown/HTML via parse_mode, threaded replies, and silent delivery. Returns the sent message summary, including its id for later edit/delete/forward. Use responsibly — automating a user account to spam risks an account ban.",
  input: SendMessageInput,
  handler: handleSendMessage,
};

// ─── edit_message ─────────────────────────────────────────────────────────────
const EditMessageInput = z.object({
  chat: chatField,
  message_id: z
    .number()
    .int()
    .describe("Id of the message to edit — must be one you sent."),
  text: z
    .string()
    .min(1)
    .max(4096)
    .describe("New text for the message, 1–4096 characters."),
  parse_mode: parseModeField,
});

async function handleEditMessage(input: z.infer<typeof EditMessageInput>) {
  const client = await getClient();
  const message = await client.editMessage(resolveChat(input.chat), {
    message: input.message_id,
    text: input.text,
    parseMode: input.parse_mode,
  });
  return summarizeMessage(message);
}

export const EditMessage = {
  name: "edit_message",
  description:
    "Edit the text of a message you previously sent, via its chat and message_id. Only your own messages can be edited, within Telegram's edit time window. Returns the updated message summary.",
  input: EditMessageInput,
  handler: handleEditMessage,
};

// ─── delete_message ───────────────────────────────────────────────────────────
const DeleteMessageInput = z.object({
  chat: chatField,
  message_ids: z
    .array(z.number().int())
    .min(1)
    .describe("Ids of the messages to delete in the target chat."),
  revoke: z
    .boolean()
    .optional()
    .describe(
      "When true (default), deletes the message for everyone. When false, deletes only your local copy where Telegram allows it.",
    ),
});

async function handleDeleteMessage(input: z.infer<typeof DeleteMessageInput>) {
  const client = await getClient();
  await client.deleteMessages(resolveChat(input.chat), input.message_ids, {
    revoke: input.revoke ?? true,
  });
  return { deleted: true, message_ids: input.message_ids };
}

export const DeleteMessage = {
  name: "delete_message",
  description:
    "Delete one or more messages from a chat. With revoke=true (default) they are removed for everyone (subject to Telegram's rules on who/when); revoke=false removes only your local copy. Returns { deleted, message_ids }.",
  input: DeleteMessageInput,
  handler: handleDeleteMessage,
};

// ─── forward_message ──────────────────────────────────────────────────────────
const ForwardMessageInput = z.object({
  to: z
    .union([z.string(), z.number()])
    .describe("Destination chat/user — @username or id. Required."),
  from: z
    .union([z.string(), z.number()])
    .describe("Source chat the messages currently live in — @username or id."),
  message_ids: z
    .array(z.number().int())
    .min(1)
    .describe("Ids of the messages in `from` to forward."),
  silent: z
    .boolean()
    .optional()
    .describe("When true, forwards without a notification sound."),
});

async function handleForwardMessage(input: z.infer<typeof ForwardMessageInput>) {
  const client = await getClient();
  const messages = await client.forwardMessages(input.to, {
    messages: input.message_ids,
    fromPeer: input.from,
    silent: input.silent,
  });
  return messages.map(summarizeMessage);
}

export const ForwardMessage = {
  name: "forward_message",
  description:
    "Forward one or more messages from one chat to another, preserving original-sender attribution. `to` is the destination and `from` is the source; both must be chats your account can access. Returns summaries of the newly created messages in the destination.",
  input: ForwardMessageInput,
  handler: handleForwardMessage,
};

// ─── mark_read ────────────────────────────────────────────────────────────────
const MarkReadInput = z.object({
  chat: chatField,
});

async function handleMarkRead(input: z.infer<typeof MarkReadInput>) {
  const client = await getClient();
  const ok = await client.markAsRead(resolveChat(input.chat));
  return { marked_read: ok };
}

export const MarkRead = {
  name: "mark_read",
  description:
    "Mark a chat as read (clear its unread counter) up to the latest message, as your account. Returns { marked_read }.",
  input: MarkReadInput,
  handler: handleMarkRead,
};
