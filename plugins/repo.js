const { cmd } = require("../command");
const axios = require("axios"); // Use axios instead of fetch

cmd({
  pattern: "repo",
  alias: ["script", "repository"],
  react: "📂",
  desc: "Show repository details",
  category: "general",
  filename: __filename
}, async (client, message, match, { from }) => {
  try {
    // === Your GitHub repo ===
    const owner = "Brenaldmedia";
    const repo = "Tracle";

    // GitHub API endpoint
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

    // Fetch repo info using axios
    const res = await axios.get(apiUrl);
    const data = res.data;

    // Format the reply
    let reply = `
📦 *TRACLE'S Repository Information*

🔗 Repo: ${data.html_url}
📛 Name: ${data.full_name}
⭐ Stars: ${data.stargazers_count}
🍴 Forks: ${data.forks_count}
👀 Watchers: ${data.subscribers_count || data.watchers_count}
❗ Open Issues: ${data.open_issues_count}
📅 Created: ${new Date(data.created_at).toLocaleString()}
📝 Updated: ${new Date(data.updated_at).toLocaleString()}


⚡ Description:
${data.description || "No description provided"}
    `;

    // Send back to chat
    await client.sendMessage(from, { text: reply }, { quoted: message });

  } catch (error) {
    console.error("Repo command error:", error);
    await client.sendMessage(from, {
      text: "❌ Failed to fetch repo details: " + error.message
    }, { quoted: message });
  }
});