// plugins/song.js
const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');

cmd({
    pattern: "song",
    alias: ["play", "music"],
    react: "🎵",
    desc: "Download audio from YouTube using Toxxic API",
    category: "download",
    use: ".song <song name>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return await reply("❌ Please provide a song name! Example: .play alabi");

        await reply("🔍 Searching for the song...");

        const searchResults = await yts(q);
        if (!searchResults.videos || searchResults.videos.length === 0) {
            return await reply("❌ No results found!");
        }

        const video = searchResults.videos[0];
        const videoUrl = video.url;
        const songTitle = video.title || q;

        await reply("⏳ Downloading audio...");

        // Toxxic API endpoint (per docs)
        const apiUrl = `https://api-toxxic.zone.id/api/downloader/ytmp3?url=${encodeURIComponent(videoUrl)}`;

        let response;
        try {
            response = await axios.get(apiUrl, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; TracleBot/1.0)'
                }
            });
        } catch (err) {
            console.error('[song] API request failed:', err && (err.message || err));
            return await reply("❌ Failed to contact the downloader API. Try again later.");
        }

        const data = response.data;

        // Recursive search for a URL or data:audio in the API response
        function findUrl(obj) {
            if (!obj) return null;

            // If string, check if it looks like a URL or data URI
            if (typeof obj === 'string') {
                const s = obj.trim();
                if (/^https?:\/\/\S+/i.test(s)) return s;
                if (/^data:audio\/[a-z0-9.+-]+;base64,/.test(s)) return s;
                return null;
            }

            // If Array, search items
            if (Array.isArray(obj)) {
                for (const item of obj) {
                    const found = findUrl(item);
                    if (found) return found;
                }
                return null;
            }

            // If Object, attempt priority keys first
            const priorityKeys = ['url', 'audio', 'download', 'result', 'data', 'link', 'links', 'download_link', 'file'];
            for (const k of priorityKeys) {
                if (obj[k]) {
                    const found = findUrl(obj[k]);
                    if (found) return found;
                }
            }

            // Then check all keys
            for (const k of Object.keys(obj)) {
                try {
                    const found = findUrl(obj[k]);
                    if (found) return found;
                } catch (e) {
                    // skip
                }
            }
            return null;
        }

        const audioUrlCandidate = findUrl(data);

        if (!audioUrlCandidate) {
            // Log full response for debugging (so you can inspect why none matched)
            console.error('[song] No audio URL found in API response. Dumping response for debug:');
            try {
                console.error(JSON.stringify(data, null, 2));
            } catch (e) {
                console.error('[song] Failed to stringify API response for debug.');
            }
            return await reply("❌ Failed to get download link from API. (Debug logged to console)");
        }

        // If we got a data:audio base64, convert to buffer and send
        if (/^data:audio\/[a-z0-9.+-]+;base64,/.test(audioUrlCandidate)) {
            const base64 = audioUrlCandidate.split(',')[1];
            const buffer = Buffer.from(base64, 'base64');

            // write to temp file
            const tempDir = path.join(__dirname, 'temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            const filename = `${songTitle.replace(/[<>:"/\\|?*]/g, '_')}_${Date.now()}.mp3`;
            const filePath = path.join(tempDir, filename);
            fs.writeFileSync(filePath, buffer);

            await conn.sendMessage(from, {
                audio: fs.readFileSync(filePath),
                mimetype: 'audio/mpeg',
                ptt: false,
                fileName: `${songTitle}.mp3`
            }, { quoted: mek });

            // cleanup
            try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }

            await reply("✅ Song downloaded successfully (from base64)!");
            return;
        }

        // If we got a http(s) URL
        if (/^https?:\/\//i.test(audioUrlCandidate)) {
            // If the URL points to a webpage (youtube watch) we can't directly send as audio
            if (/youtube\.com\/watch|youtu\.be/.test(audioUrlCandidate)) {
                // The API returned a youtube link — not usable as direct audio. Inform user.
                return await reply("❌ The downloader API returned a YouTube link instead of a direct audio file. Try again or use another API.");
            }

            // Best effort: try to stream remote audio URL to WhatsApp by sending audio with url
            try {
                await conn.sendMessage(from, {
                    audio: { url: audioUrlCandidate },
                    mimetype: 'audio/mpeg',
                    ptt: false,
                    fileName: `${songTitle}.mp3`.replace(/[<>:"/\\|?*]/g, '_')
                }, { quoted: mek });

                await reply("✅ Song downloaded successfully!");
                return;
            } catch (sendErr) {
                console.warn('[song] Sending remote URL as audio failed, will try to download and send as buffer:', sendErr && sendErr.message);

                // Fallback: download the file then send as buffer
                try {
                    const downloadResp = await axios({
                        url: audioUrlCandidate,
                        method: 'GET',
                        responseType: 'arraybuffer',
                        timeout: 30000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });

                    const buffer = Buffer.from(downloadResp.data);
                    // write to temp and send
                    const tempDir = path.join(__dirname, 'temp');
                    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
                    const filename = `${songTitle.replace(/[<>:"/\\|?*]/g, '_')}_${Date.now()}.mp3`;
                    const filePath = path.join(tempDir, filename);
                    fs.writeFileSync(filePath, buffer);

                    await conn.sendMessage(from, {
                        audio: fs.readFileSync(filePath),
                        mimetype: 'audio/mpeg',
                        ptt: false,
                        fileName: `${songTitle}.mp3`.replace(/[<>:"/\\|?*]/g, '_')
                    }, { quoted: mek });

                    // cleanup
                    try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }

                    await reply("✅ Song downloaded successfully (via downloaded file)!");
                    return;
                } catch (dlErr) {
                    console.error('[song] Failed to download/send audio file:', dlErr);
                    return await reply("❌ Failed to download or send the audio file.");
                }
            }
        }

        // If we get here, we have something unexpected
        return await reply("❌ Unsupported audio format returned by API.");

    } catch (error) {
        console.error("Song download error:", error);
        await reply(`❌ Error: ${error.message || "Failed to download song"}`);
    }
});
