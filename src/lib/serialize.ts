import type { Api } from "telegram";
import { sanitizeName, sanitizeText } from "./sanitize.js";

/**
 * GramJS returns rich class instances that (a) reference the client, so they
 * are circular and cannot be JSON.stringify'd directly, and (b) carry ids as
 * big-integer instances. These helpers extract compact, JSON-safe, sanitized
 * views — matching the reference Telethon server's "structured JSON" approach.
 */

/** Convert a GramJS id-like value (BigInteger, bigint, number) to a string. */
export function idToString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

/** A short label describing any media attached to a message ("" if none). */
export function mediaLabel(msg: Api.Message): string {
  const media = msg.media;
  if (!media) return "";
  const cls = media.className ?? "";
  if (cls === "MessageMediaPhoto") return "photo";
  if (cls === "MessageMediaDocument") {
    const doc = (media as Api.MessageMediaDocument).document as
      | Api.Document
      | undefined;
    const nameAttr = doc?.attributes?.find(
      (a) => a.className === "DocumentAttributeFilename",
    ) as Api.DocumentAttributeFilename | undefined;
    return nameAttr?.fileName ? `document: ${nameAttr.fileName}` : "document";
  }
  if (cls === "MessageMediaWebPage") return ""; // link preview, not an attachment
  if (cls === "MessageMediaGeo") return "geo";
  if (cls === "MessageMediaContact") return "contact";
  if (cls === "MessageMediaPoll") return "poll";
  return cls.replace(/^MessageMedia/, "").toLowerCase() || "media";
}

/** Compact, sanitized view of a message (empty fields omitted). */
export function summarizeMessage(msg: Api.Message): Record<string, unknown> {
  const out: Record<string, unknown> = {
    id: msg.id,
    date: msg.date, // unix seconds
    out: Boolean(msg.out),
  };
  const text = msg.message;
  if (text) out.text = sanitizeText(text);

  const senderId = idToString((msg as { senderId?: unknown }).senderId);
  if (senderId) out.sender_id = senderId;
  const chatId = idToString((msg as { chatId?: unknown }).chatId);
  if (chatId) out.chat_id = chatId;

  const replyToMsgId = msg.replyTo?.replyToMsgId;
  if (replyToMsgId) out.reply_to_msg_id = replyToMsgId;

  const media = mediaLabel(msg);
  if (media) out.media = media;

  if (msg.editDate) out.edit_date = msg.editDate;
  if (msg.views) out.views = msg.views;
  return out;
}

/** Compact, sanitized view of a user/chat/channel entity. */
export function summarizeEntity(
  entity: Api.User | Api.Chat | Api.Channel | Api.TypeUser | Api.TypeChat,
): Record<string, unknown> {
  const cls = (entity as { className?: string }).className ?? "";
  const base: Record<string, unknown> = {
    id: idToString((entity as { id?: unknown }).id),
    type: cls,
  };

  if (cls === "User") {
    const u = entity as Api.User;
    return {
      ...base,
      type: "user",
      is_self: Boolean(u.self),
      bot: Boolean(u.bot),
      first_name: u.firstName ? sanitizeName(u.firstName) : null,
      last_name: u.lastName ? sanitizeName(u.lastName) : null,
      username: u.username ?? null,
      phone: u.phone ?? null,
    };
  }

  const c = entity as Api.Chat | Api.Channel;
  return {
    ...base,
    type: cls === "Channel" ? (c as Api.Channel).megagroup ? "supergroup" : "channel" : "group",
    title: (c as { title?: string }).title
      ? sanitizeName((c as { title?: string }).title)
      : null,
    username: (c as { username?: string }).username ?? null,
  };
}
