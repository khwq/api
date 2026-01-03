const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const crypto = require('crypto');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

// Load slash commands
const createApiCommand = require('./createapi.js');
client.commands.set(createApiCommand.data.name, createApiCommand);

client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

// Slash command handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (err) {
        console.error(err);
        interaction.reply({ content: '❌ Command error', ephemeral: true });
    }
});

// Prefix command !getkeyfree
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith('!getkeyfree')) return;

    const db = JSON.parse(fs.readFileSync('./db.json', 'utf8'));

    const activeApi = db.apis.find(a => a.status === 'active');
    if (!activeApi) {
        return message.reply('❌ No active API.');
    }

    // mỗi user chỉ 1 free key
    if (db.freeKeys[message.author.id]) {
        return message.reply(`⚠️ You already got a free key:\n\`${db.freeKeys[message.author.id]}\``);
    }

    const key = `WAVE-${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const newKey = {
        key,
        api: activeApi.apiKey,
        status: 'active',
        durationInDays: 1,
        hwid: null,
        firstLoginAt: null,
        expiresAt: null,
        createdAt: new Date().toISOString()
    };

    db.keys.push(newKey);
    db.freeKeys[message.author.id] = key;

    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));

    message.reply(`✅ FREE KEY:\n\`\`\`${key}\`\`\``);
});

client.login(process.env.BOT_TOKEN);
