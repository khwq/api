const { SlashCommandBuilder: SlashCommandBuilderThemNgay, EmbedBuilder: EmbedBuilderThemNgay } = require('discord.js');
const fsThemNgay = require('fs');

module.exports = {
    data: new SlashCommandBuilderThemNgay()
        .setName('adddaykey')
        .setDescription('Add days of use to a key..')
        .addStringOption(option => option.setName('key').setDescription('Key needs more days').setRequired(true))
        .addIntegerOption(option => option.setName('so_ngay').setDescription('Number of days to add').setRequired(true).setMinValue(1))
        .addStringOption(option => option.setName('api_key').setDescription('API key for authentication').setRequired(true).setMinLength(24).setMaxLength(24)),
    async execute(interaction) {
        const keyToUpdate = interaction.options.getString('key');
        const daysToAdd = interaction.options.getInteger('so_ngay');
        const apiKey = interaction.options.getString('api_key');

        const db = JSON.parse(fsThemNgay.readFileSync('./db.json', 'utf-8'));
        const keyData = db.keys.find(k => k.key === keyToUpdate && k.api === apiKey);

        if (!keyData) {
            return interaction.reply({ content: 'Key not found or incorrect API key.', ephemeral: true });
        }

        let newExpireDisplay;
        if (keyData.expiresAt) {
            const currentExpireDate = new Date(keyData.expiresAt);
            currentExpireDate.setDate(currentExpireDate.getDate() + daysToAdd);
            keyData.expiresAt = currentExpireDate.toISOString();
            newExpireDisplay = `<t:${Math.floor(currentExpireDate.getTime() / 1000)}:F>`;
        } 
        else {
            keyData.durationInDays += daysToAdd;
            newExpireDisplay = `${keyData.durationInDays} days (since login)`;
        }

        fsThemNgay.writeFileSync('./db.json', JSON.stringify(db, null, 2));

        const embed = new EmbedBuilderThemNgay()
            .setColor(0x00BFFF)
            .setTitle('More Successful Days')
            .setDescription(`Added **${daysToAdd}** date for key \`\`\`${keyToUpdate}\`\`\`.`) 
            .addFields({ name: 'New expiration date', value: newExpireDisplay })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
};