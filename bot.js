const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();

console.log("🚀 Đang khởi động bot Discord...");
console.log("TOKEN:", process.env.DISCORD_TOKEN ? "OK" : "MISSING");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// Load slash commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
    }
}

// Permission check
function hasPermission(interaction) {
    const db = JSON.parse(fs.readFileSync('./db.json', 'utf8'));
    return interaction.guild.ownerId === interaction.user.id
        || db.supportUsers.includes(interaction.user.id);
}

client.once('ready', () => {
    console.log(`🤖 Bot đã đăng nhập: ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    if (!hasPermission(interaction)) {
        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('⛔ Không có quyền')
            ],
            ephemeral: true
        });
    }

    await command.execute(interaction);
});

client.login(process.env.DISCORD_TOKEN)
    .then(() => console.log("🔑 Đã kết nối Discord Gateway"))
    .catch(console.error);
