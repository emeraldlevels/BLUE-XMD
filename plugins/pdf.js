const { cmd } = require('../command');
const PDFDocument = require('pdfkit');
const { Buffer } = require('buffer');

cmd({
    pattern: "topdf",
    alias: ["pdf", "topdf"],
    use: '.topdf',
    desc: "Convert provided text to a PDF file.",
    react: "📁",
    category: "utilities",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❎ Please provide the text you want to convert to PDF. *Eg:* `.topdf Pakistan ZindaBad 🇵🇰`");

        // Dynamic filename using first few words
        const fileName = q.split(" ").slice(0, 5).join("_") + ".pdf";

        // Create a new PDF document
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));

        // Add text to PDF with basic formatting
        doc.fontSize(20).text("📄 Generated PDF", { align: 'center', underline: true });
        doc.moveDown();
        doc.fontSize(14).text(q, {
            align: 'left',
            lineGap: 4
        });

        doc.on('end', async () => {
            const pdfData = Buffer.concat(buffers);

            // Send PDF to WhatsApp
            await conn.sendMessage(from, {
                document: pdfData,
                mimetype: 'application/pdf',
                fileName,
                caption: `
*📄 PDF Created Successfully!*

> © Created by Tracle 💜`
            }, { quoted: mek });
        });

        // Finalize PDF
        doc.end();

    } catch (e) {
        console.error(e);
        reply(`❌ Error: ${e.message}`);
    }
});
