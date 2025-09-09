module.exports = async (conn, mek) => {
    try {
        const sender = mek.key?.remoteJid || "unknown";
        const message = mek.message?.conversation ||
                        mek.message?.extendedTextMessage?.text ||
                        "No text message";

        console.log(`[SMS] Message from ${sender}: ${message}`);

        // Optional: Reply to the user to test
        if (message.toLowerCase() === "ping") {
            await conn.sendMessage(sender, { text: "pong!" });
        }
    } catch (err) {
        console.error("Error in sms handler:", err);
    }
};
