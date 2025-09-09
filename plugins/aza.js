const { cmd } = require('../command');
const config = require('../config');
const fs = require('fs');
const path = require('path');

// Helper to update config.js file (persistent)
function updateConfig(key, value) {
  try {
    const configPath = path.join(__dirname, '../config.js');
    let configFile = fs.readFileSync(configPath, 'utf8');

    // Replace the line with the new value
    const regex = new RegExp(`(${key}:\\s*process\\.env\\.${key}\\s*\\|\\|\\s*")[^"]*(")`);
    configFile = configFile.replace(regex, `$1${value}$2`);

    fs.writeFileSync(configPath, configFile, 'utf8');

    // Update runtime config too
    config[key] = value;
    console.log(`✅ Updated ${key} to ${value}`);
  } catch (e) {
    console.error("Failed to update config.js:", e);
  }
}

cmd({
  pattern: "aza",
  alias: ["bank"],
  desc: "Fetch bot owner's bank account details",
  category: "info",
  use: ".aza / .bank",
  filename: __filename
}, async (conn, m, store, { from, reply }) => {
  try {
    if (!config.BANK_NAME || !config.ACCOUNT_NUMBER || !config.ACCOUNT_NAME) {
      return reply("❌ Bank details are not set. Please update config.js or config.env.");
    }

    await conn.sendMessage(from, {
      react: { text: "💳", key: m.key }
    });

    let details = `
╭━━━〔 💳 *ACCOUNT DETAILS* 〕━━━╮
│
│ 🏦  *Bank:*  ${config.BANK_NAME}
│ 👤  *Name:*  ${config.ACCOUNT_NAME}
│ 🔢  *Account:* 
│        \`\`\`${config.ACCOUNT_NUMBER}\`\`\`
│
│ 💡 Long-press account number to copy
│
╰━━━━━━━━━━━━━━━━━━━━━━━◆`;

    await conn.sendMessage(from, {
      text: details,
      contextInfo: {
        externalAdReply: {
          title: "💳 Bank Account Details",
          body: `${config.OWNER_NAME}'s Official Account`,
          thumbnailUrl: config.MENU_IMAGE_URL,
          sourceUrl: config.REPO_LINK,
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: m });

  } catch (e) {
    console.error(e);
    reply("❌ Failed to fetch bank details. Try again later.");
  }
});

// === OWNER ONLY COMMANDS TO UPDATE BANK INFO ===

// Set Bank Name
cmd({
  pattern: "setbank",
  desc: "Set bank name (Owner only)",
  category: "owner",
  filename: __filename
}, async (conn, m, store, { from, reply, args, isCreator }) => {
  if (!isCreator) return reply("❌ Owner only command or try in dm's.");
  if (!args[0]) return reply("Usage: .setbank <Bank Name>");

  const newBank = args.join(" ");
  updateConfig("BANK_NAME", newBank);

  await conn.sendMessage(from, {
    react: { text: "🏦", key: m.key }
  });

  reply(`✅ Bank name updated to *${newBank}*`);
});

// Set Account Name
cmd({
  pattern: "setaccountname",
  desc: "Set account holder's name (Owner only)",
  category: "owner",
  filename: __filename
}, async (conn, m, store, { from, reply, args, isCreator }) => {
  if (!isCreator) return reply("❌ Owner only command.");
  if (!args[0]) return reply("Usage: .setaccountname <Account Name>");

  const newName = args.join(" ");
  updateConfig("ACCOUNT_NAME", newName);

  await conn.sendMessage(from, {
    react: { text: "📛", key: m.key }
  });

  reply(`✅ Account name updated to *${newName}*`);
});

// Set Account Number
cmd({
  pattern: "setbanknum",
  alias: ["setbanknumber", "setaccountnumber", "setaccnum"],
  desc: "Set bank account number (Owner only)",
  category: "owner",
  filename: __filename
}, async (conn, m, store, { from, reply, args, isCreator }) => {
  if (!isCreator) return reply("❌ Owner only command.");
  if (!args[0]) return reply("Usage: .setbanknum <Account Number>");

  const newAccNum = args[0];
  updateConfig("ACCOUNT_NUMBER", newAccNum);

  await conn.sendMessage(from, {
    react: { text: "🔢", key: m.key }
  });

  reply(`✅ Account number updated to *${newAccNum}*`);
});
