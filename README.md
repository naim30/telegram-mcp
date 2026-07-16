<div align="center">

# telegram-mcp

**Drive Telegram as your own account from any MCP client — not a bot.**

[![Node.js](https://img.shields.io/badge/node-%E2%89%A522.14-3c873a?style=flat-square)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=flat-square)](https://www.typescriptlang.org)
[![MCP](https://img.shields.io/badge/MCP-stdio_server-6f42c1?style=flat-square)](https://modelcontextprotocol.io)
[![GramJS](https://img.shields.io/badge/GramJS-MTProto-229ED2?style=flat-square)](https://gram.js.org)

</div>

An [MCP](https://modelcontextprotocol.io) server that connects an AI agent to Telegram through your **real user account** over MTProto (via [GramJS](https://gram.js.org)), authenticated with a saved session string. Because it acts as you and not a bot, it can read and search chat history and message anyone — things the Bot API cannot do.

It exposes 11 focused tools over stdio for sending, reading, searching, and managing messages, chats, and files.

## Features

- **You, not a bot** — message people who never contacted you and post to any chat you belong to.
- **Read & search history** — pull recent messages or full-text search a conversation.
- **Send anything** — text with Markdown/HTML, replies, files by local path or URL.
- **Manage messages** — edit, delete (for everyone or just you), and forward across chats.
- **Discover chats** — list your dialogs with unread counts and resolve `@username` → id.
- **Safe by default** — returned content is sanitized against prompt injection; the client stays silent on stdout so it never corrupts the protocol stream.

## Prerequisites

- **Node.js ≥ 22.14**
- A Telegram account
- An `api_id` and `api_hash` from [my.telegram.org/apps](https://my.telegram.org/apps) (these identify the *app*, not your account)

## Installation

```bash
git clone https://github.com/naim30/telegram-mcp.git
cd telegram-mcp
npm install
npm run build
```

## Configuration

Copy the example environment file and add your app credentials:

```bash
cp .env.example .env
```

| Variable | Required | Description |
| --- | --- | --- |
| `TELEGRAM_API_ID` | yes | App `api_id` from my.telegram.org |
| `TELEGRAM_API_HASH` | yes | App `api_hash` from my.telegram.org |
| `TELEGRAM_SESSION` | yes* | Session string for your account (generated below) |
| `TELEGRAM_DEFAULT_CHAT` | no | Fallback chat (`@username`, id, or `me`) when a tool omits `chat` |

<sub>*Set `TELEGRAM_SESSION` after running the login step below.</sub>

## Login

Generate a session string once. The script prompts for your phone number, the login code Telegram sends you, and your two-factor password if you have one:

```bash
npm run login
```

Copy the printed string into `.env` as `TELEGRAM_SESSION=...`. That's it — the session is reused on every start, so you never log in again.

> [!WARNING]
> The session string grants **full access to your account**. Never commit it or share it. `.env` is already gitignored.

## Connect to an MCP client

Point your client at the built server. Example `.mcp.json`:

```jsonc
{
  "mcpServers": {
    "telegram": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/telegram-mcp/dist/server.js"],
      "env": {
        "TELEGRAM_API_ID": "1234567",
        "TELEGRAM_API_HASH": "0123456789abcdef0123456789abcdef",
        "TELEGRAM_SESSION": "1BQANOTEuMTA...",
        "TELEGRAM_DEFAULT_CHAT": "me"
      }
    }
  }
}
```

Values in `env` override `.env`. The server connects to Telegram lazily on the first tool call and reuses one authorized client for its lifetime.

## Tools

| Tool | Description |
| --- | --- |
| `get_me` | Your account profile — doubles as a connectivity/auth check |
| `list_dialogs` | List your chats (DMs, groups, channels) with unread counts and last message |
| `resolve_entity` | Look up a user/group/channel by `@username` or id |
| `get_messages` | Read a chat's recent history, newest first, with pagination |
| `search_messages` | Full-text search a single chat's history |
| `send_message` | Send a text message (Markdown/HTML, replies, silent) |
| `edit_message` | Edit a message you previously sent |
| `delete_message` | Delete messages for everyone or just your local copy |
| `forward_message` | Forward messages from one chat to another |
| `mark_read` | Clear a chat's unread counter |
| `send_file` | Send a photo or document by local path or URL |

> [!NOTE]
> The `chat` argument accepts a `@username`, a numeric id, a string id, or `me` (your Saved Messages). Numeric ids resolve reliably only after the entity has been seen this session — run `list_dialogs` first to warm the cache, or prefer `@username`.

## How it works

```
MCP client ──stdio──▶ server.ts ──▶ tool handler ──▶ GramJS client ──▶ Telegram (MTProto)
                                          │
                                          └─▶ serialize + sanitize ──▶ JSON result
```

```
src/
  server.ts          Registers all tools, connects the stdio transport
  login.ts           `npm run login` — interactive session-string generator
  config/config.ts   Typed environment config (envalid + dotenv)
  lib/
    client.ts        Lazy, authorized GramJS client
    register-tool.ts  Wraps each tool: JSON output, errors → isError
    sanitize.ts      Strips control/zero-width characters from returned text
    serialize.ts     Compact, BigInt-safe summaries of GramJS objects
    fields.ts        Shared zod input fields
  tools/             account · messages · files (one object per tool)
```

## Scripts

```bash
npm run build    # Compile TypeScript to dist/
npm run login    # Generate a session string
npm start        # Run the server (needs a valid .env)
```

> [!CAUTION]
> This automates a **user** account. Bulk or spammy behavior can get your account limited or banned by Telegram. Keep actions deliberate and user-initiated.

## Acknowledgements

Built on [GramJS](https://gram.js.org) and the [Model Context Protocol SDK](https://github.com/modelcontextprotocol). The content-sanitization approach is adapted from the Telethon-based [chigwell/telegram-mcp](https://github.com/chigwell/telegram-mcp).
