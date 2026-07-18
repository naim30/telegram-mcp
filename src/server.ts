#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTool } from "./lib/register-tool.js";
import {
  // account
  GetMe,
  UpdateProfile,
  SetUsername,
  SetOnlineStatus,
  // users
  GetEntity,
  GetFullEntity,
  GetUserPhotos,
  // messages
  GetMessages,
  SearchMessages,
  SearchGlobal,
  GetPinnedMessages,
  GetMessageReadBy,
  SendMessage,
  EditMessage,
  DeleteMessage,
  ForwardMessage,
  SendReaction,
  SaveDraft,
  MarkRead,
  PinMessage,
  UnpinMessage,
  ListScheduledMessages,
  DeleteScheduledMessage,
  // files
  SendFile,
  DownloadMedia,
  GetStickerSets,
  // chats
  ListDialogs,
  MuteChat,
  UnmuteChat,
  ArchiveChat,
  UnarchiveChat,
  ListFolders,
  // groups
  ListParticipants,
  GetAdmins,
  JoinChat,
  LeaveChat,
  SetSlowMode,
  ExportChatInvite,
  // contacts
  ListContacts,
  AddContact,
  DeleteContact,
  BlockUser,
  UnblockUser,
  GetBlockedUsers,
} from "./tools/index.js";

const server = new McpServer({ name: "telegram-mcp", version: "0.1.0" });

// account
registerTool(server, GetMe);
registerTool(server, UpdateProfile);
registerTool(server, SetUsername);
registerTool(server, SetOnlineStatus);
// users
registerTool(server, GetEntity);
registerTool(server, GetFullEntity);
registerTool(server, GetUserPhotos);
// messages
registerTool(server, GetMessages);
registerTool(server, SearchMessages);
registerTool(server, SearchGlobal);
registerTool(server, GetPinnedMessages);
registerTool(server, GetMessageReadBy);
registerTool(server, SendMessage);
registerTool(server, EditMessage);
registerTool(server, DeleteMessage);
registerTool(server, ForwardMessage);
registerTool(server, SendReaction);
registerTool(server, SaveDraft);
registerTool(server, MarkRead);
registerTool(server, PinMessage);
registerTool(server, UnpinMessage);
registerTool(server, ListScheduledMessages);
registerTool(server, DeleteScheduledMessage);
// files
registerTool(server, SendFile);
registerTool(server, DownloadMedia);
registerTool(server, GetStickerSets);
// chats
registerTool(server, ListDialogs);
registerTool(server, MuteChat);
registerTool(server, UnmuteChat);
registerTool(server, ArchiveChat);
registerTool(server, UnarchiveChat);
registerTool(server, ListFolders);
// groups
registerTool(server, ListParticipants);
registerTool(server, GetAdmins);
registerTool(server, JoinChat);
registerTool(server, LeaveChat);
registerTool(server, SetSlowMode);
registerTool(server, ExportChatInvite);
// contacts
registerTool(server, ListContacts);
registerTool(server, AddContact);
registerTool(server, DeleteContact);
registerTool(server, BlockUser);
registerTool(server, UnblockUser);
registerTool(server, GetBlockedUsers);

function shutdown() {
  process.exit(0);
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.on("SIGHUP", shutdown);
  process.stdin.on("end", shutdown);
}

main().catch((err) => {
  const msg = err instanceof Error ? err.stack : String(err);
  console.log(`\nTelegram MCP, server stopped, error: ${msg}`);
  process.exit(1);
});
