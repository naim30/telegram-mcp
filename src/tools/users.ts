import { z } from "zod";
import { Api } from "telegram";
import bigInt from "big-integer";
import { getClient } from "../lib/client.js";
import { validateChat } from "../utils/chat.js";
import { prompts } from "../lib/prompts.js";
import { annotate } from "../lib/register-tool.js";
import { idToString, summarizeEntity } from "../lib/serialize.js";
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
  const base = summarizeEntity(entity);
  const cls = (entity as { className?: string }).className;
  let extra: Record<string, unknown> = {};

  if (cls === "User") {
    const full = await client.invoke(new Api.users.GetFullUser({ id: entity }));
    const f = full.fullUser;
    extra = {
      about: f.about ? sanitizeText(f.about) : null,
      common_chats_count: f.commonChatsCount ?? 0,
    };
  } else if (cls === "Channel") {
    const full = await client.invoke(
      new Api.channels.GetFullChannel({ channel: entity }),
    );
    const f = full.fullChat as Api.ChannelFull;
    extra = {
      about: f.about ? sanitizeText(f.about) : null,
      participants_count: f.participantsCount ?? null,
      admins_count: f.adminsCount ?? null,
    };
  } else if (cls === "Chat") {
    const full = await client.invoke(
      new Api.messages.GetFullChat({ chatId: (entity as Api.Chat).id }),
    );
    const f = full.fullChat as Api.ChatFull;
    extra = { about: f.about ? sanitizeText(f.about) : null };
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
    .min(1)
    .max(100)
    .optional()
    .describe(getUserPhotosPrompt.fields.limit.description),
});

async function handleGetUserPhotos(input: z.infer<typeof GetUserPhotosInput>) {
  const client = await getClient();
  const res = await client.invoke(
    new Api.photos.GetUserPhotos({
      userId: input.user,
      offset: 0,
      maxId: bigInt(0),
      limit: input.limit ?? 20,
    }),
  );
  const photos = (res as Api.photos.Photos).photos ?? [];
  return {
    count: photos.length,
    photos: photos.map((p) => ({
      id: idToString((p as { id?: unknown }).id),
      date: (p as { date?: number }).date ?? null,
    })),
  };
}

export const GetUserPhotos = {
  name: getUserPhotosPrompt.name,
  description: getUserPhotosPrompt.description,
  input: GetUserPhotosInput,
  handler: handleGetUserPhotos,
  annotations: annotate("Get User Photos", "read"),
};
