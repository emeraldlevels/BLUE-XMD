const { cmd } = require("../command");
const config = require("../config");
const nodemailer = require("nodemailer");

cmd({
    pattern: "report",
    alias: ["ask", "bug", "request"],
    desc: "Report a bug or request a feature",
    category: "utility",
    filename: __filename
}, async (conn, mek, m, { args, reply }) => {
    try {
        if (!args.length) {
            return reply(`Example: ${config.PREFIX}report Play command is not working`);
        }

        const reportedMessages = {};
        const messageId = m.key.id;

        if (reportedMessages[messageId]) {
            return reply("⚠️ This report has already been sent. Please wait for a response.");
        }
        reportedMessages[messageId] = true;

        // Prepare report text
        const reportText = `
*| REQUEST / BUG REPORT |*

👤 User: @${m.sender.split("@")[0]}
💬 Message: ${args.join(" ")}
        `;

        // === Email Transporter (TRACLE) ===
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "brenaldmedia@gmail.com", 
                pass: "kfms ptdp zpes hsdg "  
            }
        });

        // === Send Email ===
        await transporter.sendMail({
            from: `"TRACLE Bot" <brenaldmedia@gmail.com>`,
            to: "brenaldmedia@gmail.com",
            subject: "New Bug Report / Feature Request - TRACLE",
            text: reportText
        });

        // Confirmation to user
        reply(`✅ Hi ${m.pushName}, your report has been sent to  *${config.BOT_NAME}'s* developer's email . Please wait for a response.`);

    } catch (error) {
        console.error(error);
        reply("❌ An error occurred while processing your report.");
    }
});
