const { cmd } = require('../command');

cmd({
    pattern: "opengroup",
    alias: ["unmute"],
    desc: "Opens the group (anyone can send messages)",
    category: "group",
    react: "🔓",
    filename: __filename
},
async (conn, m, { reply, react }) => {
    if (!m.isGroup) {
        await react("❌");
        return reply("This command can only be used in groups.");
    }

    try {
        const metadata = await conn.groupMetadata(m.chat);
        const admins = metadata.participants.filter(p => p.admin).map(p => p.id);

        if (!admins.includes(m.sender)) {
            await react("❌");
            return reply("Only group admins can use this command.");
        }

        await conn.groupSettingUpdate(m.chat, "not_announcement");
        await react("✅");
        reply("🔓 The group is now *open*. Everyone can send messages.");
    } catch (error) {
        console.error("Open group error:", error);
        await react("❌");
        reply("❌ Failed to open the group.");
    }
});

cmd({
    pattern: "closegroup",
    alias: ["mute"],
    desc: "Closes the group (only admins can send messages)",
    category: "group",
    react: "🔒",
    filename: __filename
},
async (conn, m, { reply, react }) => {
    if (!m.isGroup) {
        await react("❌");
        return reply("This command can only be used in groups.");
    }

    try {
        const metadata = await conn.groupMetadata(m.chat);
        const admins = metadata.participants.filter(p => p.admin).map(p => p.id);

        if (!admins.includes(m.sender)) {
            await react("❌");
            return reply("Only group admins can use this command.");
        }

        await conn.groupSettingUpdate(m.chat, "announcement");
        await react("✅");
        reply("🔒 The group is now *closed*. Only admins can send messages.");
    } catch (error) {
        console.error("Close group error:", error);
        await react("❌");
        reply("❌ Failed to close the group.");
    }
});
