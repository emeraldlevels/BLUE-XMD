// config.js

// Bot owner info
export const OWNER_NAME = "BrenaldMedia";
export const OWNER_NUMBER = "2348150221529";  

// Bot settings
export const PREFIX = ".";          // Command prefix
export const BOT_VERSION = "1.0";
export let MODE = "public";         // public or private (mutable)

// Auto-systems toggles
export let AUTO_TYPING = true;          // Auto typing
export let AUTO_RECORDING = true;       // Auto recording
export let AUTO_VIEW_STATUS = true;     // Auto view status
export let AUTO_LIKE_STATUS = true;     // Auto like status
export let AUTO_STATUS_REACT = true;    // Auto react to statuses
export let ANTI_LINK = false;           // Anti-link in groups

// Auto reaction emoji (default ❗ but owner can change)
export let AUTO_REACT_EMOJI = "❗";

// Dynamic toggle system (owner-only)
export const toggleAutoSystem = (systemName, value) => {
    switch (systemName.toLowerCase()) {
        case "autotyping": AUTO_TYPING = value; break;
        case "autorecording": AUTO_RECORDING = value; break;
        case "autoview": AUTO_VIEW_STATUS = value; break;
        case "autolikestatus": AUTO_LIKE_STATUS = value; break;
        case "autostatusreact": AUTO_STATUS_REACT = value; break;
        case "antilink": ANTI_LINK = value; break;
        default: console.log(`⚠️ Unknown auto system: ${systemName}`);
    }
};
