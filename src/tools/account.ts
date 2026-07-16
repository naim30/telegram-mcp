import { z } from "zod";
import type { Api } from "telegram";
import { getClient, resolveChat } from "../lib/client.js";
import { chatField } from "../lib/fields.js";
import {
  idToString,
  summarizeEntity,
  summarizeMessage,
} from "../lib/serialize.js";
import { sanitizeName } from "../lib/sanitize.js";

// ─── get_me ───────────────────────────────────────────────────────────────────
const GetMeInput = z.object({});

async function handleGetMe(_input: z.infer<typeof GetMeInput>) {
  const client = await getClient();
  const me = await client.getMe();
  return summarizeEntity(me as Api.User);
}

export const GetMe = {
  name: "get_me",
  description:
    "Return the logged-in account's own profile — id, first/last name, username, phone. Acts as a connectivity + authorization check: if this succeeds, the configured TELEGRAM_SESSION is valid and the server is talking to Telegram as your user account (not a bot). Takes no arguments.",
  input: GetMeInput,
  handler: handleGetMe,
};

// ─── list_dialogs ─────────────────────────────────────────────────────────────
const ListDialogsInput = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(200)
    .optional()
    .describe(
      "Max number of conversations to return, most-recent first (default 30). These are your open chats — private DMs, groups, and channels.",
    ),
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
  name: "list_dialogs",
  description:
    "List your conversations (dialogs) — private chats, groups, and channels you are in — most-recently-active first, each with its id, name, type, unread count, and a summary of the last message. This is the primary way to discover chat ids: resolve a name to an id here first, then pass that id (or the @username) to the messaging tools. Numeric ids seen via this call become resolvable for the rest of the session.",
  input: ListDialogsInput,
  handler: handleListDialogs,
};

// ─── resolve_entity ───────────────────────────────────────────────────────────
const ResolveEntityInput = z.object({
  chat: chatField,
});

async function handleResolveEntity(input: z.infer<typeof ResolveEntityInput>) {
  const client = await getClient();
  const entity = await client.getEntity(resolveChat(input.chat));
  return summarizeEntity(entity);
}

export const ResolveEntity = {
  name: "resolve_entity",
  description:
    "Look up a user, group, or channel by @username or id and return its normalized details (id, type, name/title, username). Use this to confirm a target exists and is reachable before messaging it, or to turn a @username into a stable numeric id. Errors if the entity cannot be found or accessed by this account.",
  input: ResolveEntityInput,
  handler: handleResolveEntity,
};
