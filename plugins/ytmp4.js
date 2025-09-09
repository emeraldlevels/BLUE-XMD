// plugins/video.js
const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');

cmd({
    pattern: "video",
    alias: ["yt", "mp4" , "ytmp4"],
    react: "🎬",
    desc: "Download video from YouTube using Toxxic API",
    category: "download",
    use: ".video <song name | YouTube link>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return await reply("❌ Provide a video name or YouTube link!\n\nExample:\n.video burna boy\n.mp4 https://youtube.com/watch?v=xxxx");

        await reply("🔍 Searching...");

        let videoUrl, videoTitle;

        // Detect if input is a YouTube link
        if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(q)) {
            videoUrl = q;
            videoTitle = "YouTube Video";
        } else {
            const searchResults = await yts(q);
            if (!searchResults.videos || searchResults.videos.length === 0) {
                return await reply("❌ No results found!");
            }
            const video = searchResults.videos[0];
            videoUrl = video.url;
            videoTitle = video.title || q;
        }

        await reply("⏳ Downloading...");

        // Toxxic API endpoint
        const apiUrl = `https://api-toxxic.zone.id/api/downloader/ytmp4?url=${encodeURIComponent(videoUrl)}`;

        let response;
        try {
            response = await axios.get(apiUrl, { timeout: 60000 });
        } catch (err) {
            console.error('[video] API request failed:', err.message);
            return await reply("❌ API error. Try again later.");
        }

        const data = response.data;

        // Recursive search for a video URL
        function findUrl(obj) {
            if (!obj) return null;

            if (typeof obj === 'string') {
                const s = obj.trim();
                if (/^https?:\/\/\S+/i.test(s)) return s;
                return null;
            }

            if (Array.isArray(obj)) {
                for (const item of obj) {
                    const found = findUrl(item);
                    if (found) return found;
                }
                return null;
            }

            if (typeof obj === 'object') {
                for (const k of Object.keys(obj)) {
                    const found = findUrl(obj[k]);
                    if (found) return found;
                }
            }
            return null;
        }

        const videoUrlCandidate = findUrl(data);

        if (!videoUrlCandidate) {
            console.error('[video] No video URL found in API response:', JSON.stringify(data, null, 2));
            return await reply("❌ Failed to get video link.");
        }

        // Try sending video directly
        async function sendVideo(url) {
            try {
                await conn.sendMessage(from, {
                    video: { url },
                    mimetype: 'video/mp4',
                    caption: "🎬 Downloaded my TRACLE"
                }, { quoted: mek });

                await reply("✅ Sent!");
            } catch {
                console.warn('[video] Remote send failed, downloading file...');

                try {
                    const downloadResp = await axios({
                        url,
                        method: 'GET',
                        responseType: 'arraybuffer',
                        timeout: 60000
                    });

                    const buffer = Buffer.from(downloadResp.data);
                    const tempDir = path.join(__dirname, 'temp');
                    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
                    const filename = `${videoTitle.replace(/[<>:"/\\|?*]/g, '_')}_${Date.now()}.mp4`;
                    const filePath = path.join(tempDir, filename);
                    fs.writeFileSync(filePath, buffer);

                    await conn.sendMessage(from, {
                        video: fs.readFileSync(filePath),
                        mimetype: 'video/mp4',
                        caption: "🎬 Downloaded my TRACLE"
                    }, { quoted: mek });

                    fs.unlinkSync(filePath);
                    await reply("✅ Downloaded and sent!");
                } catch (dlErr) {
                    console.error('[video] Download/send error:', dlErr.message);
                    await reply("❌ Failed to send video.");
                }
            }
        }

        await sendVideo(videoUrlCandidate);

    } catch (error) {
        console.error("Video error:", error);
        await reply(`❌ Error: ${error.message || "Failed to download"}`);
    }
});
