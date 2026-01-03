const { SlashCommandBuilder: SlashCommandBuilderTaoApi, EmbedBuilder: EmbedBuilderTaoApi } = require('discord.js');
const fsTaoApi = require('fs');
const cryptoTaoApi = require('crypto');

module.exports = {
    data: new SlashCommandBuilderTaoApi()
        .setName('createapi')
        .setDescription('Create a new API code for your application.')
        .addStringOption(option =>
            option.setName('ten_app')
                .setDescription('Application name to create API')
                .setRequired(true)),
    async execute(interaction) {
        const appName = interaction.options.getString('ten_app');
        const db = JSON.parse(fsTaoApi.readFileSync('./db.json', 'utf-8'));
        
        if (db.apis.some(api => api.appName.toLowerCase() === appName.toLowerCase())) {
            return interaction.reply({ content: `Application name "${appName}" existed.`, ephemeral: true });
        }

        const newApiKey = cryptoTaoApi.randomBytes(12).toString('hex');
        const newApi = {
            appName: appName,
            apiKey: newApiKey,
            ownerId: interaction.user.id,
            status: 'active',
            createdAt: new Date().toISOString()
        };
        db.apis.push(newApi);
        fsTaoApi.writeFileSync('./db.json', JSON.stringify(db, null, 2));

        const embed = new EmbedBuilderTaoApi()
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
    },
};
