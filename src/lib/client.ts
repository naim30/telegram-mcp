import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { Logger, LogLevel } from "telegram/extensions/Logger.js";
import { config, getTelegramSession } from "../config/config.js";

let clientPromise: Promise<TelegramClient> | undefined;

async function createClient(): Promise<TelegramClient> {
  const session = getTelegramSession();
  if (!session) {
    throw new Error("error: no telegram session found");
  }

  const appId = config.TELEGRAM_API_ID;
  const appHash = config.TELEGRAM_API_HASH;

  const client = new TelegramClient(
    new StringSession(session),
    appId,
    appHash,
    {
      connectionRetries: 5,
      baseLogger: new Logger(LogLevel.NONE),
    },
  );

  await client.connect();

  if (!(await client.isUserAuthorized())) {
    throw new Error(
      "error: telegram session not authorized, re-run 'npm run login'",
    );
  }

  return client;
}

export function getClient(): Promise<TelegramClient> {
  if (!clientPromise) {
    clientPromise = createClient();
  }
  return clientPromise;
}
