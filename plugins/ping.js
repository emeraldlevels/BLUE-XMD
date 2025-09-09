const config = require('../config'); 
const { cmd } = require('../command');

cmd({
    pattern: "ping",
    alias: ["speed", "pong"],
    desc: "Check bot's response time.",
    category: "main",
    react: "⚡",
    filename: __filename
}, async (conn, mek, m, { from, quoted, sender, reply }) => {
    try {
        const start = new Date().getTime();

        const reactionEmojis = ['🔥', '⚡', '🚀', '💨', '🎯', '🎉', '🌟', '💥', '🕐', '🔹'];
        const textEmojis = ['💎', '🏆', '⚡️', '🚀', '🎶', '🌠', '🌀', '🔱', '🛡️', '✨'];

        const reactionEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
        let textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];

        // Ensure reaction and text emojis are different
        while (textEmoji === reactionEmoji) {
            textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];
        }

        // Send reaction
        await conn.sendMessage(from, { react: { text: textEmoji, key: mek.key } });

        const end = new Date().getTime();
        const responseTime = (end - start) / 1000;

        const details = `⚡ *${config.BOT_NAME} SPEED CHECK* ⚡
        
⏱️ Response Time: *${responseTime.toFixed(2)}s* ${reactionEmoji}
👤 Owner: *${config.OWNER_NAME}*`;

        // Send fancy styled reply (no repo link)
        await conn.sendMessage(from, {
            text: details,
            contextInfo: {
                externalAdReply: {
                    title: `${config.BOT_NAME} is Alive 🚀`,
                    body: `⚡ Powered by ${config.OWNER_NAME}`,
                    thumbnailUrl: config.MENU_IMAGE_URL,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("Error in ping command:", e);
        reply(`❌ An error occurred: ${e.message}`);
    }
});
