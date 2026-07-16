# CLAUDE.md

Guidance for working in this repo.

## What this is

An MCP server that drives Telegram as the **logged-in user account** over MTProto
(via [GramJS](https://gram.js.org/)) — **not** a BotFather bot. Auth is a saved
session string, so it can read/search history and message anyone, which bots can't.

Exposed over **stdio** to MCP clients. 11 tools. See `README.md` for user-facing setup.

## Commands

```bash
npm install
npm run build     # tsc -p . → dist/
npm run login     # interactive: phone → code → 2FA, prints TELEGRAM_SESSION
npm start         # runs dist/server.js (needs a valid .env)
```

There is no test suite yet. To smoke-test the server, drive `dist/server.js` over
stdio with JSON-RPC (`initialize` → `notifications/initialized` → `tools/list`).

## Architecture

```
src/
  server.ts          registers every tool, connects StdioServerTransport
  login.ts           `npm run login` — standalone session-string generator
  config/config.ts   envalid + dotenv → typed `config` (api id/hash, session, default chat)
  lib/
    client.ts        getClient() lazy singleton GramJS client + resolveChat()
    register-tool.ts  wraps McpServer.registerTool: JSON-stringifies result, catches errors → isError
    sanitize.ts      strips control/zero-width chars from returned text (prompt-injection defense)
    serialize.ts     compact, BigInt-safe summaries of GramJS objects
    fields.ts        shared zod fields (chat, parse_mode)
  tools/
    account.ts       get_me, list_dialogs, resolve_entity
    messages.ts      get_messages, search_messages, send_message, edit_message,
                     delete_message, forward_message, mark_read
    files.ts         send_file
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
  - `input`: a `z.object({...})`; every field has a `.describe()`.
  - `handler`: `async (args) => unknown`; return plain JSON-safe data.
- **Never return raw GramJS objects** — they are circular (reference the client) and
  hold big-integer ids. Always map through `summarizeMessage` / `summarizeEntity`.
- **Sanitize all user-controlled text** (message bodies, names, titles) via
  `sanitizeText` / `sanitizeName` before returning it.
- **Group by domain** in `src/tools/`, re-export from `index.ts`.
- Style mirrors the sibling `memora` MCP (see `../Automation/memora`).

## Adding a tool

1. In the right `src/tools/*.ts`, define `const XInput = z.object({...})`, an
   `async function handleX(input)`, and
   `export const X = { name, description, input: XInput, handler: handleX }`.
2. Re-export `X` from `src/tools/index.ts`.
3. Register it in `src/server.ts` with
   `registerTool(server, X.name, X.description, X.input, X.handler)`.
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
  lifetime. If `TELEGRAM_SESSION` is missing/expired, `getClient()` throws an
  actionable error telling the user to run `npm run login`.

## Secrets & safety

- `.env` is gitignored. `TELEGRAM_SESSION` = **full access to the account** — never
  log it, print it, or commit it.
- This automates a *user* account. Spammy/bulk behavior can get the account banned —
  keep tool actions deliberate and user-initiated.
