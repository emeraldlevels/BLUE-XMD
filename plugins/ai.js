const { cmd } = require('../command');
const axios = require('axios');

async function safeReact(conn, from, key, emoji) {
    try {
        await conn.sendMessage(from, { react: { text: emoji, key } });
    } catch (err) {
        console.error("React failed:", err);
    }
}

// Stable universal AI API for general AI commands
const STABLE_AI_API = "https://lance-frank-asta.onrender.com/api/gpt";

cmd({
    pattern: "ai",
    alias: ["bot", "dj", "gpt", "gpt4", "bing", "chatgpt", "openai", "open-gpt"],
    desc: "Chat with AI",
    category: "ai",
    react: "🤖",
    filename: __filename
}, async (conn, mek, m, { from, args, q, reply }) => {
    try {
        if (!q) return reply("Please provide a message for the AI.\nExample: `.ai Hello`");

        const apiUrl = `${STABLE_AI_API}?q=${encodeURIComponent(q)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.message) {
            await safeReact(conn, from, m.key, "❌");
            return reply("AI failed to respond. Please try again later.");
        }

        await reply(`🤖 *AI Response:*\n\n${data.message}`);
        await safeReact(conn, from, m.key, "✅");
    } catch (e) {
        console.error("Error in AI command:", e);
        await safeReact(conn, from, m.key, "❌");
        reply("An error occurred while communicating with the AI.");
    }
});

// DeepSeek AI command (separate API)
cmd({
    pattern: "deepseek",
    alias: ["deep", "seekai"],
    desc: "Chat with DeepSeek AI",
    category: "ai",
    react: "🧠",
    filename: __filename
}, async (conn, mek, m, { from, args, q, reply }) => {
    try {
        if (!q) return reply("Please provide a message for DeepSeek AI.\nExample: `.deepseek Hello`");

        const apiUrl = `https://api.ryzendesu.vip/api/ai/deepseek?text=${encodeURIComponent(q)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.answer) {
            await safeReact(conn, from, m.key, "❌");
            return reply("DeepSeek AI failed to respond. Please try again later.");
        }

        await reply(`🧠 *DeepSeek AI Response:*\n\n${data.answer}`);
        await safeReact(conn, from, m.key, "✅");
    } catch (e) {
        console.error("Error in DeepSeek AI command:", e);
        await safeReact(conn, from, m.key, "❌");
        reply("An error occurred while communicating with DeepSeek AI.");
    }
});
