const fs = require("fs");
const path = require("path");
const { Client, Collection, GatewayIntentBits, EmbedBuilder } = require("discord.js");
require("dotenv").config();

console.log("🚀 Starting Discord Bot...");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();
const PREFIX = "!";

// ================= LOAD SLASH COMMANDS (ADMIN) =================
const commandsPath = path.join(__dirname, "commands");
if (fs.existsSync(commandsPath)) {
    const files = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));
    for (const file of files) {
        const cmd = require(path.join(commandsPath, file));
        if (cmd.data && cmd.execute) {
            client.commands.set(cmd.data.name, cmd);
        }
    }
}

// ================= DB HELPER =================
function loadDB() {
    return JSON.parse(fs.readFileSync("./db.json", "utf8"));
}

function saveDB(db) {
    fs.writeFileSync("./db.json", JSON.stringify(db, null, 2));
}

// ================= PERMISSION (ADMIN) =================
function hasPermission(interaction) {
    const db = loadDB();
    return (
        interaction.guild.ownerId === interaction.user.id ||
        db.supportUsers.includes(interaction.user.id)
    );
}

// ================= READY =================
client.once("ready", () => {
    console.log(`🤖 Logged in as ${client.user.tag}`);
});

// ================= SLASH COMMAND HANDLER =================
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    if (!hasPermission(interaction)) {
        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle("⛔ Access Denied")
                    .setDescription("You do not have permission.")
            ],
            ephemeral: true
        });
    }

    try {
        await command.execute(interaction);
    } catch (err) {
        console.error("Slash error:", err);
    }
});

// ================= UTILS =================
function generateKey() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const part = () =>
        [...Array(4)].map(() => chars[Math.floor(Math.random() * chars.length)]).join("");
    return `WAVE-${part()}-${part()}-${part()}-${part()}`;
}

function formatTime(ms) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
}

// ================= PREFIX COMMAND: !getkeyfree =================
client.on("messageCreate", async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const cmd = message.content.slice(1).trim().toLowerCase();
    if (cmd !== "getkeyfree") return;

    let db;
    try {
        db = loadDB();
    } catch (err) {
        console.error("DB ERROR:", err.message);
        return message.reply("❌ Database error. Contact admin.");
    }

    const userId = message.author.id;
    const now = Date.now();

    const COOLDOWN = 24 * 60 * 60 * 1000;
    const KEY_EXPIRE_HOURS = 3;

    if (!db.freeKeys) db.freeKeys = {};

    // ❌ COOLDOWN
    if (db.freeKeys[userId] && now - db.freeKeys[userId] < COOLDOWN) {
        const remain = COOLDOWN - (now - db.freeKeys[userId]);
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setDescription(
                        `<a:warnflash:1358124216121295129> **YOU HAVE USED UP YOUR GET KEY TODAY. PLEASE COME BACK IN ${formatTime(remain)}**\n` +
                        `<:shop:1380983095402037371> **BUY KEY IN** <#1328753498799607819>`
                    )
            ]
        });
    }

    // ================= GET ACTIVE API (NEWEST) =================
    const activeApis = db.apis
        .filter(a => a.status === "active")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (activeApis.length === 0) {
        return message.reply("❌ No active API available. Please contact admin.");
    }

    const apiKey = activeApis[0].apiKey;

    // ================= CREATE FREE KEY =================
    const key = generateKey();
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(now + KEY_EXPIRE_HOURS * 60 * 60 * 1000).toISOString();

    db.keys.push({
        key,
        api: apiKey,              // ✅ FIX: GẮN API ACTIVE
        status: "active",
        durationInDays: 0,
        hwid: null,
        firstLoginAt: null,
        expiresAt,
        createdAt,
        type: "FREE"
    });

    db.freeKeys[userId] = now;
    saveDB(db);

    // ================= PUBLIC EMBED =================
    await message.reply({
        embeds: [
            new EmbedBuilder()
                .setColor(0x00FF00)
                .setDescription(
                    `**CHECK MY DM** (${message.author})\n\n` +
                    `<a:arrow_reddotright:1329462769988403200> **Expiration Time** : 3 Hours\n` +
                    `<a:celebration1:1358124233166688257> **FEEDBACK TO GET KEY 2DAYS**\n` +
                    `>> <#1328698781759311924> <<`
                )
        ]
    });

    // ================= DM EMBED =================
    try {
        await message.author.send({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x00FF99)
                    .setDescription(
                        `<a:celebration1:1358124233166688257> **YOUR KEY** <a:celebration1:1358124233166688257>\n` +
                        `<a:leftleft:1371518536807092244> || ${key} ||\n` +
                        `⏳ **Expires:** 3 Hours`
                    )
            ]
        });
    } catch {
        console.log("❌ User closed DM");
    }
});

// ================= LOGIN =================
client.login(process.env.DISCORD_TOKEN)
    .then(() => console.log("🔑 Bot connected"))
    .catch(err => console.error("❌ Login error:", err));

require("./deploy-commands.js");
require("./server.js");
