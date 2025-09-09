// plugin/mode-command.js
const { cmd } = require('../command');

// In-memory mode store
let BOT_MODE = "public"; // default
const MODE_EMOJIS = {
    public: "🟢",
    private: "🔴",
    inbox: "📥",
    groups: "👥"
};

// Helper to get mode status
function getModeStatus() {
    return `Bot mode: ${MODE_EMOJIS[BOT_MODE] || "❔"} ${BOT_MODE.toUpperCase()}`;
}

// Helper to set mode
function setMode(newMode) {
    if (["public", "private", "inbox", "groups"].includes(newMode)) {
        BOT_MODE = newMode;
        return `Bot mode set to: ${MODE_EMOJIS[newMode]} ${newMode.toUpperCase()} ✅`;
    }
    return "❌ Invalid mode. Use 'public', 'private', 'inbox', or 'groups'.";
}

// Helper to toggle between public and private
function toggleMode() {
    BOT_MODE = BOT_MODE === "public" ? "private" : "public";
    return `Bot mode toggled to: ${MODE_EMOJIS[BOT_MODE]} ${BOT_MODE.toUpperCase()} ✅`;
}

// Check if bot should respond
function shouldRespond(isOwner, isGroup) {
    if (isOwner) return true; // owner always has access

    switch (BOT_MODE) {
        case "private":
            return false;
        case "public":
            return true;
        case "inbox":
            return !isGroup;
        case "groups":
            return isGroup;
        default:
            return true;
    }
}

// ===== Commands =====

// Main mode command
cmd({
    pattern: "mode",
    desc: "Check or set bot mode",
    category: "owner",
    fromMe: true
}, async (conn, mek, m, { text, reply }) => {
    const input = text.toLowerCase().trim();
    let msg;

    if (["public", "private", "inbox", "groups"].includes(input)) {
        msg = setMode(input);
    } else if (input === "toggle") {
        msg = toggleMode();
    } else {
        msg = getModeStatus();
        msg += "\nUsage:\n- `.mode public` - set public\n- `.mode private` - set private\n- `.mode inbox` - only DMs\n- `.mode groups` - only groups\n- `.mode toggle` - switch public/private";
    }

    await reply(msg);
});

// Quick set commands
["public", "private", "inbox", "groups"].forEach(mode => {
    cmd({
        pattern: mode,
        desc: `Set bot to ${mode} mode`,
        category: "owner",
        fromMe: true
    }, async (conn, mek, m, { reply }) => {
        const msg = setMode(mode);
        await reply(msg);
    });
});

// Export helpers for index.js
module.exports = {
    shouldRespond,
    getMode: () => BOT_MODE
};
