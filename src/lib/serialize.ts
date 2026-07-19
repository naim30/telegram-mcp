import type { Api } from "telegram";
import { sanitizeLine, sanitizeText } from "./sanitize.js";

export function summarizeEntity(
  entity: Api.TypeUser | Api.TypeChat,
): Record<string, unknown> {
  const className = entity.className || "";

  if (className === "User") {
    const data = entity as Api.User;
    return {
      id: data.id ? String(data.id) : null,
      type: className,
      is_self: Boolean(data.self),
      bot: Boolean(data.bot),
      first_name: data.firstName ? sanitizeLine(data.firstName) : null,
      last_name: data.lastName ? sanitizeLine(data.lastName) : null,
      username: data.username || null,
      phone: data.phone || null,
    };
  } else if (className === "Chat") {
    const data = entity as Api.Chat;
    return {
      id: data.id ? String(data.id) : null,
      type: className,
      title: data.title ? sanitizeLine(data.title) : null,
      participants_count: data.participantsCount || null,
      date: data.date || null,
      creator: Boolean(data.creator),
      left: Boolean(data.left),
      deactivated: Boolean(data.deactivated),
    };
  } else if (className === "Channel") {
    const data = entity as Api.Channel;
    return {
      id: data.id ? String(data.id) : null,
      type: className,
      title: data.title ? sanitizeLine(data.title) : null,
      username: data.username || null,
      megagroup: Boolean(data.megagroup),
      broadcast: Boolean(data.broadcast),
      verified: Boolean(data.verified),
      restricted: Boolean(data.restricted),
      scam: Boolean(data.scam),
      fake: Boolean(data.fake),
      participants_count: data.participantsCount || null,
      date: data.date || null,
    };
  } else if (className === "ChatForbidden") {
    const data = entity as Api.ChatForbidden;
    return {
      id: data.id ? String(data.id) : null,
      type: className,
      title: data.title ? sanitizeLine(data.title) : null,
      forbidden: true,
    };
  } else if (className === "ChannelForbidden") {
    const data = entity as Api.ChannelForbidden;
    return {
      id: data.id ? String(data.id) : null,
      type: className,
      title: data.title ? sanitizeLine(data.title) : null,
      megagroup: Boolean(data.megagroup),
      broadcast: Boolean(data.broadcast),
      forbidden: true,
    };
  }

  return {
    id: entity.id ? String(entity.id) : null,
    type: className,
  };
}

export function summarizeMessage(msg: Api.Message): Record<string, unknown> {
  const response: Record<string, unknown> = {
    id: msg.id,
    date: msg.date,
    out: Boolean(msg.out),
  };
  if (msg.message) {
    response.text = sanitizeText(msg.message);
  }
  if (msg.senderId) {
    response.sender_id = msg.senderId;
  }
  if (msg.chatId) {
    response.chat_id = msg.chatId;
  }
  if (msg.viaBotId) {
    response.via_bot_id = msg.viaBotId;
  }
  if (msg.replyTo) {
    response.reply_to = {
      reply_to_msg_id: msg.replyTo.replyToMsgId,
      reply_to_top_id: msg.replyTo.replyToTopId,
    };
  }
  if (msg.fwdFrom) {
    const fromPeer = msg.fwdFrom.fromId as any;
    const fromId = fromPeer?.userId || fromPeer?.chatId || fromPeer?.channelId;
    response.forwarded_from = {
      from_id: fromId ? String(fromId) : null,
      from_name: msg.fwdFrom.fromName
        ? sanitizeLine(msg.fwdFrom.fromName)
        : null,
      post_author: msg.fwdFrom.postAuthor
        ? sanitizeLine(msg.fwdFrom.postAuthor)
        : null,
      date: msg.fwdFrom.date,
    };
  }
  if (msg.groupedId) {
    response.grouped_id = String(msg.groupedId);
  }
  if (msg.media) {
    response.media = msg.media.className;
  }
  if (msg.postAuthor) {
    response.post_author = sanitizeLine(msg.postAuthor);
  }
  if (msg.views) {
    response.views = msg.views;
  }
  if (msg.forwards) {
    response.forwards = msg.forwards;
  }
  if (msg.replies?.replies) {
    response.replies = msg.replies.replies;
  }
  if (msg.reactions?.results?.length) {
    response.reactions = msg.reactions.results.map((item) => {
      const reaction = item.reaction as any;
      const reactionId =
        reaction.emoticon || reaction.documentId ? reaction.documentId : null;
      return {
        reaction: reactionId,
        count: item.count,
      };
    });
  }
  if (msg.pinned) {
    response.pinned = true;
  }
  if (msg.silent) {
    response.silent = true;
  }
  if (msg.post) {
    response.post = true;
  }
  if (msg.mentioned) {
    response.mentioned = true;
  }
  if (msg.editDate) {
    response.edit_date = msg.editDate;
  }
  return response;
}
