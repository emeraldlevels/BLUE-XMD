const axios = require("axios");
const { cmd } = require("../command");

// === PERSONAL DATA ===
const personalInfo = {
  name: "BrenaldMedia",
  role: "Web Developer, Editor & Creator of Tracle Bot",
  description: "I'm a creative full-stack developer, editor, and innovator. I specialize in building modern tools, automation systems, and engaging content. As the creator of Tracle Bot, I blend coding, creativity, and problem-solving to build projects that help communities online.",
  links: {
    BOT_CHANNEL: "https://whatsapp.com/channel/0029VbBPPXV3WHTTNAWOGf0m",
    REPO_LINK: "https://github.com/Brenaldmedia/Tracle",
    YOUTUBE: "https://www.youtube.com/@BrenaldMedia",
    TIKTOK: "https://www.tiktok.com/@brenaldmedia?_",
    DISCORD: "https://discord.gg/f3RNWAh2",
    COMMUNITY: "https://chat.whatsapp.com/HyjSzOxCm8PEc3fEyvzL9S?mode=ems_copy_t"
  }
};

// === MEMORY ===
const memoryMap = {};
const MEMORY_CLEAR_MS = 20 * 60 * 1000;
setInterval(() => {
  for (const k of Object.keys(memoryMap)) delete memoryMap[k];
  console.log("🧹 Tracle AI memory refreshed (20 minutes).");
}, MEMORY_CLEAR_MS);

// === Helper functions ===
function getChatId(mek, m, from) {
  if (from) return from;
  if (mek?.key?.remoteJid) return mek.key.remoteJid;
  if (m?.key?.remoteJid) return m.key.remoteJid;
  return "private";
}

function pushMemory(chatId, line) {
  if (!memoryMap[chatId]) memoryMap[chatId] = [];
  memoryMap[chatId].push(line);
  if (memoryMap[chatId].length > 40) memoryMap[chatId].shift();
}

// === Ask PrinceTech API ===
async function askPrinceTech(prompt) {
  try {
    const apiUrl = `https://api.princetechn.com/api/ai/ai?apikey=prince&q=${encodeURIComponent(prompt)}`;
    const { data } = await axios.get(apiUrl, { timeout: 20000 });
    if (!data || !data.result) return "⚠️ No response from PrinceTech AI.";
    if (typeof data.result === "string") return data.result;
    if (data.result.error) return `⚠️ API Error: ${data.result.error}`;
    return JSON.stringify(data.result).slice(0, 2000);
  } catch (e) {
    console.error("[TracleAI] PrinceTech API error:", e.response?.data || e.message);
    return "⚠️ Failed to contact PrinceTech AI.";
  }
}

// === Core AI Handler ===
async function handleAI(conn, mek, m, from, query, replyFn) {
  try {
    const chatId = getChatId(mek, m, from);
    pushMemory(chatId, `User: ${query}`);
    const recent = (memoryMap[chatId] || []).slice(-20).join("\n");
    const context = `
You are *Tracle AI*, a personal AI assistant for ${personalInfo.name}.

Creator info:
- Name: ${personalInfo.name}
- Role: ${personalInfo.role}
- Description: ${personalInfo.description}

Links:
- WhatsApp Channel: ${personalInfo.links.BOT_CHANNEL}
- GitHub: ${personalInfo.links.REPO_LINK}
- YouTube: ${personalInfo.links.YOUTUBE}
- TikTok: ${personalInfo.links.TIKTOK}
- Discord: ${personalInfo.links.DISCORD}
- Community: ${personalInfo.links.COMMUNITY}

Conversation history:
${recent}

User: ${query}
AI:`.trim();

    await replyFn?.("🤖 Thinking...");
    const aiText = await askPrinceTech(context);
    pushMemory(chatId, `AI: ${aiText}`);
    await conn.sendMessage(from, { text: `💡 *Tracle AI says:*\n\n${aiText}` }, mek ? { quoted: mek } : {});
  } catch (err) {
    console.error("[TracleAI] handleAI fatal:", err.message || err);
    await replyFn?.(`⚠️ Error: ${err.message || err}`);
  }
}

// === Commands ===

// .tai
cmd({
  pattern: "tai",
  alias: ["tracleai", "askai", "tracle"],
  desc: "Talk to Tracle AI",
  category: "ai",
  react: "🤖",
  filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
  const query = args.join(" ");
  if (!query) return reply("❎ Ask me something.\n\nExample: `.tai what is JavaScript?`");
  await handleAI(conn, mek, m, from, query, reply);
});

// .clearmem
cmd({
  pattern: "clearmem",
  desc: "Clear AI memory for this chat",
  category: "ai",
  react: "🧹",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
  const chatId = getChatId(mek, m, from);
  delete memoryMap[chatId];
  return reply("🧹 Tracle AI memory for this chat was cleared.");
});
