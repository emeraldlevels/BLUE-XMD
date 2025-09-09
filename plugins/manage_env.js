//---------------------------------------------------------------------------
//          TRACLE SETTINGS (Persistent Config Updates)
//---------------------------------------------------------------------------
//  ⚠️ DO NOT MODIFY THIS FILE DIRECTLY ⚠️  
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const config = require('../config');
const fs = require('fs');
const path = require('path');

// Path to config.js
const configPath = path.join(__dirname, '../config.js');

// === Helper: Update config.js persistently ===
function updateConfig(key, value) {
  try {
    let configFile = fs.readFileSync(configPath, 'utf8');

    // Replace matching key (string or boolean values)
    const regex = new RegExp(`(${key}:\\s*process\\.env\\.${key}\\s*\\|\\|\\s*")[^"]*(")`);
    if (regex.test(configFile)) {
      configFile = configFile.replace(regex, `$1${value}$2`);
    } else {
      // fallback: replace any direct assignment
      const fallbackRegex = new RegExp(`(${key}:\\s*")[^"]*(")`);
      configFile = configFile.replace(fallbackRegex, `$1${value}$2`);
    }

    fs.writeFileSync(configPath, configFile, 'utf8');

    // Update runtime config too
    config[key] = value;
    console.log(`✅ Updated ${key} to ${value}`);
  } catch (e) {
    console.error(`❌ Failed to update config.js for ${key}:`, e);
  }
}

// === Helper: Validate "on/off" arguments ===
const validateStatusArg = (arg) => {
  if (!arg) return null;
  const status = arg.toLowerCase();
  return (status === "on" || status === "off") ? status : null;
};

// === Template for toggle commands ===
function createToggleCommand(pattern, alias, desc, key, successMessages, react = "⚙️") {
  cmd({
    pattern,
    alias,
    desc,
    category: "settings",
    filename: __filename,
    react
  }, async (conn, mek, m, { args, isOwner, isAdmins, reply }) => {
    if (!isOwner && !isAdmins)
      return reply("*📛 Only admins or owner can use this command!*");

    const status = validateStatusArg(args[0]);
    if (status === null) return reply(`Example: .${pattern} on`);

    const value = status === "on" ? "true" : "false";
    const message = status === "on" ? successMessages.on : successMessages.off;

    updateConfig(key, value);
    return reply(message);
  });
}

// ─────────── Commands ───────────

// Admin Events
createToggleCommand(
  "admin-events",
  ["adminevents"],
  "Enable or disable admin event notifications",
  "ADMIN_EVENTS",
  {
    on: "✅ Admin event notifications are now enabled.",
    off: "❌ Admin event notifications are now disabled."
  },
  "👑"
);

// Welcome
createToggleCommand(
  "welcome",
  ["welcomeset"],
  "Enable or disable welcome messages",
  "WELCOME",
  {
    on: "✅ Welcome messages are now enabled.",
    off: "❌ Welcome messages are now disabled."
  },
  "🎉"
);

// Mention Reply
createToggleCommand(
  "mention-reply",
  ["mentionreply", "mee"],
  "Enable or disable mention reply feature",
  "MENTION_REPLY",
  {
    on: "✅ Mention reply is now enabled.",
    off: "❌ Mention reply is now disabled."
  },
  "💬"
);

// Always Online
createToggleCommand(
  "always-online",
  ["alwaysonline"],
  "Enable or disable always-online mode",
  "ALWAYS_ONLINE",
  {
    on: "✅ Always online mode enabled.",
    off: "❌ Always online mode disabled."
  },
  "🟢"
);

// Auto Seen
createToggleCommand(
  "auto-seen",
  ["autostatusview", "autoviewstatus"],
  "Enable or disable auto-viewing of statuses",
  "AUTO_STATUS_SEEN",
  {
    on: "✅ Auto-status view enabled.",
    off: "❌ Auto-status view disabled."
  },
  "👀"
);

// Status React
createToggleCommand(
  "status-react",
  ["statusreaction", "autolikestatus"],
  "Enable or disable auto-liking statuses",
  "AUTO_STATUS_REACT",
  {
    on: "✅ Auto-status reactions enabled.",
    off: "❌ Auto-status reactions disabled."
  },
  "❤️"
);

// Read Message
createToggleCommand(
  "read-message",
  ["autoread"],
  "Enable or disable auto read messages",
  "READ_MESSAGE",
  {
    on: "✅ Auto read enabled.",
    off: "❌ Auto read disabled."
  },
  "📖"
);

// Auto Voice
createToggleCommand(
  "auto-voice",
  ["autovoice"],
  "Enable or disable auto voice",
  "AUTO_VOICE",
  {
    on: "✅ Auto voice enabled.",
    off: "❌ Auto voice disabled."
  },
  "🎤"
);

// Auto Sticker
createToggleCommand(
  "auto-sticker",
  ["autosticker"],
  "Enable or disable auto sticker",
  "AUTO_STICKER",
  {
    on: "✅ Auto sticker enabled.",
    off: "❌ Auto sticker disabled."
  },
  "🖼️"
);

// Auto Reply
createToggleCommand(
  "auto-reply",
  ["autoreply"],
  "Enable or disable auto reply",
  "AUTO_REPLY",
  {
    on: "✅ Auto reply enabled.",
    off: "❌ Auto reply disabled."
  },
  "🤖"
);

// Auto React
createToggleCommand(
  "auto-react",
  ["autoreact"],
  "Enable or disable autoreact",
  "AUTO_REACT",
  {
    on: "✅ Autoreact enabled.",
    off: "❌ Autoreact disabled."
  },
  "⚡"
);

// Status Reply
createToggleCommand(
  "status-reply",
  ["autostatusreply"],
  "Enable or disable status reply",
  "AUTO_STATUS_REPLY",
  {
    on: "✅ Status reply enabled.",
    off: "❌ Status reply disabled."
  },
  "💬"
);

// ─────────── Special Commands ───────────

// Set Prefix
cmd({
  pattern: "setprefix",
  alias: ["prefix"],
  desc: "Change the bot's command prefix",
  category: "settings",
  filename: __filename,
  react: "🔧"
}, async (conn, mek, m, { args, isOwner, reply }) => {
  if (!isOwner) return reply("*📛 Only the owner can use this command!*");

  const newPrefix = args[0];
  if (!newPrefix) return reply("❌ Please provide a new prefix. Example: .setprefix !");

  updateConfig("PREFIX", newPrefix);
  return reply(`✅ Prefix successfully changed to *${newPrefix}*`);
});

// Mode (public/private)
cmd({
  pattern: "mode",
  alias: ["setmode"],
  desc: "Set bot mode to private or public",
  category: "settings",
  filename: __filename,
  react: "🫟"
}, async (conn, mek, m, { args, isOwner, reply }) => {
  if (!isOwner) return reply("*📛 Only the owner can use this command!*");

  if (!args[0]) {
    return reply(`📌 Current mode: *${config.MODE}*\n\nUsage: .mode private OR .mode public`);
  }

  const modeArg = args[0].toLowerCase();
  if (modeArg === "private") {
    updateConfig("MODE", "private");
    return reply("✅ Bot mode is now set to *PRIVATE*.");
  } else if (modeArg === "public") {
    updateConfig("MODE", "public");
    return reply("✅ Bot mode is now set to *PUBLIC*.");
  } else {
    return reply("❌ Invalid mode. Please use `.mode private` or `.mode public`.");
  }
});

// Set React (emojis, custom)
cmd({
  pattern: "setreact",
  alias: ["reactset", "setreaction"],
  desc: "Set custom emojis for status reactions",
  category: "settings",
  filename: __filename,
  react: "🎭"
}, async (conn, mek, m, { args, isOwner, isAdmins, reply }) => {
  if (!isOwner && !isAdmins) return reply("*📛 Only admins or owner can use this command!*");

  if (!args[0]) {
    return reply(`🎭 *REACTION SETTINGS*
• Auto Status React: ${config.AUTO_STATUS_REACT === "true" ? "✅ Enabled" : "❌ Disabled"}
• Custom React: ${config.CUSTOM_REACT === "true" ? "✅ Enabled" : "❌ Disabled"}
• Emojis: ${config.CUSTOM_REACT_EMOJIS || "Not set"}
`);
  }

  const action = args[0].toLowerCase();

  if (action === "on" || action === "off") {
    updateConfig("AUTO_STATUS_REACT", action === "on" ? "true" : "false");
    return reply(action === "on" ? "✅ Auto status reactions enabled." : "❌ Auto status reactions disabled.");
  }

  if (action === "custom") {
    const status = validateStatusArg(args[1]);
    if (!status) return reply("Usage: .setreact custom on/off");
    updateConfig("CUSTOM_REACT", status === "on" ? "true" : "false");
    return reply(status === "on" ? "✅ Custom reactions enabled." : "❌ Custom reactions disabled.");
  }

  if (action === "emojis" || action === "emoji") {
    const emojis = args.slice(1).join(" ").trim();
    if (!emojis) return reply("❌ Please provide emojis! Example: .setreact emojis 😊,❤️,🔥");
    updateConfig("CUSTOM_REACT_EMOJIS", emojis);
    updateConfig("CUSTOM_REACT", "true");
    return reply(`✅ Custom emojis set: ${emojis}`);
  }

  if (action === "reset") {
    const defaults = "🥲,😂,👍🏻,🙂,😔,❤️,🔥,🎉";
    updateConfig("CUSTOM_REACT_EMOJIS", defaults);
    return reply("✅ Emojis reset to default.");
  }

  return reply("❌ Invalid usage. Try `.setreact on/off/custom/emojis/reset`");
});
