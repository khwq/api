const { SlashCommandBuilder: SlashCommandBuilderUnbandKey, EmbedBuilder: EmbedBuilderUnbandKey } = require('discord.js');
const fsUnbandKey = require('fs');

module.exports = {
    data: new SlashCommandBuilderUnbandKey()
        .setName('unbandkey')
        .setDescription('Mở khóa một key đã bị band.')
        .addStringOption(option => option.setName('key').setDescription('Key cần mở khóa').setRequired(true))
        .addStringOption(option => option.setName('ly_do').setDescription('Lý do mở khóa').setRequired(true)),
    async execute(interaction) {
        const keyToUnban = interaction.options.getString('key');
        const reason = interaction.options.getString('ly_do');
        const db = JSON.parse(fsUnbandKey.readFileSync('./db.json', 'utf-8'));
        const keyData = db.keys.find(k => k.key === keyToUnban);

        if (!keyData) {
            return interaction.reply({ content: 'Không tìm thấy key này.', ephemeral: true });
        }
        if (keyData.status !== 'banned') {
            return interaction.reply({ content: 'Key này không bị khóa.', ephemeral: true });
        }

        keyData.status = 'active';
        keyData.banInfo = undefined; // Xóa thông tin band
        fsUnbandKey.writeFileSync('./db.json', JSON.stringify(db, null, 2));

        const embed = new EmbedBuilderUnbandKey()
            .setColor(0x00FF00)
            .setTitle('Mở Khóa Key Thành Công')
            .setDescription(`Đã mở khóa cho key \`${keyToUnban}\`.`)
            .addFields({ name: 'Lý do mở khóa', value: reason })
            .setTimestamp();
            
        await interaction.reply({ embeds: [embed] });
    },
};