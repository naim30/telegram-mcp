import { z } from "zod";
import { Api } from "telegram";
import { getClient } from "../lib/client.js";
import { prompts } from "../lib/prompts.js";
import { annotate } from "../lib/register-tool.js";
import { summarizeEntity } from "../lib/serialize.js";

// get_me
const getMePrompt = prompts.get("get_me");
const GetMeInput = z.object({});

async function handleGetMe(_input: z.infer<typeof GetMeInput>) {
  const client = await getClient();
  const me = await client.getMe();
  return summarizeEntity(me as Api.User);
}

export const GetMe = {
  name: getMePrompt.name,
  description: getMePrompt.description,
  input: GetMeInput,
  handler: handleGetMe,
  annotations: annotate("Get Me", "read"),
};

// update_profile
const updateProfilePrompt = prompts.get("update_profile");
const UpdateProfileInput = z.object({
  first_name: z
    .string()
    .optional()
    .describe(updateProfilePrompt.fields.first_name.description),
  last_name: z
    .string()
    .optional()
    .describe(updateProfilePrompt.fields.last_name.description),
  about: z
    .string()
    .max(70)
    .optional()
    .describe(updateProfilePrompt.fields.about.description),
});

async function handleUpdateProfile(input: z.infer<typeof UpdateProfileInput>) {
  const client = await getClient();
  await client.invoke(
    new Api.account.UpdateProfile({
      firstName: input.first_name,
      lastName: input.last_name,
      about: input.about,
    }),
  );
  return { updated: true };
}

export const UpdateProfile = {
  name: updateProfilePrompt.name,
  description: updateProfilePrompt.description,
  input: UpdateProfileInput,
  handler: handleUpdateProfile,
  annotations: annotate("Update Profile", "write"),
};

// set_username
const setUsernamePrompt = prompts.get("set_username");
const SetUsernameInput = z.object({
  username: z.string().describe(setUsernamePrompt.fields.username.description),
});

async function handleSetUsername(input: z.infer<typeof SetUsernameInput>) {
  const client = await getClient();
  await client.invoke(
    new Api.account.UpdateUsername({ username: input.username }),
  );
  return { updated: true, username: input.username || null };
}

export const SetUsername = {
  name: setUsernamePrompt.name,
  description: setUsernamePrompt.description,
  input: SetUsernameInput,
  handler: handleSetUsername,
  annotations: annotate("Set Username", "write"),
};

// set_online_status
const setOnlineStatusPrompt = prompts.get("set_online_status");
const SetOnlineStatusInput = z.object({
  offline: z
    .boolean()
    .describe(setOnlineStatusPrompt.fields.offline.description),
});

async function handleSetOnlineStatus(
  input: z.infer<typeof SetOnlineStatusInput>,
) {
  const client = await getClient();
  await client.invoke(new Api.account.UpdateStatus({ offline: input.offline }));
  return { offline: input.offline };
}

export const SetOnlineStatus = {
  name: setOnlineStatusPrompt.name,
  description: setOnlineStatusPrompt.description,
  input: SetOnlineStatusInput,
  handler: handleSetOnlineStatus,
  annotations: annotate("Set Online Status", "write"),
};
