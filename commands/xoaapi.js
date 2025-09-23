const { SlashCommandBuilder: SlashCommandBuilderXoaApi, EmbedBuilder: EmbedBuilderXoaApi } = require('discord.js');
const fsXoaApi = require('fs');

module.exports = {
    data: new SlashCommandBuilderXoaApi()
        .setName('xoaapi')
        .setDescription('Xóa một API và tất cả các key liên quan (Cẩn thận!).')
        .addStringOption(option => option.setName('ten_app').setDescription('Tên app của API cần xóa').setRequired(true)),
    async execute(interaction) {
        const appName = interaction.options.getString('ten_app');
        const db = JSON.parse(fsXoaApi.readFileSync('./db.json', 'utf-8'));

        const apiIndex = db.apis.findIndex(api => api.appName.toLowerCase() === appName.toLowerCase());

        if (apiIndex === -1) {
            return interaction.reply({ content: `Không tìm thấy API với tên "${appName}".`, ephemeral: true });
        }
        
        const apiKeyToDelete = db.apis[apiIndex].apiKey;
        
        // Lọc và xóa API
        db.apis.splice(apiIndex, 1);
        // Lọc và xóa tất cả các key liên quan đến API đó
        db.keys = db.keys.filter(key => key.api !== apiKeyToDelete);
        
        fsXoaApi.writeFileSync('./db.json', JSON.stringify(db, null, 2));

        const embed = new EmbedBuilderXoaApi()
            .setColor(0xFF0000)
            .setTitle('Xóa API Thành Công')
            .setDescription(`Đã xóa vĩnh viễn API của ứng dụng **${appName}** và tất cả các key liên quan.`)
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
};