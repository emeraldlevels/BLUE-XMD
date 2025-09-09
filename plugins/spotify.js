const axios = require("axios");
const { cmd } = require("../command");

cmd({
    pattern: "spotify",
    alias: ["spot", "spdl", "spotifydl"],
    desc: "Search and download Spotify tracks as audio",
    category: "music",
    react: "🎧",
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        const query = args.join(" ");
        if (!query) {
            return reply(
`❎ Please provide a song name or Spotify link.

📌 Examples:
\`.spotify metamorphosis\`
\`.spotify https://open.spotify.com/track/2ksyzVfU0WJoBpu8otr4pz\``);
        }

        // If user provides a direct Spotify track link
        if (query.includes("spotify.com/track/")) {
            await reply("🎶 Downloading track... Please wait.");

            const api = `https://api.princetechn.com/api/download/spotifydl?apikey=prince&url=${encodeURIComponent(query)}`;
            const { data } = await axios.get(api, { timeout: 20000 });

            if (!data || !data.result) {
                return reply("⚠️ Failed to fetch audio from Spotify.");
            }

            return await conn.sendMessage(
                from,
                {
                    audio: { url: data.result.download_url },
                    mimetype: "audio/mpeg",
                    fileName: `${data.result.title}.mp3`,
                    contextInfo: {
                        externalAdReply: {
                            title: data.result.title,
                            body: data.result.artist,
                            mediaUrl: query,
                            sourceUrl: query,
                            thumbnailUrl: data.result.image
                        }
                    }
                },
                { quoted: mek }
            );
        }

        // Otherwise, treat as a search query
        await reply(`🔎 Searching Spotify for: *${query}* ...`);

        const api = `https://api.princetechn.com/api/search/spotifysearch?apikey=prince&query=${encodeURIComponent(query)}`;
        const { data } = await axios.get(api, { timeout: 20000 });

        if (!data || !data.results || data.results.length === 0) {
            return reply("⚠️ No results found on Spotify.");
        }

        // Format search results as text
        let text = `🎧 *Spotify Search Results for "${query}"*\n\n`;
        data.results.slice(0, 8).forEach((song, i) => {
            text += `*${i + 1}. ${song.title}*\n👤 Artist: ${song.artist}\n⏱ Duration: ${song.duration}\n🔗 ${song.url}\n\n`;
        });
        text += `📌 To download another track, copy its link and send:\n\`.spotify <spotify_link>\``;

        await reply(text);

        // Auto download the first result as audio
        const first = data.results[0];
        if (first?.url) {
            await reply(`🎶 Auto-downloading: *${first.title}* by ${first.artist} ...`);

            const dlApi = `https://api.princetechn.com/api/download/spotifydl?apikey=prince&url=${encodeURIComponent(first.url)}`;
            const { data: dlData } = await axios.get(dlApi, { timeout: 20000 });

            if (dlData?.result?.download_url) {
                await conn.sendMessage(
                    from,
                    {
                        audio: { url: dlData.result.download_url },
                        mimetype: "audio/mpeg",
                        fileName: `${dlData.result.title}.mp3`,
                        contextInfo: {
                            externalAdReply: {
                                title: dlData.result.title,
                                body: dlData.result.artist,
                                mediaUrl: first.url,
                                sourceUrl: first.url,
                                thumbnailUrl: dlData.result.image
                            }
                        }
                    },
                    { quoted: mek }
                );
            }
        }

    } catch (e) {
        console.error("[Spotify] Error:", e.response?.data || e.message);
        reply(`⚠️ Error: ${e.message}`);
    }
});
