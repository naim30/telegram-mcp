import { config as loadDotenv } from "dotenv";
import { cleanEnv, num, str } from "envalid";
import { findPackageJSON } from "node:module";
import { dirname, resolve } from "node:path";

export const rootPath = dirname(findPackageJSON("./", import.meta.url)!);
loadDotenv({ path: resolve(rootPath, ".env") });

export const config = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ["development", "production"],
    default: "production",
    devDefault: "development",
  }),

  // App credentials from https://my.telegram.org/apps — identify the client,
  // NOT the account. Required for both login and the running server.
  TELEGRAM_API_ID: num(),
  TELEGRAM_API_HASH: str(),

  // Portable MTProto session for the logged-in USER account, produced by
  // `npm run login`. Empty is allowed so the login script can run first; the
  // server refuses to start without it.
  TELEGRAM_SESSION: str({ default: "" }),

  // Optional default chat used when a tool call omits `chat`.
  TELEGRAM_DEFAULT_CHAT: str({ default: "" }),
});
