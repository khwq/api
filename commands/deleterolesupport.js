const { SlashCommandBuilder: SlashCommandBuilderDeleteSupport, EmbedBuilder: EmbedBuilderDeleteSupport } = require('discord.js');
const fsDeleteSupport = require('fs');

module.exports = {
    data: new SlashCommandBuilderDeleteSupport()
        .setName('deleterolesupport')
        .setDescription('Xóa một người dùng khỏi danh sách hỗ trợ.')
        .addUserOption(option => option.setName('user').setDescription('Người dùng cần xóa').setRequired(true)),
    async execute(interaction) {
        if (interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: 'Chỉ chủ server mới có thể dùng lệnh này.', ephemeral: true });
        }
        const user = interaction.options.getUser('user');
        const db = JSON.parse(fsDeleteSupport.readFileSync('./db.json', 'utf-8'));
        
        const userIndex = db.supportUsers.indexOf(user.id);
        if (userIndex === -1) {
            return interaction.reply({ content: `Người dùng ${user.tag} không có trong danh sách hỗ trợ.`, ephemeral: true });
        }
        
        db.supportUsers.splice(userIndex, 1);
        fsDeleteSupport.writeFileSync('./db.json', JSON.stringify(db, null, 2));

        const embed = new EmbedBuilderDeleteSupport()
            .setColor(0xFF0000)
            .setTitle('Xóa Support Thành Công')
            .setDescription(`Đã xóa **${user.tag}** khỏi danh sách người có thể sử dụng các lệnh của bot.`);
        await interaction.reply({ embeds: [embed] });
    }
};