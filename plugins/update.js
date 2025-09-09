const { cmd } = require("../command");
const axios = require("axios");

cmd({
  pattern: "checkupdate",
  alias: ["update", "newversion"],
  react: "🛰️",
  desc: "Check if TRACLE has new updates on GitHub",
  category: "owner",
  filename: __filename
}, async (client, message, match, { from, isCreator }) => {
  try {
    if (!isCreator) {
      return await client.sendMessage(
        from,
        { text: "📛 Owner only." },
        { quoted: message }
      );
    }

    const url = "https://api.github.com/repos/Brenaldmedia/Tracle/commits/main";

    const response = await axios.get(url).catch(err => {
      if (err.response && err.response.status === 409) {
        // No commits in the repo/branch
        return { data: null };
      }
      throw err;
    });

    if (!response.data) {
      return await client.sendMessage(
        from,
        { text: "ℹ️ No update available yet. (Repo is empty)" },
        { quoted: message }
      );
    }

    const latestCommit = response.data;
    const commitMsg = latestCommit.commit.message;
    const commitTime = latestCommit.commit.author.date;
    const commitUrl = latestCommit.html_url;

    await client.sendMessage(
      from,
      {
        text: `🚀 *TRACLE Update Check*\n\n✅ Latest Commit: *${commitMsg}*\n🕒 Date: ${commitTime}\n🔗 [View Commit](${commitUrl})`
      },
      { quoted: message }
    );

  } catch (error) {
    console.error("checkupdate Error:", error);
    await client.sendMessage(
      from,
      { text: "❌ Failed to check update: " + error.message },
      { quoted: message }
    );
  }
});
