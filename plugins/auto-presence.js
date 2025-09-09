// plugins/auto-presence.js
const { cmd } = require('../command');
const config = require('../config');
const fs = require('fs');
const path = require('path');

// === Helper: update config.js persistently ===
function updateConfig(key, value) {
  try {
    const configPath = path.join(__dirname, '../config.js');
    let configFile = fs.readFileSync(configPath, 'utf8');

    const regex = new RegExp(`(${key}:\\s*process\\.env\\.${key}\\s*\\|\\|\\s*")[^"]*(")`);
    configFile = configFile.replace(regex, `$1${value}$2`);

    fs.writeFileSync(configPath, configFile, 'utf8');

    // Update runtime config
    config[key] = value;
    console.log(`✅ Updated ${key} to ${value}`);
  } catch (e) {
    console.error(`❌ Failed to update ${key} in config.js:`, e);
  }
}

// === Auto-Typing Command ===
cmd({
  pattern: "autotyping",
  alias: ["auto-typing", "typing" ],
  desc: "Enable or disable auto-typing presence",
  category: "settings",
  filename: __filename,
  react: "⌨️"
}, async (conn, m, store, { from, args, reply, isCreator, isAdmins }) => {
  if (!isCreator && !isAdmins) return reply("❌ Only owner  can use this.");

  const state = args[0]?.toLowerCase();
  if (!state || !["on", "off"].includes(state)) {
    return reply("Usage: `.autotyping on` or `.autotyping off`");
  }

  const value = state === "on" ? "true" : "false";
  updateConfig("AUTO_TYPING", value);

  reply(`✅ Auto-typing is now *${state.toUpperCase()}*`);
});

// === Auto-Recording Command ===
cmd({
  pattern: "autorecording",
  alias: ["auto-recording", "record", "recording"],
  desc: "Enable or disable auto-recording presence",
  category: "settings",
  filename: __filename,
  react: "🎙️"
}, async (conn, m, store, { from, args, reply, isCreator, isAdmins }) => {
  if (!isCreator && !isAdmins) return reply("❌ Only owner can use this.");

  const state = args[0]?.toLowerCase();
  if (!state || !["on", "off"].includes(state)) {
    return reply("Usage: `.autorecording on` or `.autorecording off`");
  }

  const value = state === "on" ? "trueP" : "false";
  updateConfig("AUTO_RECORDING", value);

  reply(`✅ Auto-recording is now *${state.toUpperCase()}*`);
});

// === Listeners: apply presence automatically ===
cmd({ on: "body" }, async (conn, mek, m, { from }) => {
  try {
    if (config.AUTO_TYPING === "true") {
      await conn.sendPresenceUpdate("composing", from);
    }
    if (config.AUTO_RECORDING === "true") {
      await conn.sendPresenceUpdate("recording", from);
    }
  } catch (e) {
    console.error("Auto presence error:", e.message || e);
  }
});
