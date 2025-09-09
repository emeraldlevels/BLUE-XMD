const { cmd } = require('../command');
const config = require('../config'); // make sure OWNER_NAME, MENU_IMAGE_URL, REPO_LINK are exported here

// Helper function to send reply + externalAdReply
async function fancyReply(conn, from, m, details) {
    await conn.sendMessage(from, {
        text: details,
        contextInfo: {
            externalAdReply: {
                title: "🆔 JID Information",
                body: `${config.OWNER_NAME}'s Official Account`,
                thumbnailUrl: config.MENU_IMAGE_URL, // menu image
                sourceUrl: config.REPO_LINK,        // repo/support link
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: m });
}

cmd({
    pattern: "jid",
    alias: ["id", "chatid", "gjid"],  
    desc: "Get full JID of current chat/user/channel",
    react: "🆔",
    category: "utility",
    filename: __filename,
}, async (conn, mek, m, { from, isGroup, reply, sender }) => {
    try {
        if (from.endsWith("@newsletter")) {
            const channelJID = from;
            await fancyReply(conn, from, m, `📢 *Channel JID:*\n\`\`\`${channelJID}\`\`\``);
        } else if (isGroup) {
            const groupJID = from.includes('@g.us') ? from : `${from}@g.us`;
            await fancyReply(conn, from, m, `👥 *Group JID:*\n\`\`\`${groupJID}\`\`\``);
        } else {
            const userJID = sender.includes('@s.whatsapp.net') ? sender : `${sender}@s.whatsapp.net`;
            await fancyReply(conn, from, m, `👤 *User JID:*\n\`\`\`${userJID}\`\`\``);
        }
    } catch (e) {
        console.error("JID Error:", e);
        await fancyReply(conn, from, m, `⚠️ Error fetching JID:\n${e.message}`);
    }
});

cmd({
    pattern: "channeljid",
    alias: ["cjid", "newsletterjid", "channelid"],  
    desc: "Get channel JID information",
    react: "📬",
    category: "utility",
    filename: __filename,
}, async (conn, mek, m, { from }) => {
    try {
        if (from.endsWith("@newsletter")) {
            const channelJID = from;
            const channelID = channelJID.split('@')[0];
            
            await fancyReply(conn, from, m, 
`📬 *Channel JID Information*

• *Full JID:* ${channelJID}
• *Channel ID:* ${channelID}

Use this ID for channel-related commands.`);
        } else {
            await fancyReply(conn, from, m, "❌ *Not in a Channel*\n\nThis command only works in newsletters. Use `.jid` in a channel to get its JID.");
        }
    } catch (e) {
        console.error("Channel JID Error:", e);
        await fancyReply(conn, from, m, `⚠️ Error: ${e.message}`);
    }
});
