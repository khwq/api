const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listkey')
        .setDescription('Liệt kê tất cả các key thuộc một API.')
        .addStringOption(option => option.setName('api_key').setDescription('Mã API cần xem danh sách key').setRequired(true).setMinLength(24).setMaxLength(24)),
    async execute(interaction) {
        await interaction.deferReply();
        const apiKey = interaction.options.getString('api_key');

        try {
            const apiResult = await pool.query('SELECT * FROM apis WHERE api_key = $1', [apiKey]);
            if (apiResult.rows.length === 0) {
                return interaction.editReply({ content: 'Mã API không hợp lệ.', ephemeral: true });
            }
            const apiData = apiResult.rows[0];

            const keysResult = await pool.query('SELECT * FROM keys WHERE api = $1', [apiKey]);
            const keysForApi = keysResult.rows;

            if (keysForApi.length === 0) {
                return interaction.editReply({ content: `Không có key nào thuộc API của app **${apiData.app_name}**.`});
            }

            let description = '';
            keysForApi.forEach(k => {
                let statusIcon = '🟢'; // Active
                if (k.status === 'banned') statusIcon = '🚫';
                else if (k.expires_at && new Date(k.expires_at) < new Date()) statusIcon = '⌛';
                
                description += `${statusIcon} \`\`\`${k.key}\`\`\` - HWID: \`\`\`${k.hwid || 'Chưa có'}\`\`\`\n`;
            });
            
            if (description.length > 4000) {
                description = description.substring(0, 4000) + '\n... và một số key khác.';
            }

            const embed = new EmbedBuilder()
                .setColor(0x00BFFF)
                .setTitle(`Danh sách key của app: ${apiData.app_name}`)
                .setDescription(description)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            console.error(err);
            await interaction.editReply({ content: 'Lỗi kết nối Database!' });
        }
    },
};
