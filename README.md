<h1 align="center">telegram-mcp</h1>

<p align="center">
  An MCP server that drives <b>Telegram as your own user account</b> — send, read, search, and manage messages, files, chats, groups, and contacts, straight from any MCP client.
</p>

<p align="center">
  <a href="#requirements">Requirements</a> •
  <a href="#getting-started">Getting started</a> •
  <a href="#tools">Tools</a> •
  <a href="#how-it-works">How it works</a> •
  <a href="#security--safety">Security</a>
</p>

---

Most Telegram integrations are **bots** created with BotFather. This one is different: it logs in as **you**, over Telegram's native [MTProto](https://core.telegram.org/mtproto) protocol (via [GramJS](https://gram.js.org/)). Because it acts as your user account, it can do things bots simply cannot — read and search your full history, message people who have never contacted you, join chats, and manage your account.

It speaks the [Model Context Protocol](https://modelcontextprotocol.io/) over stdio, so it plugs into Claude Desktop, Claude Code, or any MCP-compatible client, exposing **44 tools** across seven domains.

> [!WARNING]
> This automates a **real user account**, not a bot. Your session string grants full access to that account, and spammy or bulk automation can get it banned. Keep tool actions deliberate and user-initiated.

## Features

- **User-account access** — read/search history and message anyone, unlike bots.
- **44 tools, 7 domains** — account, users, messages, files, chats, groups, contacts.
- **Read/write permission hints** — every tool is annotated `read` or `write` (MCP `readOnlyHint`), so clients can auto-approve reads and gate writes.
- **Login once** — an interactive login saves a portable session to a gitignored file; the server reuses it forever. No password or session ever touches your MCP config.
- **Safe by construction** — returned text is sanitized against prompt injection, and results are compact JSON (never raw, circular GramJS objects).

## Requirements

- [Node.js](https://nodejs.org/) **22.14 or newer**
- A Telegram account and API credentials (`api_id` + `api_hash`) from [my.telegram.org/apps](https://my.telegram.org/apps)

## Getting started

### 1. Install and build

```bash
npm install
npm run build
```

### 2. Configure credentials

Copy the example env file and fill it in:

```bash
cp .env.example .env
```

| Variable | Required | Description |
| --- | :---: | --- |
| `TELEGRAM_API_ID` | yes | App `api_id` from my.telegram.org |
| `TELEGRAM_API_HASH` | yes | App `api_hash` from my.telegram.org |
| `SESSION_PATH` | yes | Directory where the login session file (`.telegram-session`) is stored |

### 3. Log in

Run the interactive login once. It prompts for your phone number, the code Telegram sends you, and your two-factor password (if set):

```bash
npm run login
```

It saves the session to `.telegram-session` inside `SESSION_PATH` (with owner-only `0600` permissions). The server reads it automatically on every start — you never log in again and never paste the session into any config.

> [!NOTE]
> `npm run login` needs an interactive terminal. If your shell isn't a real TTY, run the built script directly: `node dist/ops/login.js`.

### 4. Connect an MCP client

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
        "SESSION_PATH": "/absolute/path/to/telegram-mcp"
      }
    }
  }
}
```

That's it — ask your client to list your chats, search a conversation, or send a message.

## Tools

All 44 tools live in `src/tools/`, one file per domain. Each is either a **read** (safe to auto-approve) or a **write** (mutates your account — gate it).

| Domain | Tools |
| --- | --- |
| **account** — your own account | `get_me`, `update_profile`, `set_username`, `set_online_status` |
| **users** — look up others | `get_entity`, `get_full_entity`, `get_user_photos` |
| **messages** | `get_messages`, `search_messages`, `search_global`, `get_pinned_messages`, `get_message_read_by`, `send_message`, `edit_message`, `delete_message`, `forward_message`, `send_reaction`, `save_draft`, `mark_read`, `pin_message`, `unpin_message`, `list_scheduled_messages`, `delete_scheduled_message` |
| **files** — media in/out | `send_file`, `download_media`, `get_sticker_sets` |
| **chats** — your chat list | `list_dialogs`, `mute_chat`, `unmute_chat`, `archive_chat`, `unarchive_chat`, `list_folders` |
| **groups** — group/channel management | `list_participants`, `get_admins`, `join_chat`, `leave_chat`, `set_slow_mode`, `export_chat_invite` |
| **contacts** — address book & blocking | `list_contacts`, `add_contact`, `delete_contact`, `block_user`, `unblock_user`, `get_blocked_users` |

> [!TIP]
> Chat targets accept an `@username`, a numeric id, a string id, or `'me'` (your Saved Messages). Prefer `@username` — numeric ids resolve reliably only after the entity has been seen this session (e.g. via `list_dialogs`).

## How it works

```
MCP client ──stdio/JSON-RPC──▶ server.ts ──▶ tool handler ──▶ getClient() ──▶ GramJS (MTProto)
                                                    │
                                              serialize + sanitize
                                                    │
                                                    ▼
                                          compact, safe JSON result
```

- **`server.ts`** registers every tool and connects a `StdioServerTransport`.
- **`lib/client.ts`** lazily creates one shared, authenticated GramJS client on the first tool call and reuses it for the process lifetime (keeping the entity cache warm).
- **Tool prose lives in YAML.** Each tool's description and field docs are in `src/prompts/*.yml` (loaded via [promptoro](https://www.npmjs.com/package/promptoro)); the TypeScript holds only types and logic.
- **Every result is mapped** through `serialize.ts` (compact, BigInt-safe) and `sanitize.ts` (strips control/zero-width characters as a prompt-injection defense) — raw GramJS objects are never returned.

## Security & safety

- `.env` and `.telegram-session` are **gitignored**. The session string is **full access to your account** — never commit, log, or share it.
- The login script writes the session file with `0600` (owner read/write only).
- Tools are annotated `read` vs `write` so your MCP client can auto-approve harmless reads while prompting for anything that changes your account.

## Development

```bash
npm run build     # tsc -p . → dist/ (also copies prompt YAML)
npm start         # run dist/server.js (needs a valid .env)
npm run login     # regenerate the session string
```

Adding a tool: define it in the file for its group under `src/tools/`, add the matching `src/prompts/<name>.yml`, register it in `src/server.ts`, and rebuild. See `CLAUDE.md` for the full conventions.
