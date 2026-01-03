// createapi.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const crypto = require('crypto');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createapi')
        .setDescription('Create a new API code')
        .addStringOption(option =>
            option.setName('ten_app')
                .setDescription('Application name')
                .setRequired(true)
        ),

    async execute(interaction) {
        const appName = interaction.options.getString('ten_app');
        const db = JSON.parse(fs.readFileSync('./db.json', 'utf8'));

        // Disable all old APIs
        db.apis.forEach(api => api.status = 'disabled');

        const apiKey = crypto.randomBytes(12).toString('hex');

        const newApi = {
            appName,
            apiKey,
            ownerId: interaction.user.id,
            status: 'active',
            createdAt: new Date().toISOString()
        };

        db.apis.push(newApi);
        fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));

        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('API CREATED')
            .addFields(
                { name: 'App', value: appName },
                { name: 'API KEY', value: `\`\`\`${apiKey}\`\`\`` },
                { name: 'Status', value: 'ACTIVE' }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
