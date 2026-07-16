import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { Logger, LogLevel } from "telegram/extensions/Logger.js";
import { config } from "../config/config.js";

/**
 * Lazily created, connected GramJS client acting as the logged-in USER account
 * (MTProto), NOT a bot. Shared across all tool calls for the server's lifetime
 * so entity lookups stay warm in the session cache.
 */
let clientPromise: Promise<TelegramClient> | undefined;

async function createClient(): Promise<TelegramClient> {
  if (!config.TELEGRAM_SESSION) {
    throw new Error(
      "TELEGRAM_SESSION is not set. Run `npm run login` to authenticate and generate a session string, then put it in .env.",
    );
  }

  // GramJS logs to stdout by default (including a version banner emitted in
  // the constructor), which would corrupt the stdio JSON-RPC stream. Pass a
  // silent logger so nothing is written before we even connect.
  const client = new TelegramClient(
    new StringSession(config.TELEGRAM_SESSION),
    config.TELEGRAM_API_ID,
    config.TELEGRAM_API_HASH,
    { connectionRetries: 5, baseLogger: new Logger(LogLevel.NONE) },
  );

  await client.connect();

  if (!(await client.isUserAuthorized())) {
    throw new Error(
      "The configured TELEGRAM_SESSION is not authorized (expired or revoked). Re-run `npm run login` to generate a fresh session string.",
    );
  }

  return client;
}

export function getClient(): Promise<TelegramClient> {
  if (!clientPromise) clientPromise = createClient();
  return clientPromise;
}

/**
 * Resolve the target chat for a call: explicit value wins, else fall back to
 * TELEGRAM_DEFAULT_CHAT. Accepts a numeric id, a string id, or an @username.
 */
export function resolveChat(chat?: string | number): string | number {
  if (chat !== undefined && chat !== "") return chat;
  if (config.TELEGRAM_DEFAULT_CHAT) return config.TELEGRAM_DEFAULT_CHAT;
  throw new Error(
    "No `chat` provided and TELEGRAM_DEFAULT_CHAT is not set. Pass a chat id or @username, or configure a default in .env.",
  );
}
