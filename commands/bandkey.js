const { SlashCommandBuilder: SlashCommandBuilderBandKey, EmbedBuilder: EmbedBuilderBandKey } = require('discord.js');
const fsBandKey = require('fs');

module.exports = {
    data: new SlashCommandBuilderBandKey()
        .setName('bandkey')
        .setDescription('Khóa (band) một key.')
        .addStringOption(option => option.setName('key').setDescription('Key cần khóa').setRequired(true))
        .addStringOption(option => option.setName('ly_do').setDescription('Lý do khóa key').setRequired(true))
        .addIntegerOption(option => option.setName('thoi_han_band').setDescription('Khóa trong bao nhiêu ngày? (Bỏ trống để khóa vĩnh viễn)').setRequired(false)),
    async execute(interaction) {
        const keyToBand = interaction.options.getString('key');
        const reason = interaction.options.getString('ly_do');
        const banDays = interaction.options.getInteger('thoi_han_band');

        const db = JSON.parse(fsBandKey.readFileSync('./db.json', 'utf-8'));
        const keyData = db.keys.find(k => k.key === keyToBand);

        if (!keyData) {
            return interaction.reply({ content: 'Không tìm thấy key này.', ephemeral: true });
        }

        let unbanDate, unbanDisplay;
        if (banDays && banDays > 0) {
            const date = new Date();
            date.setDate(date.getDate() + banDays);
            unbanDate = date.toISOString();
            unbanDisplay = `<t:${Math.floor(date.getTime() / 1000)}:F>`;
        } else {
            unbanDate = 'Vĩnh viễn';
            unbanDisplay = 'Vĩnh viễn';
        }

        keyData.status = 'banned';
        keyData.banInfo = {
            reason: reason,
            bannedBy: interaction.user.id,
            bannedAt: new Date().toISOString(),
            unbanDate: unbanDate
        };
        fsBandKey.writeFileSync('./db.json', JSON.stringify(db, null, 2));

        const embed = new EmbedBuilderBandKey()
            .setColor(0xFF0000)
            .setTitle('Khóa Key Thành Công')
            .setDescription(`Đã khóa key \`${keyToBand}\``)
            .addFields(
                { name: 'Lý do', value: reason },
                { name: 'Mở khóa vào', value: unbanDisplay }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};