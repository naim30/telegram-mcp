#!/usr/bin/env node

import { Logger, TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import * as readline from "node:readline/promises";
import { writeFileSync } from "node:fs";
import { stdin, stdout } from "node:process";
import { config, telegramSessionPath } from "../config/config.js";
import { LogLevel } from "telegram/extensions/Logger.js";

let ioEnable = true;

const rl = readline.createInterface({ input: stdin, output: stdout });
rl.on("close", () => {
  ioEnable = false;
});

const ask = async (question: string): Promise<string> => {
  if (!ioEnable) {
    throw new Error("error: disabled io stream");
  }
  return (await rl.question(question)).trim();
};

async function main() {
  console.log("\nTelegram MCP, session login.\n");

  const appId = config.TELEGRAM_API_ID;
  const appHash = config.TELEGRAM_API_HASH;

  const client = new TelegramClient(new StringSession(""), appId, appHash, {
    connectionRetries: 5,
    baseLogger: new Logger(LogLevel.NONE),
  });

  await client.start({
    phoneNumber: async () => {
      return ask("phone number, e.g. +14445556666: ");
    },
    password: async () => {
      return ask("two-factor password, leave blank if none: ");
    },
    phoneCode: async () => {
      return ask("login code:  ");
    },
    onError: async (err) => {
      if (!ioEnable) {
        return true;
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error("error:", msg);
      return false;
    },
  });

  const session = String(client.session.save());
  writeFileSync(telegramSessionPath, session, { mode: 0o600 });

  await client.disconnect();
  rl.close();

  console.log("\nTelegram MCP, session saved.\n");
  process.exit(0);
}

main().catch((err) => {
  rl.close();
  process.exit(1);
});
