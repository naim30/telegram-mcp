#!/usr/bin/env node

/**
 * One-time interactive login. Authenticates as your Telegram USER account and
 * prints a portable session string to paste into TELEGRAM_SESSION in .env.
 * Run with `npm run login` (after `npm run build`). This is deliberately a
 * standalone script, not an MCP tool — the phone/code/2FA prompts are
 * interactive and don't fit the request/response tool model.
 */

import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { Logger, LogLevel } from "telegram/extensions/Logger.js";
import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { config } from "./config/config.js";

const rl = readline.createInterface({ input: stdin, output: stdout });
const ask = (question: string) => rl.question(question);

async function main() {
  console.log("\nTelegram MCP — session login\n");
  console.log(
    "You'll be asked for your phone number, the login code Telegram sends you,\n" +
      "and your two-factor password if you have one set.\n",
  );

  const client = new TelegramClient(
    new StringSession(""),
    config.TELEGRAM_API_ID,
    config.TELEGRAM_API_HASH,
    { connectionRetries: 5, baseLogger: new Logger(LogLevel.NONE) },
  );

  await client.start({
    phoneNumber: async () =>
      (await ask("Phone number (international, e.g. +14155551234): ")).trim(),
    password: async () =>
      (await ask("Two-factor password (leave blank if none): ")).trim(),
    phoneCode: async () =>
      (await ask("Login code Telegram just sent you: ")).trim(),
    onError: (err) =>
      console.error("Login error:", err instanceof Error ? err.message : err),
  });

  const session = String(client.session.save());
  console.log(
    "\n✅ Logged in. Copy the line below into your .env as TELEGRAM_SESSION:\n",
  );
  console.log(session);
  console.log(
    "\nKeep it secret — this string grants full access to your account.\n",
  );

  await client.disconnect();
  rl.close();
  process.exit(0);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack : err);
  process.exit(1);
});
