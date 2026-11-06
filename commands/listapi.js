const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listapi')
        .setDescription('Liệt kê tất cả các API bạn đã tạo.'),
    async execute(interaction) {
        try {
            const result = await pool.query('SELECT * FROM apis WHERE owner_id = $1', [interaction.user.id]);
            const userApis = result.rows;
            
            if (userApis.length === 0) {
                return interaction.reply({ content: 'Bạn chưa tạo API nào.', ephemeral: true });
            }

            let description = '';
            userApis.forEach(api => {
                const statusIcon = api.status === 'active' ? '🟢' : '⏸️';
                description += `${statusIcon} **${api.app_name}**: \`\`\`${api.api_key}\`\`\`\n`;
            });

            const embed = new EmbedBuilder()
                .setColor(0x7289DA)
                .setTitle(`Danh sách API của ${interaction.user.username}`)
                .setDescription(description)
                .setTimestamp();
                
            await interaction.reply({ embeds: [embed] });
        } catch (err) {
            console.error(err);
            await interaction.reply({ content: 'Lỗi kết nối Database!', ephemeral: true });
        }
    },
};
