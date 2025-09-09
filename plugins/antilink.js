const { cmd } = require('../command');
const config = require("../config");
const fs = require("fs");
const path = require("path");

// Path to config.js
const configPath = path.join(__dirname, "../config.js");

// === Helper: Update config.js persistently ===
function updateConfig(key, value) {
  try {
    let configFile = fs.readFileSync(configPath, "utf8");

    // Replace process.env || "default"
    const regex = new RegExp(`(${key}:\\s*process\\.env\\.${key}\\s*\\|\\|\\s*")[^"]*(")`);
    if (regex.test(configFile)) {
      configFile = configFile.replace(regex, `$1${value}$2`);
    } else {
      // fallback replace
      const fallbackRegex = new RegExp(`(${key}:\\s*")[^"]*(")`);
      configFile = configFile.replace(fallbackRegex, `$1${value}$2`);
    }

    fs.writeFileSync(configPath, configFile, "utf8");

    // update runtime config
    config[key] = value;
    global.antiLinkSettings[key] = (value === "true");
    console.log(`✅ Updated ${key} → ${value}`);
  } catch (e) {
    console.error(`❌ Failed to update config.js for ${key}:`, e);
  }
}

// Runtime toggles (linked with config)
if (!global.antiLinkSettings) {
  global.antiLinkSettings = {
    ANTI_LINK: config.ANTI_LINK === "true",
    DELETE_LINKS: config.DELETE_LINKS === "true",
    ANTI_LINK_KICK: config.ANTI_LINK_KICK === "true",
  };
}

// Track warnings
if (!global.warnings) global.warnings = {};

// ================== TOGGLE COMMAND ==================
cmd({
  pattern: "antilink",
  desc: "Toggle Anti-Link system (works in groups & DMs).",
  category: "admin",
  react: "🛡️",
  filename: __filename
}, async (conn, m, store, { from, isGroup, isAdmins, isOwner, args, reply }) => {
  
  // In groups → allow only admins & owner
  if (isGroup && !isAdmins && !isOwner) {
    return reply("❌ Only group admins or bot owner can use this here.");
  }

  // In DMs → allow only bot owner
  if (!isGroup && !isOwner) {
    return reply("❌ Only the bot owner can use this in DMs.");
  }

  if (!args[0]) {
    return reply(
      `⚙️ *Anti-Link Settings*\n\n` +
      `🔗 Anti-Link: ${global.antiLinkSettings.ANTI_LINK ? "✅ ON" : "❌ OFF"}\n` +
      `🗑️ Delete Links: ${global.antiLinkSettings.DELETE_LINKS ? "✅ ON" : "❌ OFF"}\n` +
      `🚫 Kick After 3 Warnings: ${global.antiLinkSettings.ANTI_LINK_KICK ? "✅ ON" : "❌ OFF"}\n\n` +
      `Usage:\n.antilink on/off\n.antilink del on/off\n.antilink kick on/off`
    );
  }

  const option = args[0].toLowerCase();
  const value = args[1] ? args[1].toLowerCase() : "";

  if (option === "on") {
    updateConfig("ANTI_LINK", "true");
    return reply("✅ Anti-Link system *enabled*.");
  } else if (option === "off") {
    updateConfig("ANTI_LINK", "false");
    return reply("❌ Anti-Link system *disabled*.");
  } else if (option === "del") {
    updateConfig("DELETE_LINKS", value === "on" ? "true" : "false");
    return reply(`🗑️ Link deletion ${value === "on" ? "*enabled*" : "*disabled*"}.`);
  } else if (option === "kick") {
    updateConfig("ANTI_LINK_KICK", value === "on" ? "true" : "false");
    return reply(`🚫 Kick after 3 warnings ${value === "on" ? "*enabled*" : "*disabled*"}.`);
  } else {
    return reply("❌ Invalid option.\nUse: .antilink [on/off|del on/off|kick on/off]");
  }
});

// ================== ANTI-LINK HANDLER ==================
cmd({
  on: "body"
}, async (conn, m, store, { from, body, sender, isGroup, isAdmins, isBotAdmins }) => {
  try {
    if (!isGroup) return;
    if (!global.antiLinkSettings.ANTI_LINK) return;
    if (isAdmins) return; // skip group admins

    // link patterns
    const linkPatterns = [
      /https?:\/\/(?:chat\.whatsapp\.com|wa\.me)\/\S+/gi,
      /https?:\/\/(?:t\.me|telegram\.me)\/\S+/gi,
      /https?:\/\/(?:www\.)?(youtube\.com|youtu\.be)\/\S+/gi,
      /https?:\/\/(?:www\.)?facebook\.com\/\S+/gi,
      /https?:\/\/(?:www\.)?instagram\.com\/\S+/gi,
      /https?:\/\/(?:www\.)?twitter\.com\/\S+/gi,
      /https?:\/\/(?:www\.)?tiktok\.com\/\S+/gi,
      /https?:\/\/(?:www\.)?linkedin\.com\/\S+/gi,
      /https?:\/\/(?:www\.)?discord\.com\/\S+/gi,
      /https?:\/\/(?:www\.)?twitch\.tv\/\S+/gi,
      /https?:\/\/(?:www\.)?vimeo\.com\/\S+/gi,
      /https?:\/\/(?:www\.)?dailymotion\.com\/\S+/gi,
      /https?:\/\/(?:www\.)?medium\.com\/\S+/gi,
      /https?:\/\/(?:www\.)?reddit\.com\/\S+/gi
    ];

    const containsLink = linkPatterns.some(pattern => pattern.test(body || ""));
    if (!containsLink) return;

    // === If bot is NOT admin, just warn ===
    if (!isBotAdmins) {
      return conn.sendMessage(from, {
        text: `⚠️ Link detected, but I am not admin so I cannot delete or kick.\nUser: @${sender.split('@')[0]}`,
        mentions: [sender]
      });
    }

    // === Delete the message if enabled ===
    if (global.antiLinkSettings.DELETE_LINKS) {
      try {
        await conn.sendMessage(from, { delete: m.key });
      } catch (e) {
        console.error("❌ Failed to delete link:", e);
      }
    }

    // === Warn user and possibly kick ===
    global.warnings[sender] = (global.warnings[sender] || 0) + 1;
    const warningCount = global.warnings[sender];

    if (global.antiLinkSettings.ANTI_LINK_KICK && warningCount >= 3) {
      await conn.sendMessage(from, {
        text: `🚫 @${sender.split('@')[0]} removed for posting links (3 warnings).`,
        mentions: [sender]
      });
      await conn.groupParticipantsUpdate(from, [sender], "remove");
      delete global.warnings[sender];
    } else {
      await conn.sendMessage(from, {
        text: `⚠️ Link detected!\nUser: @${sender.split('@')[0]}\nWarnings: ${warningCount}/3`,
        mentions: [sender]
      });
    }

  } catch (error) {
    console.error("AntiLink Error:", error);
  }
});
