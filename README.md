# telegram-mcp

MCP server that drives Telegram as **your own user account** over MTProto (via [GramJS](https://gram.js.org/)) — **not** a BotFather bot. Authentication is a saved **session string**, so the server can do things bots can't: message people who never contacted you, read and search chat history, and act as you in any chat you belong to.

> ⚠️ **Use responsibly.** Automating a *user* account is allowed by Telegram but abuse (spam, mass messaging) risks the account being **banned**. The session string grants **full access to your account** — treat it like a password.

Inspired in structure by the Telethon-based [`chigwell/telegram-mcp`](https://github.com/chigwell/telegram-mcp) (from which the content-sanitization approach is ported) and built in the same code style as the sibling `memora` MCP: ESM TypeScript, `McpServer` over `StdioServerTransport`, one exported `{ name, description, input, handler }` object per tool, and a shared `registerTool` wrapper that JSON-serializes results and surfaces errors as `isError`.

## Tools (11)

| Group | Tools |
| --- | --- |
| Account | `get_me`, `list_dialogs`, `resolve_entity` |
| Read | `get_messages`, `search_messages` |
| Write | `send_message`, `edit_message`, `delete_message`, `forward_message`, `mark_read` |
| Files | `send_file` |

All returned message text, names, and titles are **sanitized** (control/zero-width chars stripped, truncated) as a defence-in-depth measure against prompt injection from Telegram content.

## Quick start

### 1. Get app credentials

Go to [my.telegram.org/apps](https://my.telegram.org/apps), log in, and create an app to get an **`api_id`** and **`api_hash`**. (These identify the *app*, not your account.)

### 2. Install & build

```bash
npm install
npm run build
```

Requires Node ≥ 22.14.

### 3. Configure and log in

Copy `.env.example` to `.env` and fill in your `api_id` / `api_hash`:

```bash
TELEGRAM_API_ID=1234567
TELEGRAM_API_HASH=0123456789abcdef0123456789abcdef
```

Then run the one-time login. It asks for your phone number, the code Telegram sends you, and your 2FA password (if set), and prints a **session string**:

```bash
npm run login
```

Paste that string into `.env` as `TELEGRAM_SESSION=...`. Done — no re-login needed.

### 4. Wire it into a project's `.mcp.json`

```jsonc
{
  "mcpServers": {
    "telegram": {
      "type": "stdio",
      "command": "node",
      "args": ["../telegram-mcp/dist/server.js"],
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

`env` here overrides `.env`. `TELEGRAM_DEFAULT_CHAT` is optional and used only when a tool omits `chat`.

## Usage notes

- **`chat`** accepts a `@username`, a numeric id, a string id, or `'me'` (your Saved Messages). Numeric ids resolve reliably only after the entity has been seen this session — call **`list_dialogs`** first to discover ids, then reuse them.
- **Reading history** (`get_messages` / `search_messages`) works because you're a real user, not a bot — bots can't see history they weren't part of.
- **`send_file`** takes a local path or a public URL; images go as photos unless `force_document` is set.
- The server connects to Telegram **lazily** on the first tool call and reuses one authorized client for its lifetime.

## Project layout

```
src/
  server.ts            # registers all 11 tools, connects stdio transport
  login.ts             # `npm run login` — interactive session-string generator
  config/config.ts     # envalid + dotenv (api id/hash, session, default chat)
  lib/
    client.ts          # lazy authorized GramJS client + resolveChat()
    register-tool.ts    # McpServer.registerTool wrapper (JSON out, error capture)
    sanitize.ts        # strip control/zero-width chars from returned content
    serialize.ts       # BigInt-safe, compact summaries of GramJS objects
    fields.ts          # shared zod fields (chat, parse_mode)
  tools/
    account.ts         # get_me / list_dialogs / resolve_entity
    messages.ts        # get/search/send/edit/delete/forward/mark_read
    files.ts           # send_file
    index.ts           # barrel re-export
```
