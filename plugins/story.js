const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

cmd({
    pattern: "story",
    desc: "Fetch full story text using PrinceTech GeminiAI",
    react: "📄",
    category: "utilities",
    filename: __filename
}, async (conn, mek, m, { from, body, args, q, reply }) => {
    try {
        if (!q) return reply("❎ Please provide a story title.\n*Example:* `.story Peter Pan`");

        // Intro message
        await conn.sendMessage(from, {
            text: "⚠️ Sending the story as text because PDFs are not available"
        }, { quoted: mek });

        const prompt = `Tell me the full story of ${q}`;
        const apiUrl = `https://api.princetechn.com/api/ai/geminiaipro?apikey=prince&q=${encodeURIComponent(prompt)}`;

        const response = await axios.get(apiUrl, { timeout: 30000 });
        const data = response.data;

        console.log("DEBUG - API response:", JSON.stringify(data, null, 2));

        if (data.status !== 200 || !data.result) {
            return reply("❌ Sorry, could not fetch the story at this time.");
        }

        // Get story text
        let storyText = typeof data.result === "string" ? data.result : JSON.stringify(data.result, null, 2);

        // Format story: add title and spacing
        storyText = `📖 *${q}*\n\n${storyText.replace(/\n/g, "\n\n")}`;

        // Split into WhatsApp-safe chunks
        const chunkSize = 2000;
        for (let i = 0; i < storyText.length; i += chunkSize) {
            const chunk = storyText.slice(i, i + chunkSize);
            await conn.sendMessage(from, { text: chunk }, { quoted: mek });
        }

        // Send neutral externalAdReply with story title as title
        const details = `Story fetched .Tip 💡 use topdf to convert to pdf`;
        await conn.sendMessage(from, {
            text: details,
            contextInfo: {
                externalAdReply: {
                    title: `${q}`,  // Story title from user search
                    body: `Powered by Tracle AI`,
                    thumbnailUrl: config.MENU_IMAGE_URL,
                    sourceUrl: config.REPO_LINK,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m });

    } catch (e) {
        console.error(e);
        reply(`❌ Error: ${e.message}`);
    }
});
