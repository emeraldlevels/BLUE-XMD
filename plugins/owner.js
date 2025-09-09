const { cmd } = require('../command');
const config = require('../config');
const fs = require('fs');
const path = require('path');

// === Helper to update config.js persistently ===
function updateConfig(key, value) {
  try {
    const configPath = path.join(__dirname, '../config.js');
    let configFile = fs.readFileSync(configPath, 'utf8');

    // Regex: replace process.env fallback default with new value
    const regex = new RegExp(`(${key}:\\s*process\\.env\\.${key}\\s*\\|\\|\\s*")[^"]*(")`);
    configFile = configFile.replace(regex, `$1${value}$2`);

    fs.writeFileSync(configPath, configFile, 'utf8');

    // Update runtime config too
    config[key] = value;
    console.log(`✅ Updated ${key} to ${value}`);
  } catch (e) {
    console.error("❌ Failed to update config.js:", e);
  }
}

// ─────────── Owner Info Command ───────────
cmd({
  pattern: "owner",
  react: "✅",
  desc: "Get owner contact",
  category: "main",
  filename: __filename
},
async (conn, mek, m, { from, reply }) => {
  try {
    const ownerNumber = config.OWNER_NUMBER;
    const ownerName = config.OWNER_NAME;

    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${ownerName}
ORG:BrenaldMedia;
TEL;type=CELL;type=VOICE;waid=${ownerNumber.replace('+', '')}:${ownerNumber}
NOTE:Owner of Tracle Bot
END:VCARD`;

    await conn.sendMessage(from, {
      contacts: {
        displayName: ownerName,
        contacts: [{
          displayName: ownerName,
          vcard: vcard
        }]
      }
    });

    await conn.sendMessage(from, {
      image: { url: "https://files.catbox.moe/4zbgw2.png" },
      caption: `╭━━〔 *TRACLE* 〕━━┈⊷
┃◈╭─────────────·๏
┃◈┃• *Owner Details*
┃◈┃• *Name* - ${ownerName}
┃◈┃• *Number* - ${ownerNumber}
┃◈┃• *Version*: 1.0.0
┃◈└───────────┈⊷
╰──────────────┈⊷
> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ BrenaldMedia`,
      contextInfo: {
        mentionedJid: [`${ownerNumber.replace('+', '')}@s.whatsapp.net`],
        forwardingScore: 999,
        isForwarded: true
      }
    }, { quoted: mek });

  } catch (error) {
    console.error(error);
    reply("❌ Could not fetch owner info.");
  }
});

// ─────────── Set Owner Number ───────────
cmd({
  pattern: "setownernum",
  react: "⚙️",
  desc: "Set a new owner number (Owner only)",
  category: "owner",
  filename: __filename
},
async (conn, mek, m, { from, reply, args, isCreator }) => {
  if (!isCreator) return reply("❌ Owner only command.");
  if (!args[0]) return reply("⚠️ Usage: .setownernum <new_number>");

  const newNumber = args[0].replace(/[^0-9+]/g, "");
  updateConfig("OWNER_NUMBER", newNumber);

  await conn.sendMessage(from, { react: { text: "📱", key: m.key } });
  reply(`✅ Owner number updated to: *${newNumber}*`);
});

// ─────────── Set Owner Name ───────────
cmd({
  pattern: "setownername",
  react: "⚙️",
  desc: "Set a new owner name (Owner only)",
  category: "owner",
  filename: __filename
},
async (conn, mek, m, { from, reply, args, isCreator }) => {
  if (!isCreator) return reply("❌ Owner only command.");
  if (!args[0]) return reply("⚠️ Usage: .setownername <new_name>");

  const newName = args.join(" ");
  updateConfig("OWNER_NAME", newName);

  await conn.sendMessage(from, { react: { text: "👤", key: m.key } });
  reply(`✅ Owner name updated to: *${newName}*`);
});
