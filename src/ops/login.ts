#!/usr/bin/env node

import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import * as readline from "node:readline/promises";
import { writeFileSync } from "node:fs";
import { stdin, stdout } from "node:process";
import { config, telegramSessionPath } from "../config/config.js";

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
  console.log("\nTelegram MCP, Session Login\n");

  const appId = config.TELEGRAM_API_ID;
  const appHash = config.TELEGRAM_API_HASH;

  const client = new TelegramClient(new StringSession(""), appId, appHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => ask("phone number, e.g. +14445556666: "),
    password: async () => ask("two-factor password, leave blank if none: "),
    phoneCode: async () => ask("login code:  "),
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

  console.log("\nTelegram MCP, Session Saved");

  await client.disconnect();
  rl.close();
  process.exit(0);
}

main().catch((err) => {
  rl.close();
  process.exit(1);
});
