import { z } from "zod";
import { Api } from "telegram";
import bigInt from "big-integer";
import { getClient } from "../lib/client.js";
import { prompts } from "../lib/prompts.js";
import { annotate } from "../lib/register-tool.js";
import { summarizeEntity } from "../lib/serialize.js";

// list_contacts
const listContactsPrompt = prompts.get("list_contacts");
const ListContactsInput = z.object({});

async function handleListContacts(_input: z.infer<typeof ListContactsInput>) {
  const client = await getClient();
  const response = await client.invoke(
    new Api.contacts.GetContacts({ hash: bigInt(0) }),
  );
  if (response.className === "contacts.ContactsNotModified") {
    return { contacts: [], count: 0 };
  }
  const users = response.users || [];
  return {
    contacts: users.map((item) => summarizeEntity(item)),
    count: users.length,
  };
}

export const ListContacts = {
  name: listContactsPrompt.name,
  description: listContactsPrompt.description,
  input: ListContactsInput,
  handler: handleListContacts,
  annotations: annotate("List Contacts", "read"),
};

// add_contact
const addContactPrompt = prompts.get("add_contact");
const AddContactInput = z.object({
  user: z
    .union([z.string(), z.number()])
    .describe(addContactPrompt.fields.user.description),
  first_name: z
    .string()
    .min(1)
    .describe(addContactPrompt.fields.first_name.description),
  last_name: z
    .string()
    .optional()
    .describe(addContactPrompt.fields.last_name.description),
  phone: z
    .string()
    .optional()
    .describe(addContactPrompt.fields.phone.description),
});

async function handleAddContact(input: z.infer<typeof AddContactInput>) {
  const client = await getClient();
  await client.invoke(
    new Api.contacts.AddContact({
      id: input.user,
      firstName: input.first_name,
      lastName: input.last_name ?? "",
      phone: input.phone ?? "",
      addPhonePrivacyException: false,
    }),
  );
  return { added: true };
}

export const AddContact = {
  name: addContactPrompt.name,
  description: addContactPrompt.description,
  input: AddContactInput,
  handler: handleAddContact,
  annotations: annotate("Add Contact", "write"),
};

// delete_contact
const deleteContactPrompt = prompts.get("delete_contact");
const DeleteContactInput = z.object({
  user: z
    .union([z.string(), z.number()])
    .describe(deleteContactPrompt.fields.user.description),
});

async function handleDeleteContact(input: z.infer<typeof DeleteContactInput>) {
  const client = await getClient();
  await client.invoke(
    new Api.contacts.DeleteContacts({
      id: [input.user],
    }),
  );
  return { deleted: true };
}

export const DeleteContact = {
  name: deleteContactPrompt.name,
  description: deleteContactPrompt.description,
  input: DeleteContactInput,
  handler: handleDeleteContact,
  annotations: annotate("Delete Contact", "write"),
};

// block_user
const blockUserPrompt = prompts.get("block_user");
const BlockUserInput = z.object({
  user: z
    .union([z.string(), z.number()])
    .describe(blockUserPrompt.fields.user.description),
});

async function handleBlockUser(input: z.infer<typeof BlockUserInput>) {
  const client = await getClient();
  await client.invoke(
    new Api.contacts.Block({
      id: input.user,
    }),
  );
  return { blocked: true };
}

export const BlockUser = {
  name: blockUserPrompt.name,
  description: blockUserPrompt.description,
  input: BlockUserInput,
  handler: handleBlockUser,
  annotations: annotate("Block User", "write"),
};

// unblock_user
const unblockUserPrompt = prompts.get("unblock_user");
const UnblockUserInput = z.object({
  user: z
    .union([z.string(), z.number()])
    .describe(unblockUserPrompt.fields.user.description),
});

async function handleUnblockUser(input: z.infer<typeof UnblockUserInput>) {
  const client = await getClient();
  await client.invoke(
    new Api.contacts.Unblock({
      id: input.user,
    }),
  );
  return { unblocked: true };
}

export const UnblockUser = {
  name: unblockUserPrompt.name,
  description: unblockUserPrompt.description,
  input: UnblockUserInput,
  handler: handleUnblockUser,
  annotations: annotate("Unblock User", "write"),
};

// get_blocked_users
const getBlockedUsersPrompt = prompts.get("get_blocked_users");
const GetBlockedUsersInput = z.object({
  limit: z
    .number()
    .int()
    .default(20)
    .describe(getBlockedUsersPrompt.fields.limit.description),
});

async function handleGetBlockedUsers(
  input: z.infer<typeof GetBlockedUsersInput>,
) {
  const client = await getClient();
  const response = await client.invoke(
    new Api.contacts.GetBlocked({
      offset: 0,
      limit: input.limit,
    }),
  );
  const users = response.users || [];
  return {
    blocked_users: users.map((u) => summarizeEntity(u)),
    count: users.length,
  };
}

export const GetBlockedUsers = {
  name: getBlockedUsersPrompt.name,
  description: getBlockedUsersPrompt.description,
  input: GetBlockedUsersInput,
  handler: handleGetBlockedUsers,
  annotations: annotate("Get Blocked Users", "read"),
};
