const { cmd } = require('../command');

// Close/Mute command
cmd({
    pattern: "close",
    alias: ["mute", "groupclose"],
    react: "🔒",
    desc: "Mute the group (Only admins can send messages).",
    category: "group",
    filename: __filename
},           
async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, reply, isOwner }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (!isAdmins && !isOwner) return reply("❌ Only group admins or the bot owner can use this command.");
        if (!isBotAdmins) return reply("❌ I need to be an admin to mute the group.");

        await conn.groupSettingUpdate(from, "announcement"); // ✅ close group
        reply("🔒 Group has been *muted*. Only admins can send messages now.");
    } catch (e) {
        console.error("Error muting group:", e);
        reply("❌ Failed to mute the group. Please try again.");
    }
});
