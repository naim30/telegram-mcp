import { config as loadDotenv } from "dotenv";
import { cleanEnv, num, str } from "envalid";
import { readFileSync } from "node:fs";
import { findPackageJSON } from "node:module";
import { dirname, resolve } from "node:path";

export const rootPath = dirname(findPackageJSON("./", import.meta.url)!);
loadDotenv({ path: resolve(rootPath, ".env") });

export const config = cleanEnv(process.env, {
  TELEGRAM_API_ID: num(),
  TELEGRAM_API_HASH: str(),

  SESSION_PATH: str(),
});

export const telegramSessionPath = config.SESSION_PATH
  ? resolve(config.SESSION_PATH, ".telegram-session")
  : resolve(rootPath, ".telegram-session");

export const getTelegramSession = () => {
  try {
    return readFileSync(telegramSessionPath, "utf8").trim();
  } catch {
    return "";
  }
};
