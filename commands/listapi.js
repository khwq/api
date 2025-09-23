const { SlashCommandBuilder: SlashCommandBuilderListApi, EmbedBuilder: EmbedBuilderListApi } = require('discord.js');
const fsListApi = require('fs');

module.exports = {
    data: new SlashCommandBuilderListApi()
        .setName('listapi')
        .setDescription('Liệt kê tất cả các API bạn đã tạo.'),
    async execute(interaction) {
        const db = JSON.parse(fsListApi.readFileSync('./db.json', 'utf-8'));
        const userApis = db.apis.filter(api => api.ownerId === interaction.user.id);
        
        if (userApis.length === 0) {
            return interaction.reply({ content: 'Bạn chưa tạo API nào.', ephemeral: true });
        }

        let description = '';
        userApis.forEach(api => {
            const statusIcon = api.status === 'active' ? '🟢' : '⏸️';
            description += `${statusIcon} **${api.appName}**: \`\`\`${api.apiKey}\`\`\`\n`;
        });

        const embed = new EmbedBuilderListApi()
            .setColor(0x7289DA)
            .setTitle(`Danh sách API của ${interaction.user.username}`)
            .setDescription(description)
            .setTimestamp();
            
        await interaction.reply({ embeds: [embed] });
    },
};