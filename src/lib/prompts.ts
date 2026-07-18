import { register } from "promptoro";
import { z } from "zod";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PromptSchema = z.object({
  name: z.string(),
  description: z.string(),
  fields: z
    .record(z.string(), z.object({ description: z.string() }))
    .default({}),
});

export type Prompt = z.infer<typeof PromptSchema>;

const here = dirname(fileURLToPath(import.meta.url));

export const prompts = register<Prompt>(join(here, "../prompts"), {
  schema: PromptSchema,
  filenames: [
    /* Account */
    "get_me", // my own account
    "get_entity", // basic lookup by @username or id
    "get_full_entity", // full profile (bio, member/admin counts)
    "list_dialogs", // recent chats (warms the entity cache)
    "get_user_photos", // a user's profile photos

    /* Profile (your account) */
    "update_profile", // change your name/bio
    "set_username", // change your @username
    "set_online_status", // set online/offline

    /* Messages */
    "get_messages", // recent history in a chat
    "search_messages", // search within one chat
    "search_global", // search across all chats
    "get_pinned_messages", // list a chat's pinned messages
    "get_message_read_by", // who has read a message (small groups)
    "send_message", // send text (optionally scheduled)
    "edit_message", // edit a sent message
    "delete_message", // delete message(s)
    "forward_message", // forward messages between chats
    "send_reaction", // react with an emoji (or clear it)
    "save_draft", // set/clear a chat's draft
    "mark_read", // mark a chat as read
    "pin_message", // pin a message
    "unpin_message", // unpin one or all
    "list_scheduled_messages", // list pending scheduled messages
    "delete_scheduled_message", // cancel a scheduled message
    // ── not yet implemented ──
    // scheduled *sending* is built into send_message via its `schedule` arg
    // "reply_to_message",      // reply to a specific message
    // "get_message_reactions", // who reacted, and with what
    // "create_poll",           // post a poll
    // "vote_poll",             // vote in a poll
    // "list_inline_buttons",   // read a message's inline buttons
    // "press_inline_button",   // click an inline/callback button

    /* Files */
    "send_file", // send a file/photo/voice/video
    "download_media", // save a message's attachment to disk
    "get_sticker_sets", // list your installed sticker sets
    // ── not yet implemented ──
    // "send_album",            // send several files as one album
    // "send_sticker",          // send a sticker
    // "send_gif",              // send a gif
    // "upload_file",           // upload without sending (reusable handle)
    // "get_media_info",        // inspect a message's media metadata

    /* Membership */
    "list_participants", // members of a group/channel
    "get_admins", // a chat's administrators
    "join_chat", // join by @username or invite link
    "leave_chat", // leave a group/channel

    /* Admin */
    "set_slow_mode", // set a supergroup's slow-mode delay
    "export_chat_invite", // create/fetch an invite link
    // ── not yet implemented ──
    // "create_group",          // create a basic group
    // "create_channel",        // create a channel/supergroup
    // "invite_to_chat",        // add users to a group/channel
    // "promote_admin",         // grant admin rights
    // "demote_admin",          // revoke admin rights
    // "ban_user",              // ban a user from a chat
    // "unban_user",            // lift a ban
    // "get_banned_users",      // list banned users
    // "edit_chat_title",       // rename a chat
    // "edit_chat_about",       // set a chat's description
    // "edit_chat_photo",       // set a chat's photo
    // "delete_chat_photo",     // remove a chat's photo
    // "get_admin_log",         // recent admin actions (audit log)
    // "list_topics",           // forum topics in a supergroup
    // "create_forum_topic",    // create a forum topic

    /* Chat organization */
    "mute_chat", // mute notifications
    "unmute_chat", // unmute notifications
    "archive_chat", // archive a chat
    "unarchive_chat", // unarchive a chat
    "list_folders", // list chat folders
    // ── not yet implemented ──
    // "create_folder",         // create a chat folder
    // "delete_folder",         // delete a chat folder
    // "add_chat_to_folder",    // add a chat to a folder
    // "remove_chat_from_folder",// remove a chat from a folder

    /* Contacts */
    "list_contacts", // saved contacts
    "add_contact", // add a contact
    "delete_contact", // remove a contact
    // ── not yet implemented ──
    // "import_contacts",       // bulk-add contacts by phone
    // "export_contacts",       // dump your contacts
    // "send_contact",          // share a contact card
    // "get_last_interaction",  // last seen/interaction with a user

    /* Block */
    "block_user", // block user
    "unblock_user", // unblock user
    "get_blocked_users", // list everyone you've blocked

    /* Profile & privacy — not yet implemented */
    // "set_profile_photo",     // set your avatar
    // "delete_profile_photo",  // remove your avatar
    // "get_privacy_settings",  // read privacy settings
    // "set_privacy_settings",  // change privacy settings
  ],
});
