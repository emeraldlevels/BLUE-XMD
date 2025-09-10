const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

// Robust convertToBool
function convertToBool(value, defaultValue = false) {
    if (typeof value === 'undefined') return defaultValue;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return Boolean(value);
}

module.exports = {
    // === STATUS FEATURES ===
    AUTO_STATUS_SEEN: convertToBool(process.env.AUTO_STATUS_SEEN, true),
    AUTO_STATUS_REPLY: convertToBool(process.env.AUTO_STATUS_REPLY, false),
    AUTO_STATUS_REACT: convertToBool(process.env.AUTO_STATUS_REACT, true),
    AUTO_STATUS_MSG: process.env.AUTO_STATUS_MSG || "*YOUR STATUS HAS BEEN SEEN BY BLUE-XMD* 😊",

    // === WELCOME / EVENTS ===
    WELCOME: convertToBool(process.env.WELCOME, true),
    GOODBYE: convertToBool(process.env.GOODBYE, true),
    ADMIN_EVENTS: convertToBool(process.env.ADMIN_EVENTS, true),

    // === ANTI-LINK / BAD WORDS ===
    ANTI_LINK: convertToBool(process.env.ANTI_LINK, true),
    ANTI_LINK_KICK: convertToBool(process.env.ANTI_LINK_KICK, false),
    DELETE_LINKS: convertToBool(process.env.DELETE_LINKS, true),
    ANTI_BAD: convertToBool(process.env.ANTI_BAD, true),

    // === MENTION / AUTO REACT ===
    MENTION_REPLY: convertToBool(process.env.MENTION_REPLY, false),
    CUSTOM_REACT: convertToBool(process.env.CUSTOM_REACT, false),
    CUSTOM_REACT_EMOJIS: process.env.CUSTOM_REACT_EMOJIS || "💝,💖,💗,❤️‍🩹,❤️,🧡,💛,💚,💙,💜,🤎,🖤,🤍",
    AUTO_REACT: convertToBool(process.env.AUTO_REACT, false),

    // === MODE / BEHAVIOUR ===
    MODE: process.env.MODE || "public",
    ALWAYS_ONLINE: convertToBool(process.env.ALWAYS_ONLINE, false),
    PUBLIC_MODE: convertToBool(process.env.PUBLIC_MODE, true),
    AUTO_REPLY: convertToBool(process.env.AUTO_REPLY, false),
    AUTO_VOICE: convertToBool(process.env.AUTO_VOICE, false),
    AUTO_STICKER: convertToBool(process.env.AUTO_STICKER, false),
    READ_MESSAGE: convertToBool(process.env.READ_MESSAGE, false),
    READ_CMD: convertToBool(process.env.READ_CMD, false),

    // === AUTO PRESENCE ===
    AUTO_RECORDING: convertToBool(process.env.AUTO_RECORDING, false),
    AUTO_TYPING: convertToBool(process.env.AUTO_TYPING, false),

    // === OWNER & BOT DETAILS ===
    OWNER_NUMBER: process.env.OWNER_NUMBER || "2349041772077",
    OWNER_NAME: process.env.OWNER_NAME || "Mr Emerald",
    BOT_NAME: process.env.BOT_NAME || "Blue-xmd",
    PREFIX: process.env.PREFIX || ".",
    STICKER_NAME: process.env.STICKER_NAME || "Blue-xmd",
    DESCRIPTION: process.env.DESCRIPTION || "*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ BLUE-XMD*",
    DEV: process.env.DEV || "2349041772077",

    // === MESSAGES & MEDIA ===
    MENU_IMAGE_URL: process.env.MENU_IMAGE_URL || "https://files.catbox.moe/lthtjq.jpeg",
    ALIVE_IMG: process.env.ALIVE_IMG || "https://files.catbox.moe/gcojxb.jpg",
    LIVE_MSG: process.env.LIVE_MSG || "🚀 *BLUE-XMD  is Alive!* 🚀",

    // === ANTI DELETE / VIEW ONCE ===
    ANTI_VV: convertToBool(process.env.ANTI_VV, true),
    ANTI_DEL_PATH: process.env.ANTI_DEL_PATH || "log",

    // === LINKS / SOCIAL ===
    BOT_CHANNEL: process.env.BOT_CHANNEL || "https://whatsapp.com/channel/0029Vb6OLyzEAKWFsk7REX3r",
    REPO_LINK: process.env.REPO_LINK || "https://github.com/emeraldlevels/BLUE-XMD",
    YOUTUBE: process.env.YOUTUBE || "https://www.youtube.com/@EmeraldLevels",
    TIKTOK: process.env.TIKTOK || "https://tiktok.com/@emeralds.levels",
    INSTAGRAM: process.env.INSTAGRAM || "",// fill in if available
    TWITTER: process.env.TWITTER || "", // fill in if available
    DISCORD: process.env.DISCORD || "https://discord.gg/f3RNWAh2",
    WEBSITE: process.env.WEBSITE || "",// fill in if available
    COMMUNITY: process.env.COMMUNITY || "https://chat.whatsapp.com/EdtpVr9VqbPJwWYdH92vXI?mode=ems_copy_c",

    // === BANK DETAILS (optional / for placeholders) ===
    BANK_NAME: process.env.BANK_NAME || "access bank",// replace with your bank name
    ACCOUNT_NUMBER: process.env.ACCOUNT_NUMBER || "1486604137", // replace with your account number
    ACCOUNT_NAME: process.env.ACCOUNT_NAME || "fransisca kelechi Okonkwo" // replace with your account name
};
