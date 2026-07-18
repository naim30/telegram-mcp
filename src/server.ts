#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTool } from "./lib/register-tool.js";
import {
  // account
  GetMe,
  GetEntity,
  GetFullEntity,
  ListDialogs,
  GetUserPhotos,
  // profile
  UpdateProfile,
  SetUsername,
  SetOnlineStatus,
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
  // membership
  ListParticipants,
  GetAdmins,
  JoinChat,
  LeaveChat,
  // admin
  SetSlowMode,
  ExportChatInvite,
  // chat organization
  MuteChat,
  UnmuteChat,
  ArchiveChat,
  UnarchiveChat,
  ListFolders,
  // contacts
  ListContacts,
  AddContact,
  DeleteContact,
  // block
  BlockUser,
  UnblockUser,
  GetBlockedUsers,
} from "./tools/index.js";

const server = new McpServer({ name: "telegram-mcp", version: "0.1.0" });

// account
registerTool(server, GetMe);
registerTool(server, GetEntity);
registerTool(server, GetFullEntity);
registerTool(server, ListDialogs);
registerTool(server, GetUserPhotos);
// profile
registerTool(server, UpdateProfile);
registerTool(server, SetUsername);
registerTool(server, SetOnlineStatus);
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
// membership
registerTool(server, ListParticipants);
registerTool(server, GetAdmins);
registerTool(server, JoinChat);
registerTool(server, LeaveChat);
// admin
registerTool(server, SetSlowMode);
registerTool(server, ExportChatInvite);
// chat organization
registerTool(server, MuteChat);
registerTool(server, UnmuteChat);
registerTool(server, ArchiveChat);
registerTool(server, UnarchiveChat);
registerTool(server, ListFolders);
// contacts
registerTool(server, ListContacts);
registerTool(server, AddContact);
registerTool(server, DeleteContact);
// block
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
  console.log(`\nTelegram MCP, server stopped with error: ${msg}`);
  process.exit(1);
});
