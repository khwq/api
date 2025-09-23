const { SlashCommandBuilder: SlashCommandBuilderListKey, EmbedBuilder: EmbedBuilderListKey } = require('discord.js');
const fsListKey = require('fs');

module.exports = {
    data: new SlashCommandBuilderListKey()
        .setName('listkey')
        .setDescription('Liệt kê tất cả các key thuộc một API.')
        .addStringOption(option => option.setName('api_key').setDescription('Mã API cần xem danh sách key').setRequired(true).setMinLength(24).setMaxLength(24)),
    async execute(interaction) {
        await interaction.deferReply();
        const apiKey = interaction.options.getString('api_key');
        const db = JSON.parse(fsListKey.readFileSync('./db.json', 'utf-8'));

        const apiData = db.apis.find(a => a.apiKey === apiKey);
        if (!apiData) {
            return interaction.editReply({ content: 'Mã API không hợp lệ.', ephemeral: true });
        }
        
        const keysForApi = db.keys.filter(k => k.api === apiKey);
        if (keysForApi.length === 0) {
            return interaction.editReply({ content: `Không có key nào thuộc API của app **${apiData.appName}**.`});
        }

        let description = '';
        keysForApi.forEach(k => {
            let statusIcon = '🟢'; // Active
            if (k.status === 'banned') statusIcon = '🚫';
            else if (k.expiresAt && new Date(k.expiresAt) < new Date()) statusIcon = '⌛';
            
            description += `${statusIcon} \`\`\`${k.key}\`\`\` - HWID: \`\`\`${k.hwid || 'Chưa có'}\`\`\`\n`;
        });
        
        if (description.length > 4000) {
            description = description.substring(0, 4000) + '\n... và một số key khác.';
        }

        const embed = new EmbedBuilderListKey()
            .setColor(0x00BFFF)
            .setTitle(`Danh sách key của app: ${apiData.appName}`)
            .setDescription(description)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};