const { SlashCommandBuilder: SlashCommandBuilderXoaNgay, EmbedBuilder: EmbedBuilderXoaNgay } = require('discord.js');
const fsXoaNgay = require('fs');

module.exports = {
    data: new SlashCommandBuilderXoaNgay()
        .setName('xoangaykey')
        .setDescription('Trừ bớt ngày sử dụng của một key.')
        .addStringOption(option => option.setName('key').setDescription('Key cần trừ ngày').setRequired(true))
        .addIntegerOption(option => option.setName('so_ngay').setDescription('Số ngày muốn trừ đi').setRequired(true).setMinValue(1))
        .addStringOption(option => option.setName('api_key').setDescription('Mã API của key để xác thực').setRequired(true).setMinLength(24).setMaxLength(24)),
    async execute(interaction) {
        const keyToUpdate = interaction.options.getString('key');
        const daysToRemove = interaction.options.getInteger('so_ngay');
        const apiKey = interaction.options.getString('api_key');

        const db = JSON.parse(fsXoaNgay.readFileSync('./db.json', 'utf-8'));
        const keyData = db.keys.find(k => k.key === keyToUpdate && k.api === apiKey);

        if (!keyData) {
            return interaction.reply({ content: 'Không tìm thấy key hoặc mã API không đúng.', ephemeral: true });
        }

        let newExpireDisplay;
        // Nếu key đã được kích hoạt
        if (keyData.expiresAt) {
            const currentExpireDate = new Date(keyData.expiresAt);
            currentExpireDate.setDate(currentExpireDate.getDate() - daysToRemove);
            keyData.expiresAt = currentExpireDate.toISOString();
            newExpireDisplay = `<t:${Math.floor(currentExpireDate.getTime() / 1000)}:F>`;
        } 
        else {
            keyData.durationInDays -= daysToRemove;
            if (keyData.durationInDays < 1) keyData.durationInDays = 1; 
            newExpireDisplay = `${keyData.durationInDays} ngày (kể từ khi kích hoạt)`;
        }

        fsXoaNgay.writeFileSync('./db.json', JSON.stringify(db, null, 2));

        const embed = new EmbedBuilderXoaNgay()
            .setColor(0xFFA500)
            .setTitle('Trừ Ngày Thành Công')
            .setDescription(`Đã xóa đi **${daysToRemove}** ngày của key \`\`\`${keyToUpdate}\`\`\`.`)
            .addFields({ name: 'Hạn sử dụng mới', value: newExpireDisplay })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
};