const { SlashCommandBuilder: SlashCommandBuilderStopApi, EmbedBuilder: EmbedBuilderStopApi } = require('discord.js');
const fsStopApi = require('fs');

module.exports = {
    data: new SlashCommandBuilderStopApi()
        .setName('stopapi')
        .setDescription('Tạm dừng một API, tất cả các key sẽ không thể xác thực.')
        .addStringOption(option => option.setName('ten_app').setDescription('Tên app của API cần tạm dừng').setRequired(true)),
    async execute(interaction) {
        const appName = interaction.options.getString('ten_app');
        const db = JSON.parse(fsStopApi.readFileSync('./db.json', 'utf-8'));

        const api = db.apis.find(a => a.appName.toLowerCase() === appName.toLowerCase());

        if (!api) {
            return interaction.reply({ content: `Không tìm thấy API với tên "${appName}".`, ephemeral: true });
        }

        if (api.status === 'stopped') {
            return interaction.reply({ content: `API "${appName}" đã ở trạng thái tạm dừng.`, ephemeral: true });
        }

        api.status = 'stopped';
        fsStopApi.writeFileSync('./db.json', JSON.stringify(db, null, 2));

        const embed = new EmbedBuilderStopApi()
            .setColor(0xFFA500)
            .setTitle('Tạm Dừng API Thành Công')
            .setDescription(`API của ứng dụng **${appName}** đã được tạm dừng. Mọi key thuộc API này sẽ không thể xác thực.`)
            .setTimestamp();
            
        await interaction.reply({ embeds: [embed] });
    },
};