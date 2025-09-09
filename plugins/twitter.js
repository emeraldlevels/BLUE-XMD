import fetch from "node-fetch";
import * as config from "../config.js";

export const name = ["twitter"];
export const prefixes = ["+", "-", "#", ".", ""];
export const description = "Download Twitter media";

export async function execute(sock, msg, args, from) {
  const senderJid = msg.key.participant || msg.key.remoteJid;
  const FOOTER = `\n\n> ⚡ Powered by *${config.OWNER_NAME}* ⚡`;

  if (!args[0]) {
    return sock.sendMessage(from, {
      text: `❌ Usage: twitter <Tweet URL>${FOOTER}`,
      mentions: [senderJid],
      quoted: msg,
    });
  }

  const url = encodeURIComponent(args[0]);
 const apiUrl = `${config.API_BASE}/api/download/twitter?apikey=${config.API_KEY}&url=${url}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data?.result?.link) {
      return sock.sendMessage(from, {
        text: `❌ Failed to fetch Twitter media.${FOOTER}`,
        mentions: [senderJid],
        quoted: msg,
      });
    }

    await sock.sendMessage(from, {
      video: { url: data.result.link },
      mimetype: "video/mp4",
      fileName: `twitter_video.mp4`,
      caption: `✅ Download ready${FOOTER}`,
      quoted: msg,
    });
  } catch (err) {
    console.error("❌ twitter error:", err);
    await sock.sendMessage(from, {
      text: `❌ Error downloading Twitter media.${FOOTER}`,
      mentions: [senderJid],
      quoted: msg,
    });
  }
}
