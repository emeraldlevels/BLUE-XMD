// plugins/translate.js
const axios = require('axios');
const { cmd } = require('../command');

// Language mapping
const langMap = {
  english: "en", en: "en",
  french: "fr", fr: "fr", 
  spanish: "es", es: "es",
  hindi: "hi", hi: "hi",
  arabic: "ar", ar: "ar",
  chinese: "zh", zh: "zh",
  russian: "ru", ru: "ru",
  german: "de", de: "de",
  italian: "it", it: "it",
  japanese: "ja", ja: "ja",
  korean: "ko", ko: "ko",
  portuguese: "pt", pt: "pt",
  turkish: "tr", tr: "tr"
};

// Reverse mapping for language codes to names
const langNameMap = {
  en: "English",
  fr: "French",
  es: "Spanish",
  hi: "Hindi",
  ar: "Arabic",
  zh: "Chinese",
  ru: "Russian",
  de: "German",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  pt: "Portuguese",
  tr: "Turkish"
};

// Function to extract text from different message types
function extractText(message) {
  if (!message) return '';
  
  if (message.conversation) return message.conversation;
  if (message.extendedTextMessage && message.extendedTextMessage.text) return message.extendedTextMessage.text;
  if (message.imageMessage && message.imageMessage.caption) return message.imageMessage.caption;
  if (message.videoMessage && message.videoMessage.caption) return message.videoMessage.caption;
  if (message.documentMessage && message.documentMessage.caption) return message.documentMessage.caption;
  
  return '';
}

// Function to detect language using a simple approach
function detectLanguage(text) {
  // Simple language detection based on common characters
  if (/[а-яА-Я]/.test(text)) return 'ru';
  if (/[一-龯]/.test(text) || /[ぁ-ん]/.test(text) || /[ァ-ン]/.test(text)) return 'ja';
  if (/[가-힣]/.test(text)) return 'ko';
  if (/[أ-ي]/.test(text)) return 'ar';
  if (/[α-ωΑ-Ω]/.test(text)) return 'el'; // Greek
  
  // For European languages, we'll rely on the API's auto-detection
  return 'auto';
}

// ================== TRANSLATE REPLY COMMAND ==================
cmd({
  pattern: "trtr",
  alias: ["translate"],
  desc: "🌍 Translate replied message to English",
  react: "🌐",
  category: "tools",
  filename: __filename
}, async (conn, mek, m, { reply }) => {
  try {
    // Check if this is a reply to another message
    if (!mek.message.extendedTextMessage || !mek.message.extendedTextMessage.contextInfo || !mek.message.extendedTextMessage.contextInfo.quotedMessage) {
      return reply("❌ Please reply to a message with .trtr to translate it to English");
    }

    // Get the quoted message
    const quotedMsg = mek.message.extendedTextMessage.contextInfo.quotedMessage;
    const textToTranslate = extractText(quotedMsg);

    if (!textToTranslate || textToTranslate.trim().length === 0) {
      return reply("❌ No text found in the replied message to translate");
    }

    if (textToTranslate.length > 500) {
      return reply("❌ Text too long. Maximum 500 characters.");
    }

    // Show typing indicator
    await conn.sendPresenceUpdate('composing', mek.key.remoteJid);

    // Try multiple translation services if one fails
    let translation = '';
    let detectedLang = 'unknown';
    
    // Try Google Translate API first (more reliable)
    try {
      const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(textToTranslate)}`;
      const googleResponse = await axios.get(googleUrl, { timeout: 8000 });
      
      if (googleResponse.data && googleResponse.data[0]) {
        translation = googleResponse.data[0].map(item => item[0]).join('');
        detectedLang = googleResponse.data[2] || 'unknown';
      }
    } catch (googleError) {
      console.log("Google Translate failed, trying MyMemory");
      
      // Fallback to MyMemory
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=auto|en`;
      const myMemoryResponse = await axios.get(myMemoryUrl, { timeout: 8000 });

      if (myMemoryResponse.data && myMemoryResponse.data.responseData && myMemoryResponse.data.responseData.translatedText) {
        translation = myMemoryResponse.data.responseData.translatedText;
        detectedLang = myMemoryResponse.data.responseData.detectedSourceLanguage || 'unknown';
      } else {
        throw new Error("Both translation services failed");
      }
    }

    const translationMessage = 
      `> *🌍 TRACLE TRANSLATION*\n\n` +
      `🔤 *Original (${detectedLang.toUpperCase()})*: ${textToTranslate}\n` +
      `🔠 *Translated (EN)*: ${translation}\n\n` +
      `> _Powered by TRACLE_`;

    await reply(translationMessage);

  } catch (error) {
    console.error("Translation error:", error);
    
    if (error.code === 'ECONNABORTED' || error.response?.status === 429) {
      reply("⚠️ Translation service is busy. Please try again in a moment.");
    } else {
      reply("❌ Failed to translate message. Please try again later.");
    }
  } finally {
    await conn.sendPresenceUpdate('paused', mek.key.remoteJid);
  }
});

// ================== TRANSLATE TO SPECIFIC LANGUAGE ==================
cmd({
  pattern: "trt",
  alias: ["translate-to"],
  desc: "🌍 Translate replied message to specific language",
  usage: ".trt <language> (reply to a message)",
  react: "🌐",
  category: "tools",
  filename: __filename
}, async (conn, mek, m, { reply, args }) => {
  try {
    // Check if language is provided
    if (!args[0]) {
      return reply("❌ Please specify a language. Example: .trt french (reply to a message)");
    }

    // Check if this is a reply to another message
    if (!mek.message.extendedTextMessage || !mek.message.extendedTextMessage.contextInfo || !mek.message.extendedTextMessage.contextInfo.quotedMessage) {
      return reply("❌ Please reply to a message with .trt <language> to translate it");
    }

    const targetLang = langMap[args[0].toLowerCase()];
    if (!targetLang) {
      const supportedLangs = Object.keys(langMap).filter(k => k.length > 2).join(', ');
      return reply(`❌ Unsupported language. Supported: ${supportedLangs}`);
    }

    // Get the quoted message
    const quotedMsg = mek.message.extendedTextMessage.contextInfo.quotedMessage;
    const textToTranslate = extractText(quotedMsg);

    if (!textToTranslate || textToTranslate.trim().length === 0) {
      return reply("❌ No text found in the replied message to translate");
    }

    if (textToTranslate.length > 500) {
      return reply("❌ Text too long. Maximum 500 characters.");
    }

    // Show typing indicator
    await conn.sendPresenceUpdate('composing', mek.key.remoteJid);

    // Try multiple translation services if one fails
    let translation = '';
    let detectedLang = 'unknown';
    const detectedSourceLang = detectLanguage(textToTranslate);
    
    // Try Google Translate API first (more reliable)
    try {
      const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${detectedSourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`;
      const googleResponse = await axios.get(googleUrl, { timeout: 8000 });
      
      if (googleResponse.data && googleResponse.data[0]) {
        translation = googleResponse.data[0].map(item => item[0]).join('');
        detectedLang = googleResponse.data[2] || detectedSourceLang;
      }
    } catch (googleError) {
      console.log("Google Translate failed, trying MyMemory");
      
      // Fallback to MyMemory with specific source language instead of auto
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=${detectedSourceLang}|${targetLang}`;
      const myMemoryResponse = await axios.get(myMemoryUrl, { timeout: 8000 });

      if (myMemoryResponse.data && myMemoryResponse.data.responseData && myMemoryResponse.data.responseData.translatedText) {
        translation = myMemoryResponse.data.responseData.translatedText;
        detectedLang = detectedSourceLang;
      } else {
        throw new Error("Both translation services failed");
      }
    }

    const langName = langNameMap[targetLang] || targetLang.toUpperCase();

    const translationMessage = 
      `> *🌍 TRACLE TRANSLATION*\n\n` +
      `🔤 *Original (${detectedLang.toUpperCase()})*: ${textToTranslate}\n` +
      `🔠 *Translated (${langName.toUpperCase()})*: ${translation}\n\n` +
      `> _Powered by TRACLE_`;

    await reply(translationMessage);

  } catch (error) {
    console.error("Translation error:", error);
    
    if (error.code === 'ECONNABORTED' || error.response?.status === 429) {
      reply("⚠️ Translation service is busy. Please try again in a moment.");
    } else {
      reply("❌ Failed to translate message. Please try again later.");
    }
  } finally {
    await conn.sendPresenceUpdate('paused', mek.key.remoteJid);
  }
});

// ================== LIST LANGUAGES COMMAND ==================
cmd({
  pattern: "langs",
  alias: ["languages"],
  desc: "List supported languages for translation",
  category: "tools",
  react: "📋",
  filename: __filename
}, async (conn, mek, m, { reply }) => {
  try {
    const supportedLangs = Object.keys(langMap)
      .filter(k => k.length > 2) // Only full language names
      .sort()
      .join(', ');
    
    await reply(`🌐 *Supported Languages*\n\n${supportedLangs}\n\nUsage:\n• Reply to a message with *.trtr* to translate to English\n• Reply to a message with *.trt <language>* to translate to specific language\nExample: .trt french`);
  } catch (error) {
    console.error("Languages command error:", error);
    reply("❌ Error retrieving language list.");
  }
});

//____________________________TTS___________________________
cmd({
    pattern: "tts",
    desc: "download songs",
    category: "download",
    react: "👧",
    filename: __filename
},
async(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
if(!q) return reply("Need some text.")
    const url = googleTTS.getAudioUrl(q, {
  lang: 'hi-IN',
  slow: false,
  host: 'https://translate.google.com',
})
await conn.sendMessage(from, { audio: { url: url }, mimetype: 'audio/mpeg', ptt: true }, { quoted: mek })
    }catch(a){
reply(`${a}`)
}
})
