const { cmd } = require("../command");
const { sleep } = require("../lib/functions");

cmd({
    pattern: "restart",
    desc: "Restart TRACLE",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { reply, isCreator }) => {
    try {
        if (!isCreator) {
            return reply("❌ Only the bot owner can use this command.");
        }

        const startTime = Date.now();

        // Reply immediately before exiting
        await reply("♻️ Restarting TRACLE...");

        // Small delay so message is sent
        await sleep(1000);

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log(`✅ Restart command executed. Took ${duration}s.`);

        // Exit the process — if you run via PM2 or terminal, it should restart automatically
        process.exit(0);

    } catch (e) {
        console.error("❌ Restart command error:", e);
        await reply(`❌ Error: ${e.message || e}`);
    }
});
