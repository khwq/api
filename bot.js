const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();

console.log("🚀 Đang khởi động bot Discord...");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();
const PREFIX = "!";

// ================= LOAD SLASH COMMAND (ADMIN) =================
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        if (command.data && command.execute) {
            client.commands.set(command.data.name, command);
        }
    }
}

// ================= PERMISSION CHECK (ADMIN) =================
function hasPermission(interaction) {
    const db = JSON.parse(fs.readFileSync('./db.json', 'utf8'));
    const isOwner = interaction.guild.ownerId === interaction.user.id;
    const isSupport = db.supportUsers.includes(interaction.user.id);
    return isOwner || isSupport;
}

// ================= READY =================
client.once('ready', () => {
    console.log(`🤖 Bot đã đăng nhập: ${client.user.tag}`);
});

// ================= SLASH COMMAND HANDLER =================
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    if (!hasPermission(interaction)) {
        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('⛔ Access Denied')
                    .setDescription('You do not have permission.')
            ],
            ephemeral: true
        });
    }

    try {
        await command.execute(interaction);
    } catch (err) {
        console.error(err);
    }
});

// ================= UTILS =================
function generateKey() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const part = () => [...Array(4)].map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
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

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();
    if (cmd !== "getkey") return;

    const db = JSON.parse(fs.readFileSync('./db.json', 'utf8'));
    const userId = message.author.id;

    const COOLDOWN = 24 * 60 * 60 * 1000;
    const KEY_EXPIRE_HOURS = 3;
    const now = Date.now();

    if (!db.freeKeys) db.freeKeys = {};

    // ❌ USED TODAY
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

    // ✅ CREATE KEY
    const key = generateKey();
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(now + KEY_EXPIRE_HOURS * 60 * 60 * 1000).toISOString();

    db.keys.push({
        key,
        api: null,
        status: "active",
        durationInDays: 0,
        hwid: null,
        firstLoginAt: null,
        expiresAt,
        createdAt,
        type: "FREE"
    });

    db.freeKeys[userId] = now;
    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));

    // 📢 PUBLIC EMBED
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

    // 📩 DM EMBED
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
        console.log("❌ User tắt DM");
    }
});

// ================= LOGIN =================
client.login(process.env.DISCORD_TOKEN)
    .then(() => console.log("🔑 Token OK – Bot running"))
    .catch(err => console.error("❌ Login error:", err));

require('./deploy-commands.js');
require('./server.js');
