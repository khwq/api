const { SlashCommandBuilder: SlashCommandBuilderAddSupport, EmbedBuilder: EmbedBuilderAddSupport } = require('discord.js');
const fsAddSupport = require('fs');

module.exports = {
    data: new SlashCommandBuilderAddSupport()
        .setName('addrolesupport')
        .setDescription('Thêm một người dùng vào danh sách hỗ trợ (có thể dùng lệnh).')
        .addUserOption(option => option.setName('user').setDescription('Người dùng cần thêm').setRequired(true)),
    async execute(interaction) {
        if (interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: 'Chỉ chủ server mới có thể dùng lệnh này.', ephemeral: true });
        }
        const user = interaction.options.getUser('user');
        const db = JSON.parse(fsAddSupport.readFileSync('./db.json', 'utf-8'));
        if (db.supportUsers.includes(user.id)) {
            return interaction.reply({ content: `Người dùng ${user.tag} đã có trong danh sách hỗ trợ.`, ephemeral: true });
        }
        db.supportUsers.push(user.id);
        fsAddSupport.writeFileSync('./db.json', JSON.stringify(db, null, 2));
        const embed = new EmbedBuilderAddSupport()
            .setColor(0x00FF00)
            .setTitle('Thêm Support Thành Công')
            .setDescription(`Đã thêm **${user.tag}** vào danh sách người có thể sử dụng các lệnh của bot.`);
        await interaction.reply({ embeds: [embed] });
    }
};