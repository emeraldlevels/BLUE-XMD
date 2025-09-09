const { cmd } = require('../command');
const fetch = require('node-fetch');

cmd({
  pattern: 'bible',
  alias: ['verse', 'bible'],
  react: "✝️",
  desc: "Get Bible verse by book, chapter, and verse (e.g., `.bible John 3:16`).",
  category: "faith",
  filename: __filename
},
async (conn, mek, m, { from, args, reply, quoted }) => {
  try {
    const input = args.join(' ').trim();
    if (!input) {
      return reply("Please input a reference, e.g. `.bible John 3:16`");
    }

    const encoded = encodeURIComponent(input);
    const url = `https://bible-api.com/${encoded}`;
    const res = await fetch(url);

    if (!res.ok) {
      return reply(`Error fetching verse: ${res.status}`);
    }

    const data = await res.json();

    if (data.error) {
      return reply(`Bible API error: ${data.error}`);
    }

    // Format verse(s)
    const verses = Array.isArray(data.verses) ? data.verses : [data];
    const content = verses.map(v =>
      `${v.book_name} ${v.chapter}:${v.verse} — ${v.text.trim()}`
    ).join('\n\n');

    const caption = `**Bible (${data.translation_name || 'WEB'})**\n\n${content}`;

    await conn.sendMessage(from, { text: caption }, { quoted });

  } catch (e) {
    console.error(e);
    reply(`Error: ${e.message}`);
  }
});
