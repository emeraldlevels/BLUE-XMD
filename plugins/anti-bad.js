// plugins/anti-badword.js
const { cmd } = require('../command');
const config = require('../config');
const fs = require('fs');
const path = require('path');

const DEBUG = false; // set to true to print debug logs to console

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Ensure config has BAD_WORDS array
if (!Array.isArray(config.BAD_WORDS)) {
  config.BAD_WORDS = [
    "wtf", "asshole", "xxx", "fuck", "sex", "ass", "porn",
    "dick", "pussy", "idiot", "fool", "mad", "basterd", "craze" , "toto", "preeq"
  ];
}

// Utility to save config persistently (best-effort; depends on config.js layout)
function saveConfig() {
  try {
    const configPath = path.join(__dirname, "..", "config.js");
    let file = fs.readFileSync(configPath, "utf8");

    // Attempt to replace a BAD_WORDS assignment if present
    if (/BAD_WORDS\s*[:=]/.test(file)) {
      // Support both object (module.exports = { BAD_WORDS: [...] }) or standalone assignments
      file = file.replace(/(BAD_WORDS\s*[:=]\s*)\[[\s\S]*?\]/, `$1${JSON.stringify(config.BAD_WORDS, null, 2)}`);
      fs.writeFileSync(configPath, file, "utf8");
      if (DEBUG) console.log("Saved BAD_WORDS to config.js");
    } else {
      if (DEBUG) console.warn("Could not find BAD_WORDS key in config.js — skipping persistent save.");
    }
  } catch (err) {
    console.error("Failed to save config:", err);
  }
}

// ================== TOGGLE COMMAND ==================
cmd({
  pattern: "anti-bad",
  alias: ["antibadword"],
  desc: "Enable or disable anti bad word feature.",
  category: "settings",
  filename: __filename,
  react: "🚫"
}, async (conn, mek, m, { args, isOwner, isAdmins, reply }) => {
  try {
    if (!isOwner && !isAdmins) return reply("*📛 Only admins or owner can use this command!*");

    if (!args[0]) {
      return reply(`⚙️ Anti-badword is currently: ${String(config.ANTI_BAD).toLowerCase() === "true" ? "✅ ON" : "❌ OFF"}\n\nUsage: .anti-bad on / off`);
    }
    const option = args[0].toLowerCase();
    if (option !== "on" && option !== "off") return reply("❌ Invalid option.\nExample: .anti-bad on");

    config.ANTI_BAD = option === "on" ? "true" : "false";
    // Optionally persist - you can add a config key to save. We'll try best-effort:
    try { saveConfig(); } catch (e) { if (DEBUG) console.error(e); }

    reply(option === "on" ? "✅ Anti-bad word system *enabled*." : "❌ Anti-bad word system *disabled*.");
  } catch (e) {
    console.error("anti-bad toggle error:", e);
    reply("❌ Error toggling anti-badword.");
  }
});

// ================== LIST BAD WORDS ==================
cmd({
  pattern: "listbad",
  desc: "Show all bad words in the list.",
  category: "settings",
  filename: __filename,
  react: "📜"
}, async (conn, mek, m, { reply }) => {
  const list = (Array.isArray(config.BAD_WORDS) && config.BAD_WORDS.length > 0)
    ? config.BAD_WORDS.map((w, i) => `${i + 1}. ${w}`).join("\n")
    : "⚠️ No bad words are currently set.";
  reply(`📜 *Bad Word List:*\n\n${list}\n\nTotal: ${Array.isArray(config.BAD_WORDS) ? config.BAD_WORDS.length : 0}`);
});

// ================== ADD BAD WORD ==================
cmd({
  pattern: "addbad",
  alias: ["setbadword","addbadword"],
  desc: "Add a new bad word.",
  category: "settings",
  filename: __filename,
  react: "➕"
}, async (conn, mek, m, { args, isOwner, isAdmins, reply }) => {
  try {
    if (!isOwner && !isAdmins) return reply("❌ Only admins or owner can add bad words!");
    if (!args[0]) return reply("❌ Usage: .addbad <word>");

    const word = args[0].toLowerCase().trim();
    if (config.BAD_WORDS.includes(word)) return reply("⚠️ That word is already in the list.");

    config.BAD_WORDS.push(word);
    saveConfig();
    reply(`✅ Bad word *"${word}"* added successfully!`);
  } catch (e) {
    console.error("addbad error:", e);
    reply("❌ Failed to add bad word.");
  }
});

// ================== REMOVE BAD WORD ==================
cmd({
  pattern: "removebad",
  alias: ["delbadword","removebadword"],
  desc: "Remove a bad word.",
  category: "settings",
  filename: __filename,
  react: "❌"
}, async (conn, mek, m, { args, isOwner, isAdmins, reply }) => {
  try {
    if (!isOwner && !isAdmins) return reply("❌ Only admins or owner can remove bad words!");
    if (!args[0]) return reply("❌ Usage: .removebad <word>");

    const word = args[0].toLowerCase().trim();
    const index = config.BAD_WORDS.indexOf(word);
    if (index === -1) return reply("⚠️ That word is not in the list.");

    config.BAD_WORDS.splice(index, 1);
    saveConfig();
    reply(`✅ Bad word *"${word}"* removed successfully!`);
  } catch (e) {
    console.error("removebad error:", e);
    reply("❌ Failed to remove bad word.");
  }
});

// ================== Helper: extract text from message ==================
function extractTextFromMessage(m) {
  try {
    if (!m || !m.message) return "";
    const msg = m.message;
    if (msg.conversation) return msg.conversation;
    if (msg.extendedTextMessage && msg.extendedTextMessage.text) return msg.extendedTextMessage.text;
    if (msg.imageMessage && msg.imageMessage.caption) return msg.imageMessage.caption;
    if (msg.videoMessage && msg.videoMessage.caption) return msg.videoMessage.caption;
    if (msg.buttonsResponseMessage && msg.buttonsResponseMessage.selectedButtonId) return msg.buttonsResponseMessage.selectedButtonId;
    if (msg.templateButtonReplyMessage && msg.templateButtonReplyMessage.selectedId) return msg.templateButtonReplyMessage.selectedId;
    if (msg.listResponseMessage && msg.listResponseMessage.singleSelectReply && msg.listResponseMessage.singleSelectReply.selectedRowId) return msg.listResponseMessage.singleSelectReply.selectedRowId;
    if (msg.orderMessage && msg.orderMessage.itemCount) return JSON.stringify(msg.orderMessage);
    // fallback: try keys that some versions use
    return Object.values(msg).find(v => typeof v === 'string') || "";
  } catch (e) {
    if (DEBUG) console.error("extractTextFromMessage error:", e);
    return "";
  }
}

// ================== BAD WORD DETECTION ==================
cmd({
  on: "body"
}, async (conn, m, store, { from, body, isGroup, sender, isAdmins, isBotAdmins, reply }) => {
  try {
    // Basic toggles and checks
    if (String(config.ANTI_BAD).toLowerCase() !== "true") return;
    if (!isGroup) return; // only groups

    // Skip admins & bot itself
    if (isAdmins) return;
    const myJid = (conn.user?.id?.split(':')[0]) + '@s.whatsapp.net';
    if (sender === myJid) return;

    // Ensure bot is admin (try provided flag, otherwise check metadata)
    let botIsAdmin = !!isBotAdmins;
    if (!botIsAdmin) {
      try {
        const meta = await conn.groupMetadata(from);
        const botId = myJid;
        botIsAdmin = meta.participants.some(p => (p.id || p.jid) === botId && (p.admin || p.isAdmin || p.role === 'admin'));
      } catch (err) {
        if (DEBUG) console.error('groupMetadata error:', err);
      }
    }
    if (!botIsAdmin) {
      if (DEBUG) console.log("anti-bad: bot is not admin → cannot moderate");
      return;
    }

    // Extract text robustly
    let text = (body && typeof body === 'string') ? body : extractTextFromMessage(m);
    if (!text) return;
    text = text.toLowerCase().trim();

    if (DEBUG) {
      console.log("anti-bad got message:", { from, sender, isGroup, isAdmins, isBotAdmin: botIsAdmin, text: text.slice(0,200) });
      console.log("BAD_WORDS:", config.BAD_WORDS);
    }

    // Detection logic:
    // 1) whole-word match (regex)
    // 2) substring match (e.g. "fucking")
    // 3) normalized match after removing non-alphanumerics (e.g. f.u.c.k)
    const normalized = text.replace(/[^a-z0-9]/g, '');

    let matchedWord = null;
    for (const w of config.BAD_WORDS) {
      const word = String(w).toLowerCase().trim();
      if (!word) continue;

      // whole word
      const reWhole = new RegExp(`\\b${escapeRegExp(word)}\\b`, "i");
      if (reWhole.test(text)) {
        matchedWord = word;
        break;
      }

      // substring
      if (text.includes(word)) {
        matchedWord = word;
        break;
      }

      // normalized (catch obfuscation like f.u.c.k)
      const wn = word.replace(/[^a-z0-9]/g, '');
      if (wn && normalized.includes(wn)) {
        matchedWord = word;
        break;
      }
    }

    if (!matchedWord) {
      if (DEBUG) console.log("anti-bad: no match");
      return;
    }

    if (DEBUG) console.log("anti-bad matched:", matchedWord);

    // Attempt to delete the message -- try direct m.key first, fallback to manual key build
    let deleted = false;
    try {
      await conn.sendMessage(from, { delete: m.key });
      deleted = true;
    } catch (err) {
      if (DEBUG) console.error("Direct delete failed, trying fallback:", err);
      try {
        const fallbackKey = {
          remoteJid: from,
          id: m.key?.id,
          participant: m.key?.participant || sender,
          fromMe: !!m.key?.fromMe
        };
        await conn.sendMessage(from, { delete: fallbackKey });
        deleted = true;
      } catch (err2) {
        if (DEBUG) console.error("Fallback delete failed:", err2);
      }
    }

    // Compose styled warning
    const details =
`┏━━━━━🚫 *BAD WORD BLOCKED* 🚫━━━━━┓

👤 User: @${sender.split('@')[0]}
🔎 Matched: ${matchedWord}
⚠️ Action: ${deleted ? "Message deleted" : "Could not delete message"}

Please follow the group rules.

┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

    // Send the reply with externalAdReply and mention
    await conn.sendMessage(from, {
      text: details,
      contextInfo: {
        externalAdReply: {
          title: "🚫 Bad Word Detected",
          body: `${config.OWNER_NAME || 'Owner'}'s Group Protection`,
          thumbnailUrl: config.MENU_IMAGE_URL,
          sourceUrl: config.REPO_LINK,
          mediaType: 1,
          renderLargerThumbnail: true
        }
      },
      mentions: [sender]
    }, { quoted: m });

  } catch (error) {
    console.error("Anti-bad word error:", error);
    // don't crash the bot
  }
});
