import { z } from "zod";
import { Api } from "telegram";
import bigInt from "big-integer";
import { getClient } from "../lib/client.js";
import { validateChat } from "../utils/chat.js";
import { prompts } from "../lib/prompts.js";
import { annotate } from "../lib/register-tool.js";
import { summarizeEntity } from "../lib/serialize.js";
import { sanitizeText } from "../lib/sanitize.js";

// get_entity
const getEntityPrompt = prompts.get("get_entity");
const GetEntityInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(getEntityPrompt.fields.chat.description),
});

async function handleGetEntity(input: z.infer<typeof GetEntityInput>) {
  const client = await getClient();
  const entity = await client.getEntity(validateChat(input.chat));
  return summarizeEntity(entity);
}

export const GetEntity = {
  name: getEntityPrompt.name,
  description: getEntityPrompt.description,
  input: GetEntityInput,
  handler: handleGetEntity,
  annotations: annotate("Get Entity", "read"),
};

// get_full_entity
const getFullEntityPrompt = prompts.get("get_full_entity");
const GetFullEntityInput = z.object({
  chat: z
    .union([z.string(), z.number()])
    .describe(getFullEntityPrompt.fields.chat.description),
});

async function handleGetFullEntity(input: z.infer<typeof GetFullEntityInput>) {
  const client = await getClient();
  const entity = await client.getEntity(validateChat(input.chat));
  const className = (entity as { className?: string }).className;
  const base = summarizeEntity(entity);
  let extra: Record<string, unknown> = {};
  if (className === "User") {
    const full = await client.invoke(new Api.users.GetFullUser({ id: entity }));
    const user = full.fullUser;
    extra = {
      about: user.about ? sanitizeText(user.about) : null,
      common_chats_count: user.commonChatsCount || 0,
    };
  } else if (className === "Channel") {
    const full = await client.invoke(
      new Api.channels.GetFullChannel({ channel: entity }),
    );
    const channel = full.fullChat as Api.ChannelFull;
    extra = {
      about: channel.about ? sanitizeText(channel.about) : null,
      participants_count: channel.participantsCount || null,
      admins_count: channel.adminsCount || null,
    };
  } else if (className === "Chat") {
    const full = await client.invoke(
      new Api.messages.GetFullChat({ chatId: (entity as Api.Chat).id }),
    );
    const chat = full.fullChat as Api.ChatFull;
    extra = {
      about: chat.about ? sanitizeText(chat.about) : null,
    };
  }
  return { ...base, ...extra };
}

export const GetFullEntity = {
  name: getFullEntityPrompt.name,
  description: getFullEntityPrompt.description,
  input: GetFullEntityInput,
  handler: handleGetFullEntity,
  annotations: annotate("Get Full Entity", "read"),
};

// get_user_photos
const getUserPhotosPrompt = prompts.get("get_user_photos");
const GetUserPhotosInput = z.object({
  user: z
    .union([z.string(), z.number()])
    .describe(getUserPhotosPrompt.fields.user.description),
  limit: z
    .number()
    .int()
    .default(20)
    .describe(getUserPhotosPrompt.fields.limit.description),
});

async function handleGetUserPhotos(input: z.infer<typeof GetUserPhotosInput>) {
  const client = await getClient();
  const response = await client.invoke(
    new Api.photos.GetUserPhotos({
      userId: input.user,
      offset: 0,
      maxId: bigInt(0),
      limit: input.limit,
    }),
  );
  const photos = response.photos || [];
  return {
    photos: photos.map((item) => {
      const photo = item as any;
      return {
        id: String(photo.id),
        date: photo.date || null,
      };
    }),
    count: photos.length,
  };
}

export const GetUserPhotos = {
  name: getUserPhotosPrompt.name,
  description: getUserPhotosPrompt.description,
  input: GetUserPhotosInput,
  handler: handleGetUserPhotos,
  annotations: annotate("Get User Photos", "read"),
};
