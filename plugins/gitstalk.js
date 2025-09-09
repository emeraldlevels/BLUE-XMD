const axios = require('axios');
const { cmd } = require('../command');

cmd({
    pattern: "githubstalk",
    alias: ["gitstalk", "ghstalk", "gh"],
    desc: "Fetch detailed GitHub user profile including profile picture.",
    category: "menu",
    react: "🖥️",
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        const username = args[0];
        if (!username) {
            return reply("❎ Please provide a GitHub username.\n\nExample: `.githubstalk Brenaldmedia`");
        }

        let data = null;

        // First try GitHub official API
        try {
            const apiUrl = `https://api.github.com/users/${username}`;
            const response = await axios.get(apiUrl, { timeout: 15000 });
            data = response.data;

            let userInfo = `👤 *Username*: ${data.name || data.login}
🔗 *Github Url*: ${data.html_url}
📝 *Bio*: ${data.bio || 'Not available'}
🏙️ *Location*: ${data.location || 'Unknown'}
📊 *Public Repos*: ${data.public_repos}
👥 *Followers*: ${data.followers} | Following: ${data.following}
📅 *Created At*: ${new Date(data.created_at).toDateString()}
🔭 *Public Gists*: ${data.public_gists}
> © Powered by BrenaldMedia`;

            return await conn.sendMessage(from, {
                image: { url: data.avatar_url },
                caption: userInfo
            }, { quoted: mek });

        } catch (err) {
            console.warn("[GitHubStalk] Official API failed, using PrinceTech fallback:", err.response?.data || err.message);
        }

        // ===== FALLBACK TO PRINCETECH API =====
        const altUrl = `https://api.princetechn.com/api/stalk/gitstalk?apikey=prince&username=${encodeURIComponent(username)}`;
        const altResp = await axios.get(altUrl, { timeout: 15000 });
        const r = altResp.data?.result || altResp.data;

        if (!r || r.message?.includes("rate limit")) {
            return reply("⚠️ GitHub API rate limit exceeded. Please try again later.");
        }

        let userInfo = `👤 *Username*: ${r.name || r.username}
🔗 *Github Url*: ${r.html_url || "N/A"}
📝 *Bio*: ${r.bio || 'Not available'}
🏙️ *Location*: ${r.location || 'Unknown'}
📊 *Public Repos*: ${r.public_repos || 0}
👥 *Followers*: ${r.followers || 0} | Following: ${r.following || 0}
📅 *Created At*: ${r.created_at || "Unknown"}
🔭 *Public Gists*: ${r.public_gists || 0}
> © Powered by TRACLE / PrinceTech`;

        return await conn.sendMessage(from, {
            image: { url: r.avatar_url || "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" },
            caption: userInfo
        }, { quoted: mek });

    } catch (e) {
        console.error("[GitHubStalk] Error:", e.response?.data || e.message);
        reply(`⚠️ Error fetching details.\nDebug: ${e.message || String(e)}`);
    }
});
