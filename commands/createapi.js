const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const crypto = require('crypto');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createapi')
        .setDescription('Create a new API code for your application.')
        .addStringOption(option =>
            option.setName('ten_app')
                .setDescription('Application name to create API')
                .setRequired(true)),
    async execute(interaction) {
        const appName = interaction.options.getString('ten_app');
        
        try {
            // Kiểm tra xem tên app đã tồn tại chưa
            const checkResult = await pool.query('SELECT * FROM apis WHERE LOWER(app_name) = LOWER($1)', [appName]);
            if (checkResult.rows.length > 0) {
                return interaction.reply({ content: `Application name "${appName}" existed.`, ephemeral: true });
            }

            const newApiKey = crypto.randomBytes(12).toString('hex');
            
            // Lưu vào Supabase
            await pool.query(
                'INSERT INTO apis (app_name, api_key, owner_id, status) VALUES ($1, $2, $3, $4)',
                [appName, newApiKey, interaction.user.id, 'active']
            );

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('Create Successful API')
                .setDescription(`Successfully created API for the application **${appName}**`)
                .addFields(
                    { name: 'Your API Key (Save it carefully)', value: `\`\`\`${newApiKey}\`\`\`` },
                    { name: 'Status', value: 'Work' }
                )
                .setFooter({ text: `Requested by ${interaction.user.tag}`})
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        } catch (err) {
            console.error(err);
            await interaction.reply({ content: 'Lỗi kết nối Database!', ephemeral: true });
        }
    },
};
