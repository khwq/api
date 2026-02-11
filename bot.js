// bot.js
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();

console.log("🚀 Đang khởi động bot Discord...");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// Load lệnh slash từ thư mục /commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[⚠️] Thiếu thuộc tính "data" hoặc "execute" trong: ${file}`);
    }
}

// Kiểm tra quyền người dùng
function hasPermission(interaction) {
    const db = JSON.parse(fs.readFileSync('./db.json', 'utf-8'));
    const isOwner = interaction.guild.ownerId === interaction.user.id;
    const isSupport = db.supportUsers.includes(interaction.user.id);
    return isOwner || isSupport;
}

// Khi bot khởi động xong
client.once('ready', () => {
    console.log(`🤖 Bot đã đăng nhập: ${client.user.tag}`);
    console.log(`✅ Slash commands đã sẵn sàng.`);
});

// Khi có slash command
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    if (!hasPermission(interaction)) {
        const noPermsEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('⛔ Truy cập bị từ chối')
            .setDescription('Bạn không có quyền dùng lệnh này.')
            .setTimestamp();

        await interaction.reply({ embeds: [noPermsEmbed], ephemeral: true });
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error("❌ Lỗi khi xử lý lệnh:", error);
        const errorEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('⚠️ Đã có lỗi xảy ra!')
            .setDescription('Bot gặp lỗi khi thực thi lệnh này.');

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
});

// Bắt đầu đăng nhập bot
client.login(process.env.DISCORD_TOKEN)
    .then(() => console.log("🔑 Token hợp lệ, đang kết nối tới Discord Gateway..."))
    .catch(err => console.error("❌ Token không hợp lệ hoặc lỗi đăng nhập:", err));
//require('./deploy-commands.js');
require('./server.js');



