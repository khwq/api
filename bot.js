// ==========================================
//  KUTOM.DLL | Discord Bot KeyAuth
//  Tác giả: Jack 5 Củ
// ==========================================

const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const fetch = require('node-fetch');
const { Client, Collection, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();

// ------------------ Discord Client ------------------
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

// Load lệnh từ thư mục ./commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.existsSync(commandsPath)
    ? fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))
    : [];

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[CẢNH BÁO] Lệnh tại ${filePath} thiếu thuộc tính "data" hoặc "execute".`);
    }
}

// ------------------ Check quyền ------------------
function hasPermission(interaction) {
    const db = JSON.parse(fs.readFileSync('./db.json', 'utf-8'));
    const isOwner = interaction.guild?.ownerId === interaction.user.id;
    const isSupport = db.supportUsers.includes(interaction.user.id);
    return isOwner || isSupport;
}

// ------------------ Event: Ready ------------------
client.once('ready', () => {
    console.log(`✅ Bot đã sẵn sàng! Đăng nhập với tên ${client.user.tag}`);
});

// ------------------ Event: Command ------------------
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    if (!hasPermission(interaction)) {
        const noPermsEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🚫 Truy Cập Bị Từ Chối')
            .setDescription('Bạn không có quyền để sử dụng lệnh này.')
            .setTimestamp();

        await interaction.reply({ embeds: [noPermsEmbed], ephemeral: true });
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        const errorEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('❗ Đã có lỗi xảy ra!')
            .setDescription('Đã xảy ra lỗi khi thực thi lệnh này. Vui lòng thử lại sau.');

        if (interaction.replied || interaction.deferred)
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        else
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
});

// ------------------ Login Discord ------------------
client.login(process.env.DISCORD_TOKEN);

// ===================================================
//  Fake Web Server để Render không kill process
// ===================================================
const app = express();

app.get('/', (req, res) => {
    res.send('✅ Bot Discord đang chạy trên Render!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 Fake server đang chạy tại cổng ${PORT}`);
});

// ===================================================
//  Keep-alive: Render Free tự sleep nếu không có traffic
// ===================================================

// Gửi request mỗi 10 phút để giữ service sống
setInterval(() => {
    fetch(`https://${process.env.RENDER_EXTERNAL_URL || 'tênservice.onrender.com'}`)
        .then(() => console.log('🔄 Gửi ping giữ kết nối sống.'))
        .catch(() => console.log('⚠️ Ping thất bại (Render có thể sleep).'));
}, 10 * 60 * 1000); // 10 phút
