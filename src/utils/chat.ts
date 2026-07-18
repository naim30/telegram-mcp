export function validateChat(chat?: string | number): string | number {
  if (!chat) {
    throw new Error("error: no chat found, add chat id, @username or me");
  }
  return chat;
}
