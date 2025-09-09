const axios = require("axios");
const { cmd } = require("../command");

// Utility function to fetch logo and send it
async function generateLogo(conn, from, mek, reply, text, api) {
    try {
        if (!text) {
            return reply(
                `❎ Please provide text for the logo.\n\n📌 Example:\n\`${api.example}\``
            );
        }

        await reply("✨ Generating logo... Please wait.");

        const url = `https://api.princetechn.com/api/ephoto360/${api.endpoint}?apikey=prince&text=${encodeURIComponent(text)}`;
        const { data } = await axios.get(url);

        if (!data || !data.result?.image_url) {
            return reply("⚠️ Failed to generate logo.");
        }

        await conn.sendMessage(
            from,
            { image: { url: data.result.image_url }, caption: `✅ Generated Logo for *${text}*` },
            { quoted: mek }
        );

    } catch (e) {
        console.error(`[${api.name}] Error:`, e.message);
        reply(`⚠️ Error: ${e.message}`);
    }
}

// ✅ Only Glossy Silver works
cmd({
    pattern: "glossysilver",
    alias: ["silverlogo"],
    desc: "Generate Glossy Silver text logo",
    category: "logo",
    react: "⚪",
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    await generateLogo(conn, from, mek, reply, args.join(" "), {
        name: "GlossySilver",
        endpoint: "glossysilver",
        example: ".glossysilver Brenald Media"
    });
});
