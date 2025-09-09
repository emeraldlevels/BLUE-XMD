const axios = require('axios');
const config = require('../config');
const { cmd, commands } = require('../command');

// Helper: fetch JSON with retries
async function fetchJson(url, opts = {}, retries = 2, timeoutMs = 8000) {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, { signal: controller.signal, ...opts });
      clearTimeout(id);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.json();
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 500 + i * 300));
    }
  }
}

// Find best timezone from list
function findBestTimezone(tzList, location) {
  if (!Array.isArray(tzList)) return null;
  const loc = location.toLowerCase();

  for (const tz of tzList) {
    const last = tz.split("/").pop().replace(/_/g, " ").toLowerCase();
    if (last === loc) return tz;
  }

  for (const tz of tzList) {
    if (tz.toLowerCase().includes(loc)) return tz;
  }

  for (const tz of tzList) {
    const region = tz.split("/")[0].toLowerCase();
    if (region === loc) return tz;
  }

  return null;
}

// Format the time for the specified timezone
function formatForTimezone(timeZone) {
  const now = new Date();
  const timeStr = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  }).format(now);

  const dateStr = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(now);

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "short",
  }).formatToParts(now);
  const tzShort = (parts.find(p => p.type === "timeZoneName") || {}).value || "";

  return { timeStr, dateStr, tzShort };
}

cmd({
  pattern: "time",
  alias: ["worldtime", "timezone"],
  desc: "Get the current time in any city or timezone",
  category: "utility",
  react: "🕒",
  filename: __filename
}, async (conn, mek, m, { from, args, q, reply, sender, isOwner }) => {
  try {
    if (config.MODE === "private" && !isOwner) {
      return reply("❌ This command is not available in private mode.");
    }

    if (!q) {
      return reply("🕒 *Usage:* .time <city or country>\n*Example:* .time lagos\n*Example:* .time Europe/Paris");
    }

    const locationRaw = q.trim();

    try {
      let tzName = null;

      try {
        const tzList = await fetchJson("https://worldtimeapi.org/api/timezone", {}, 2, 7000);
        tzName = findBestTimezone(tzList, locationRaw);
      } catch {}

      if (!tzName) {
        try {
          const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationRaw)}&format=json&limit=1&addressdetails=1`;
          const nomOpts = { headers: { "User-Agent": `${config.BOT_NAME || "TRACLE"} - ${config.OWNER_NAME}` } };
          const nom = await fetchJson(nomUrl, nomOpts, 2, 8000);
          if (Array.isArray(nom) && nom.length > 0) {
            const { lat, lon } = nom[0];
            const timeApiUrl = `https://timeapi.io/api/Time/current/coordinate?latitude=${lat}&longitude=${lon}`;
            const timeApi = await fetchJson(timeApiUrl, {}, 2, 8000);
            if (timeApi?.timeZone) tzName = timeApi.timeZone;
          }
        } catch {}
      }

      if (!tzName && locationRaw.includes("/")) tzName = locationRaw;

      if (!tzName) {
        return reply(`❌ Couldn't determine timezone for "${locationRaw}".\n\nTry a city like "paris" or a timezone like "Europe/Paris".\n\n> ⚡ Powered by BrenaldMedia`);
      }

      const { timeStr, dateStr, tzShort } = formatForTimezone(tzName);
      const result = `🕒 *Current time in ${tzName}:*\n\n⏰ *Time:* ${timeStr}\n📅 *Date:* ${dateStr}\n🌍 *Timezone:* ${tzShort}\n\n> ⚡ Powered by BrenaldMedia`;

      await reply(result);

    } catch (err) {
      console.error("Time command error:", err);
      await reply(`❌ Failed to fetch time for "${locationRaw}".\n\nTry a valid city or timezone.\n\n> ⚡ Powered by BrenaldMedia`);
    }
  } catch (error) {
    console.error("Time command execution error:", error);
    reply("❌ An unexpected error occurred. Please try again.");
  }
});