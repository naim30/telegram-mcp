# CLAUDE.md

Guidance for working in this repo.

## What this is

An MCP server that drives Telegram as the **logged-in user account** over MTProto
(via [GramJS](https://gram.js.org/)) — **not** a BotFather bot. Auth is a saved
session string, so it can read/search history and message anyone, which bots can't.

Exposed over **stdio** to MCP clients. 44 tools. See `README.md` for user-facing setup.

## Commands

```bash
npm install
npm run build     # tsc -p . → dist/
npm run login     # interactive: phone → code → 2FA, saves .telegram-session
npm start         # runs dist/server.js (needs a valid .env)
```

There is no test suite yet. To smoke-test the server, drive `dist/server.js` over
stdio with JSON-RPC (`initialize` → `notifications/initialized` → `tools/list`).

## Architecture

```
src/
  server.ts          registers every tool, connects StdioServerTransport
  ops/login.ts       `npm run login` — standalone session-string generator
  config/config.ts   envalid + dotenv → typed `config` (api id/hash, session) + rootPath
  lib/
    client.ts        getClient() lazy singleton GramJS client
    register-tool.ts  registerTool(server, tool) + annotate() annotation helper + Tool type
    prompts.ts       loads tool prose from src/prompts/*.yml via promptoro
    sanitize.ts      strips control/zero-width chars from returned text (prompt-injection defense)
    serialize.ts     compact, BigInt-safe summaries of GramJS objects
  utils/chat.ts      validateChat() — require an explicit chat target (no default)
  constants.ts       shared literal field VALUES only (e.g. ParseMode); no prose
  prompts/*.yml      per-tool name/description/field text — ALL field descriptions
                     live here, including shared ones like `chat`/`user`/`parse_mode`
  tools/             ONE FILE PER prompts.ts group (same name); tools live in the file matching their group
    account.ts       get_me, update_profile, set_username, set_online_status  (your own account)
    users.ts         get_entity, get_full_entity, get_user_photos            (look up others)
    messages.ts      get_messages, search_messages, search_global, get_pinned_messages,
                     get_message_read_by, send_message (with `schedule`), edit_message,
                     delete_message, forward_message, send_reaction, save_draft, mark_read,
                     pin_message, unpin_message, list_scheduled_messages, delete_scheduled_message
    files.ts         send_file, download_media, get_sticker_sets
    chats.ts         list_dialogs, mute_chat, unmute_chat, archive_chat, unarchive_chat, list_folders
    groups.ts        list_participants, get_admins, join_chat, leave_chat, set_slow_mode, export_chat_invite
    contacts.ts      list_contacts, add_contact, delete_contact, block_user, unblock_user, get_blocked_users
    index.ts         barrel re-export
```

Flow: `server.ts` registers tools → a tool handler calls `getClient()` → GramJS
method → result passed through `serialize.ts` (which calls `sanitize.ts`) → returned.

## Conventions

- **ESM + NodeNext.** All local imports end in `.js` (e.g. `./lib/client.js`), even
  from `.ts` files. GramJS deep imports must be explicit files:
  `telegram/sessions/index.js`, `telegram/extensions/Logger.js` (bare subpaths fail).
- **One tool = one exported object** `{ name, description, input, handler }`:
  - `name`: snake_case (`send_message`).
  - `description`: rich and specific — say *what it does*, *when to use it vs.
    alternatives*, and Telegram-specific caveats. This is how the model picks tools.
  - `input`: a `z.object({...})`; every field's `.describe()` pulls its text from
    the tool's own YAML — `.describe(fooPrompt.fields.<field>.description)`. **All
    description prose lives in YAML**, never hard-coded in the `.ts`. This applies
    even to fields repeated across tools (`chat`, `user`, `parse_mode`): each tool
    inlines the zod and reads its *own* YAML description. Only shared literal
    *values* (e.g. the `ParseMode` enum) are factored out, into `constants.ts`.
  - `handler`: `async (args) => unknown`; return plain JSON-safe data.
- **Never return raw GramJS objects** — they are circular (reference the client) and
  hold big-integer ids. Always map through `summarizeMessage` / `summarizeEntity`.
- **Sanitize all user-controlled text** (message bodies, names, titles) via
  `sanitizeText` / `sanitizeName` before returning it.
- **One file per group.** `src/tools/*.ts` maps 1:1 to the groups in
  `prompts.ts` (`account`, `users`, `messages`, `files`, `chats`, `groups`,
  `contacts`) — a tool lives in the file named after its group. Add a new group →
  add the matching file. Re-export from `index.ts`.
- **Every tool declares `annotations`** built with the single `annotate(title,
  access, opts?)` helper from `lib/register-tool.js` — `annotate("X", "read")` or
  `annotate("X", "write", { destructive?, idempotent? })`. It sets MCP
  `readOnlyHint`/`destructiveHint` so a client (e.g. Claude Desktop) can
  auto-approve read tools and gate writes. Overloads make it a type error to pass
  write-only opts to a "read", so a tool is *purely* one or the other — never fold
  a read and a write into one tool, or the gating breaks.
  Reads (17): `get_me`, `get_entity`, `get_full_entity`, `list_dialogs`,
  `get_user_photos`, `get_messages`, `search_messages`, `search_global`,
  `get_pinned_messages`, `get_message_read_by`, `list_scheduled_messages`,
  `get_sticker_sets`, `list_participants`, `get_admins`, `list_folders`,
  `list_contacts`, `get_blocked_users`. Everything else is a write
  (`delete_message` and `delete_scheduled_message` are also `destructive`;
  `download_media` is a write because it writes a file to disk).
- Style mirrors the sibling `memora` MCP (see `../Automation/memora`).

## Adding a tool

1. In the right `src/tools/*.ts`, define `const XInput = z.object({...})`, an
   `async function handleX(input)`, and `export const X = { name, description,
   input: XInput, handler: handleX, annotations: annotate("X", "read") }` — use
   `annotate("X", "write")` (or `annotate("X", "write", { destructive: true })`)
   for anything that mutates.
2. Re-export `X` from `src/tools/index.ts`.
3. Register it in `src/server.ts` with `registerTool(server, X)` (the tool object
   carries name/description/input/handler/annotations).
4. `npm run build`.

## Gotchas

- **GramJS logs to stdout**, including a version banner emitted *in the constructor*.
  That corrupts the JSON-RPC stream. Always construct the client with
  `{ baseLogger: new Logger(LogLevel.NONE) }` — see `lib/client.ts`. Do not rely on
  `setLogLevel()` alone; it runs too late to suppress the banner.
- **`chat` targets:** accept `@username`, numeric id, string id, or `'me'`. Numeric
  ids resolve reliably only after the entity is seen this session — `list_dialogs`
  warms the cache. Prefer `@username` when unsure.
- The client connects **lazily** on first tool call and is reused for the process
  lifetime. The session is resolved by `loadSession()` (config.ts): the
  `TELEGRAM_SESSION` env var wins, else the `.telegram-session` file written by
  `npm run login`. If neither exists (or it's expired), `getClient()` throws an
  actionable error telling the user to run `npm run login`.

## Secrets & safety

- `.env` **and `.telegram-session`** are gitignored. The session string =
  **full access to the account** — never log it, print it, or commit it.
  `npm run login` writes `.telegram-session` with `0o600` perms; the server
  reads it automatically so users don't paste it into `.env`.
- This automates a *user* account. Spammy/bulk behavior can get the account banned —
  keep tool actions deliberate and user-initiated.
