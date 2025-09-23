const { SlashCommandBuilder: SlashCommandBuilderXoaKey, EmbedBuilder: EmbedBuilderXoaKey } = require('discord.js');
const fsXoaKey = require('fs');

module.exports = {
    data: new SlashCommandBuilderXoaKey()
        .setName('xoakey')
        .setDescription('Xóa một key cụ thể.')
        .addStringOption(option => option.setName('key').setDescription('Key cần xóa').setRequired(true))
        .addStringOption(option => option.setName('api_key').setDescription('Mã API của key để xác thực').setRequired(true).setMinLength(24).setMaxLength(24)),
    async execute(interaction) {
        const keyToDelete = interaction.options.getString('key');
        const apiKey = interaction.options.getString('api_key');
        const db = JSON.parse(fsXoaKey.readFileSync('./db.json', 'utf-8'));
        
        const keyIndex = db.keys.findIndex(k => k.key === keyToDelete && k.api === apiKey);

        if (keyIndex === -1) {
            return interaction.reply({ content: 'Không tìm thấy key hoặc mã API không đúng.', ephemeral: true });
        }

        db.keys.splice(keyIndex, 1);
        fsXoaKey.writeFileSync('./db.json', JSON.stringify(db, null, 2));

        const embed = new EmbedBuilderXoaKey()
            .setColor(0xFF0000)
            .setTitle('Xóa Key Thành Công')
            .setDescription(`Đã xóa thành công key \`${keyToDelete}\`.`)
            .setTimestamp();
            
        await interaction.reply({ embeds: [embed] });
    },
};
