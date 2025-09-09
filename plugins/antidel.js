const axios = require('axios');
const config = require('../config');
const { cmd, commands } = require('../command');
const util = require("util");
const { getAnti, setAnti, initializeAntiDeleteSettings } = require('../data/antidel');

initializeAntiDeleteSettings();

// ========================= ANTIDELETE =========================
cmd({
    pattern: "antidelete",
    alias: ['antidel', 'ad'],
    desc: "Toggle Anti-Delete system",
    category: "misc",
    filename: __filename
},
async (conn, mek, m, { from, reply, q, isCreator }) => {
    if (!isCreator) return reply('❌ This command is only for the bot owner.');

    const args = q?.trim().toLowerCase().split(" ") || [];
    const [scope, state] = args;

    try {
        if (!scope) {
            const helpMessage = `
🎯 *ANTIDELETE CONTROL MENU*

╭─⊷ *GROUPS*
│ • .antidel gc on   ✅ enable anti-delete in groups
│ • .antidel gc off  ❌ disable anti-delete in groups
│
╭─⊷ *DIRECT MESSAGES*
│ • .antidel dm on   ✅ enable anti-delete in DMs
│ • .antidel dm off  ❌ disable anti-delete in DMs
│
╭─⊷ *GENERAL*
│ • .antidel status  📊 check current settings
╰─────────────────

💡 *Tip:* Deleted messages will still appear when enabled.
            `;
            return reply(helpMessage);
        }

        if (scope === "gc") {
            if (state === "on") {
                await setAnti("gc", true);
                return reply("✅ AntiDelete enabled for *Groups*.");
            } else if (state === "off") {
                await setAnti("gc", false);
                return reply("❌ AntiDelete disabled for *Groups*.");
            }
        }

        if (scope === "dm") {
            if (state === "on") {
                await setAnti("dm", true);
                return reply("✅ AntiDelete enabled for *Direct Messages*.");
            } else if (state === "off") {
                await setAnti("dm", false);
                return reply("❌ AntiDelete disabled for *Direct Messages*.");
            }
        }

        if (scope === "status") {
            const gcStatus = await getAnti("gc");
            const dmStatus = await getAnti("dm");

            const statusMessage = `
📊 *ANTIDELETE STATUS*

👥 Groups: ${gcStatus ? "✅ Enabled" : "❌ Disabled"}
💬 Direct Messages: ${dmStatus ? "✅ Enabled" : "❌ Disabled"}
            `;
            return reply(statusMessage);
        }

        return reply("❌ Invalid command.\nUse *.antidel gc on/off*, *.antidel dm on/off*, or *.antidel status*.");

    } catch (err) {
        console.error("Error in antidelete command:", err);
        return reply("⚠️ An error occurred while updating AntiDelete settings.");
    }
});

// ========================= VV3 (ViewOnce Fetch) =========================
cmd({
    pattern: "vv3",
    alias: ['retrive', '🔥'],
    desc: "Fetch and resend a ViewOnce message content (image/video).",
    category: "misc",
    use: '<query>',
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const quotedMessage = m.msg.contextInfo.quotedMessage;

        if (quotedMessage && quotedMessage.viewOnceMessageV2) {
            const quot = quotedMessage.viewOnceMessageV2;

            await reply("🔍 *Processing ViewOnce message...*");

            if (quot.message.imageMessage) {
                let cap = quot.message.imageMessage.caption || "📸 ViewOnce Image";
                let anu = await conn.downloadAndSaveMediaMessage(quot.message.imageMessage);
                return conn.sendMessage(from, {
                    image: { url: anu },
                    caption: `✅ *ViewOnce Revealed*\n\n${cap}\n\n🕵️‍♂️ _Retrieved using vv3 command_`
                }, { quoted: mek });
            }
            if (quot.message.videoMessage) {
                let cap = quot.message.videoMessage.caption || "🎥 ViewOnce Video";
                let anu = await conn.downloadAndSaveMediaMessage(quot.message.videoMessage);
                return conn.sendMessage(from, {
                    video: { url: anu },
                    caption: `✅ *ViewOnce Revealed*\n\n${cap}\n\n🕵️‍♂️ _Retrieved using vv3 command_`
                }, { quoted: mek });
            }
            if (quot.message.audioMessage) {
                let anu = await conn.downloadAndSaveMediaMessage(quot.message.audioMessage);
                return conn.sendMessage(from, {
                    audio: { url: anu },
                    caption: "🎵 ViewOnce Audio Retrieved\n🕵️‍♂️ _Using vv3 command_"
                }, { quoted: mek });
            }
        }

        if (!m.quoted) return reply("❌ *Usage:* Reply to a ViewOnce message with .vv3");

        if (m.quoted.mtype === "viewOnceMessage") {
            await reply("🔍 *Processing ViewOnce message...*");

            if (m.quoted.message.imageMessage) {
                let cap = m.quoted.message.imageMessage.caption || "📸 ViewOnce Image";
                let anu = await conn.downloadAndSaveMediaMessage(m.quoted.message.imageMessage);
                return conn.sendMessage(from, {
                    image: { url: anu },
                    caption: `✅ *ViewOnce Revealed*\n\n${cap}\n\n🕵️‍♂️ _Retrieved using vv3 command_`
                }, { quoted: mek });
            }
            else if (m.quoted.message.videoMessage) {
                let cap = m.quoted.message.videoMessage.caption || "🎥 ViewOnce Video";
                let anu = await conn.downloadAndSaveMediaMessage(m.quoted.message.videoMessage);
                return conn.sendMessage(from, {
                    video: { url: anu },
                    caption: `✅ *ViewOnce Revealed*\n\n${cap}\n\n🕵️‍♂️ _Retrieved using vv3 command_`
                }, { quoted: mek });
            }
        } else if (m.quoted.message.audioMessage) {
            await reply("🔍 *Processing Audio message...*");
            let anu = await conn.downloadAndSaveMediaMessage(m.quoted.message.audioMessage);
            return conn.sendMessage(from, {
                audio: { url: anu },
                caption: "🎵 Audio Message Retrieved\n🕵️‍♂️ _Using vv3 command_"
            }, { quoted: mek });
        } else {
            return reply("❌ This is not a ViewOnce message.\n💡 Reply to a view-once image/video with .vv3");
        }
    } catch (e) {
        console.log("Error:", e);
        reply("❌ An error occurred while fetching the ViewOnce message.\n⚠️ Please try again or check if it's a valid ViewOnce message.");
    }
});
