// data/antidel.js
const { DATABASE } = require('../lib/database');
const { DataTypes } = require('sequelize');

// DB Model
const AntiDelDB = DATABASE.define('AntiDelete', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: false,
        defaultValue: 1,
    },
    gc_status: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    dm_status: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    tableName: 'antidelete',
    timestamps: false,
    hooks: {
        beforeCreate: (record) => { record.id = 1; },
        beforeBulkCreate: (records) => {
            records.forEach(record => { record.id = 1; });
        },
    },
});

let isInitialized = false;

async function initializeAntiDeleteSettings() {
    if (isInitialized) return;
    try {
        await AntiDelDB.sync({ force: false });
        const existing = await AntiDelDB.findByPk(1);
        if (!existing) {
            await AntiDelDB.create({ id: 1, gc_status: false, dm_status: false });
        }
        isInitialized = true;
        console.log('✅ Anti-delete settings initialized.');
    } catch (err) {
        console.error('❌ Error initializing anti-delete settings:', err);
    }
}

async function setAnti(type, status) {
    await initializeAntiDeleteSettings();
    const record = await AntiDelDB.findByPk(1);

    if (!record) {
        await AntiDelDB.create({
            id: 1,
            gc_status: type === 'gc' ? status : false,
            dm_status: type === 'dm' ? status : false
        });
        return true;
    }

    if (type === 'gc') record.gc_status = status;
    if (type === 'dm') record.dm_status = status;

    await record.save();
    return true;
}

async function getAnti(type) {
    await initializeAntiDeleteSettings();
    const record = await AntiDelDB.findByPk(1);
    if (!record) return false;
    return type === 'gc' ? record.gc_status : record.dm_status;
}

async function getAllAntiDeleteSettings() {
    await initializeAntiDeleteSettings();
    const record = await AntiDelDB.findByPk(1);
    if (!record) return { gc_status: false, dm_status: false };
    return { gc_status: record.gc_status, dm_status: record.dm_status };
}

module.exports = {
    AntiDelDB,
    initializeAntiDeleteSettings,
    setAnti,
    getAnti,
    getAllAntiDeleteSettings
};
