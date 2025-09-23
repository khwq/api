const { SlashCommandBuilder: SlashCommandBuilderStartApi, EmbedBuilder: EmbedBuilderStartApi } = require('discord.js');
const fsStartApi = require('fs');

module.exports = {
    data: new SlashCommandBuilderStartApi()
        .setName('startapi')
        .setDescription('Kích hoạt lại một API đã bị tạm dừng.')
        .addStringOption(option => option.setName('ten_app').setDescription('Tên app của API cần kích hoạt').setRequired(true)),
    async execute(interaction) {
        const appName = interaction.options.getString('ten_app');
        const db = JSON.parse(fsStartApi.readFileSync('./db.json', 'utf-8'));

        const api = db.apis.find(a => a.appName.toLowerCase() === appName.toLowerCase());

        if (!api) {
            return interaction.reply({ content: `Không tìm thấy API với tên "${appName}".`, ephemeral: true });
        }

        if (api.status === 'active') {
            return interaction.reply({ content: `API "${appName}" đã ở trạng thái hoạt động.`, ephemeral: true });
        }

        api.status = 'active';
        fsStartApi.writeFileSync('./db.json', JSON.stringify(db, null, 2));

        const embed = new EmbedBuilderStartApi()
            .setColor(0x00FF00)
            .setTitle('Kích Hoạt API Thành Công')
            .setDescription(`API của ứng dụng **${appName}** đã được kích hoạt trở lại.`)
            .setTimestamp();
            
        await interaction.reply({ embeds: [embed] });
    },
};