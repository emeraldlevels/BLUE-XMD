// plugins/ipstalk.js
const axios = require("axios");
const { cmd } = require("../command");

cmd({
  pattern: "ipstalk",
  alias: ["iplookup", "ipinfo", "ip"],
  react: "🌍",
  desc: "Get details about an IP address or phone number (reply or type).",
  category: "search",
  filename: __filename,
}, async (conn, m, store, { from, args, q, reply }) => {
  try {
    // Helpers
    const isIPv4 = (s) =>
      !!s && /^\b(?:(?:25[0-5]|2[0-4]\d|1?\d{1,2})(?:\.(?:25[0-5]|2[0-4]\d|1?\d{1,2})){3})\b$/.test(s);

    const extractIP = (text) => {
      if (!text) return null;
      const match = text.match(
        /\b(?:(?:25[0-5]|2[0-4]\d|1?\d{1,2})(?:\.(?:25[0-5]|2[0-4]\d|1?\d{1,2})){3})\b/
      );
      return match ? match[0] : null;
    };

    // Determine input
    let ip = null;
    let phone = null;
    const input = (q || "").trim();

    if (input) {
      if (isIPv4(input) || extractIP(input)) {
        ip = extractIP(input) || input;
      } else if (/^\+?\d+$/.test(input)) {
        phone = input;
      } else {
        return reply("❎ Provide a valid IPv4 (e.g. 41.90.70.195) or phone number (+2348012345678).");
      }
    } else if (m.quoted) {
      const quotedText =
        m.quoted?.text ||
        m.quoted?.message?.conversation ||
        m.quoted?.message?.extendedTextMessage?.text ||
        m.quoted?.message?.imageMessage?.caption ||
        m.quoted?.message?.videoMessage?.caption ||
        "";

      const foundIP = extractIP(String(quotedText));
      if (foundIP) {
        ip = foundIP;
      } else {
        const quotedSender = m.quoted?.sender || m.quoted?.key?.participant || m.quoted?.participant;
        const contactMsg = m.quoted?.message?.contactMessage || null;

        if (contactMsg?.vcard) {
          const v = contactMsg.vcard;
          const telMatch = v.match(/TEL[^:]*:(\+?\d[\d\s-]*)/i);
          const tel = telMatch ? telMatch[1].replace(/\s|-/g, "") : null;
          if (tel) phone = tel;
        } else if (quotedSender) {
          phone = String(quotedSender).split("@")[0];
        }
      }
    }

    // No usable input
    if (!ip && !phone) {
      return reply("❎ Provide an IPv4 or phone number.\n\nExamples:\n.ipstalk 41.90.70.195\n.ipstalk +2348012345678");
    }

    // ========== IP LOOKUP ==========
    if (ip) {
      await reply(`🔍 Looking up IP: *${ip}* ...`);
      const url = `https://ipapi.co/${ip}/json/`;
      const resp = await axios.get(url, { timeout: 15000 });
      const r = resp.data;

      if (!r || r.error) {
        return reply("❌ Could not fetch IP details.");
      }

      const info = `╭━━〔 *🌍 IP Lookup* 〕━━┈⊷
┃ 📌 IP: ${r.ip || ip}
┃ 🌎 Country: ${r.country_name || "Unknown"} (${r.country || "?"})
┃ 🏙 Region: ${r.region || "Unknown"}
┃ 🏙 City: ${r.city || "Unknown"}
┃ 📮 Postal: ${r.postal || "N/A"}
┃ 🛰 ASN: ${r.asn || "N/A"}
┃ 🏢 ISP: ${r.org || "N/A"}
┃ ⏰ Timezone: ${r.timezone || "N/A"}
┃ 📍 Location: ${r.latitude || "?"}, ${r.longitude || "?"}
╰━━━━━━━━━━━━━━━━━━━┈⊷
> © Powered by TRACLE`;

      return await conn.sendMessage(from, { text: info }, { quoted: m });
    }

    // ========== PHONE LOOKUP ==========
    if (phone) {
      await reply(`🔍 Looking up phone: *${phone}* ...`);
      const url = `https://api.numlookupapi.com/v1/validate/${encodeURIComponent(phone)}?apikey=free`;
      const resp = await axios.get(url, { timeout: 15000 });
      const r = resp.data;

      if (!r || r.valid === false) {
        return reply("❌ Could not fetch phone details.");
      }

      const info = `╭━━〔 *📱 Phone Info* 〕━━┈⊷
┃ ☎️ Number: ${r.international_format || phone}
┃ 🌍 Country: ${r.country_name || "Unknown"} (${r.country_code || "?"})
┃ 📶 Carrier: ${r.carrier || "N/A"}
┃ 📌 Line type: ${r.line_type || "N/A"}
╰━━━━━━━━━━━━━━━━━━━┈⊷
> © Powered by TRACLE`;

      return await conn.sendMessage(from, { text: info }, { quoted: m });
    }

  } catch (err) {
    console.error("IPStalk Error:", err.response?.data || err.message);
    return reply(`⚠️ Error fetching details.\nDebug: ${err.message || String(err)}`);
  }
});
