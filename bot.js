// bot.js
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[CẢNH BÁO] Lệnh tại ${filePath} thiếu thuộc tính "data" hoặc "execute".`);
    }
}

function hasPermission(interaction) {
    const db = JSON.parse(fs.readFileSync('./db.json', 'utf-8'));
    const isOwner = interaction.guild.ownerId === interaction.user.id;
    const isSupport = db.supportUsers.includes(interaction.user.id);
    return isOwner || isSupport;
}


client.once('ready', () => {
    console.log(`Bot đã sẵn sàng! Đã đăng nhập với tên ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    if (!hasPermission(interaction)) {
        const noPermsEmbed = new EmbedBuilder()
            .setColor(0xFF0000) 
            .setTitle('Truy Cập Bị Từ Chối')
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
            .setTitle('Đã có lỗi xảy ra!')
            .setDescription('Đã xảy ra lỗi khi thực thi lệnh này. Vui lòng thử lại sau.');
            
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
