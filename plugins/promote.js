const { cmd } = require('../command');

cmd({
    pattern: "promote",
    alias: ["p", "makeadmin"],
    desc: "Promotes a member to group admin",
    category: "admin",
    react: "⬆️",
    filename: __filename
},
async (conn, mek, m, {
    from, quoted, q, isGroup, sender, isAdmins, isBotAdmins, reply
}) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (!isAdmins) return reply("❌ Only group admins can use this command.");
        if (!isBotAdmins) return reply("❌ I need to be an admin to use this command.");

        // Fetch group metadata
        const metadata = await conn.groupMetadata(from).catch(() => null);
        if (!metadata) return reply("❌ Failed to fetch group metadata.");

        let number;
        if (quoted) {
            number = quoted.sender.split("@")[0];
        } else if (q) {
            number = q.replace(/[@\s]/g, '');
        } else {
            return reply("❌ Reply to a message or provide a number to promote.");
        }

        const jid = number + "@s.whatsapp.net";

        await conn.groupParticipantsUpdate(from, [jid], "promote");
        reply(`✅ Successfully promoted @${number} to admin.`, { mentions: [jid] });

    } catch (error) {
        console.error("Promote command error:", error);
        reply("❌ Failed to promote the member.");
    }
});
