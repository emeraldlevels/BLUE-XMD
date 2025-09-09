const { cmd } = require('../command');
const config = require('../config');
const fs = require('fs');
const path = require('path');

// === Helper to update config persistently ===
function updateConfig(key, value) {
  try {
    const configPath = path.join(__dirname, '../config.js');
    let configFile = fs.readFileSync(configPath, 'utf8');

    const regex = new RegExp(`(${key}:\\s*process\\.env\\.${key}\\s*\\|\\|\\s*")[^"]*(")`);
    configFile = configFile.replace(regex, `$1${value}$2`);

    fs.writeFileSync(configPath, configFile, 'utf8');
    config[key] = value;
    console.log(`✅ Updated ${key} to ${value}`);
  } catch (e) {
    console.error("❌ Failed to update config.js:", e);
  }
}

// === MAIN SUPPORT MENU ===
cmd({
  pattern: "support",
  alias: ["links", "socials"],
  desc: "Get all official support and social links",
  category: "info",
  use: ".support",
  filename: __filename
}, async (conn, m, store, { from, reply }) => {
  try {
    await conn.sendMessage(from, { react: { text: "🙏", key: m.key } });

    let lines = [];
    lines.push(`╭───〔 ${config.BOT_NAME} 𝙎𝙐𝙋𝙋𝙊𝙍𝙏 〕───╮\n│`);

    if (config.BOT_CHANNEL)  lines.push(`├ 📢 *Channel:* ${config.BOT_CHANNEL}`);
    if (config.REPO_LINK)    lines.push(`├ 💻 *Repository:* ${config.REPO_LINK}`);
    if (config.YOUTUBE)      lines.push(`├ 🎥 *YouTube:* ${config.YOUTUBE}`);
    if (config.TIKTOK)       lines.push(`├ 🎶 *TikTok:* ${config.TIKTOK}`);
    if (config.INSTAGRAM)    lines.push(`├ 📸 *Instagram:* ${config.INSTAGRAM}`);
    if (config.TWITTER)      lines.push(`├ 🐦 *Twitter:* ${config.TWITTER}`);
    if (config.DISCORD)      lines.push(`├ 💬 *Discord:* ${config.DISCORD}`);
    if (config.WEBSITE)      lines.push(`├ 🌐 *Website:* ${config.WEBSITE}`);
    if (config.COMMUNITY)    lines.push(`├ 👥 *Community:* ${config.COMMUNITY}`);

    lines.push(`│\n╰───────────────◆`);
    let menu = lines.join("\n");

    await conn.sendMessage(from, {
      text: menu,
      contextInfo: {
        externalAdReply: {
          title: `${config.BOT_NAME} Support`,
          body: "Official Support & Social Links",
          thumbnailUrl: config.MENU_IMAGE_URL,
          sourceUrl: config.REPO_LINK,
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: m });

  } catch (e) {
    console.error(e);
    reply("❌ Failed to load support menu. Try again later.");
  }
});

// === OWNER ONLY COMMANDS TO UPDATE LINKS ===
function makeSetterCommand(pattern, key, emoji, usage) {
  cmd({
    pattern,
    desc: `Set ${key} (Owner only)`,
    category: "owner",
    filename: __filename
  }, async (conn, m, store, { from, reply, args, isCreator }) => {
    if (!isCreator) return reply("❌ Owner only command or try in dm's.");
    if (!args[0]) return reply(`Usage: ${usage}`);

    const newValue = args.join(" ");
    updateConfig(key, newValue);

    await conn.sendMessage(from, { react: { text: emoji, key: m.key } });
    reply(`✅ ${key} updated to:\n${newValue}`);
  });
}

// Create all setter commands
makeSetterCommand("setchannel", "BOT_CHANNEL", "📢", ".setchannel <link>");
makeSetterCommand("setrepo", "REPO_LINK", "💻", ".setrepo <link>");
makeSetterCommand("setyoutube", "YOUTUBE", "🎥", ".setyoutube <link>");
makeSetterCommand("settiktok", "TIKTOK", "🎶", ".settiktok <link>");
makeSetterCommand("setinstagram", "INSTAGRAM", "📸", ".setinstagram <link>");
makeSetterCommand("settwitter", "TWITTER", "🐦", ".settwitter <link>");
makeSetterCommand("setdiscord", "DISCORD", "💬", ".setdiscord <link>");
makeSetterCommand("setwebsite", "WEBSITE", "🌐", ".setwebsite <link>");
makeSetterCommand("setcommunity", "COMMUNITY", "👥", ".setcommunity <link>");
