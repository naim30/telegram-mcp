#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTool } from "./lib/register-tool.js";
import {
  GetMe,
  ListDialogs,
  ResolveEntity,
  GetMessages,
  SearchMessages,
  SendMessage,
  EditMessage,
  DeleteMessage,
  ForwardMessage,
  MarkRead,
  SendFile,
} from "./tools/index.js";

const server = new McpServer({ name: "telegram-mcp", version: "0.1.0" });

registerTool(server, GetMe.name, GetMe.description, GetMe.input, GetMe.handler);
registerTool(
  server,
  ListDialogs.name,
  ListDialogs.description,
  ListDialogs.input,
  ListDialogs.handler,
);
registerTool(
  server,
  ResolveEntity.name,
  ResolveEntity.description,
  ResolveEntity.input,
  ResolveEntity.handler,
);
registerTool(
  server,
  GetMessages.name,
  GetMessages.description,
  GetMessages.input,
  GetMessages.handler,
);
registerTool(
  server,
  SearchMessages.name,
  SearchMessages.description,
  SearchMessages.input,
  SearchMessages.handler,
);
registerTool(
  server,
  SendMessage.name,
  SendMessage.description,
  SendMessage.input,
  SendMessage.handler,
);
registerTool(
  server,
  EditMessage.name,
  EditMessage.description,
  EditMessage.input,
  EditMessage.handler,
);
registerTool(
  server,
  DeleteMessage.name,
  DeleteMessage.description,
  DeleteMessage.input,
  DeleteMessage.handler,
);
registerTool(
  server,
  ForwardMessage.name,
  ForwardMessage.description,
  ForwardMessage.input,
  ForwardMessage.handler,
);
registerTool(
  server,
  MarkRead.name,
  MarkRead.description,
  MarkRead.input,
  MarkRead.handler,
);
registerTool(
  server,
  SendFile.name,
  SendFile.description,
  SendFile.input,
  SendFile.handler,
);

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
  const errMsg = err instanceof Error ? err.stack : String(err);
  console.log(`Telegram MCP server stopped with error: ${errMsg}`);
  process.exit(1);
});
