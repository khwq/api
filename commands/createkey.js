const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const crypto = require('crypto');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createkey')
        .setDescription('Generate new keys with customizable random length.')
        .addStringOption(option => option.setName('api_key').setDescription('24 digit API code').setRequired(true).setMinLength(24).setMaxLength(24))
        .addIntegerOption(option => option.setName('so_luong').setDescription('Number of keys to generate').setRequired(true).setMinValue(1).setMaxValue(50))
        .addIntegerOption(option => option.setName('han_ngay').setDescription('Number of days of key use (from activation)').setRequired(true).setMinValue(1))
        .addStringOption(option => option.setName('prefix').setDescription('The prefix of the key (eg: MyApp). "-" will be added automatically.').setRequired(false))
        .addIntegerOption(option => 
    option.setName('do_dai_ngaunhien')
        .setDescription('Number of random code segments (4 characters each). Default: 4.')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(8)),
    async execute(interaction) {
        await interaction.deferReply();

        const apiKey = interaction.options.getString('api_key');
        const quantity = interaction.options.getInteger('so_luong');
        const durationInDays = interaction.options.getInteger('han_ngay');
        let prefix = interaction.options.getString('prefix') || '';
        const randomChunks = interaction.options.getInteger('do_dai_ngaunhien') || 4;

        if (prefix && !prefix.endsWith('-')) {
            prefix += '-';
        }

        const db = JSON.parse(fs.readFileSync('./db.json', 'utf-8'));
        const apiData = db.apis.find(a => a.apiKey === apiKey);

        if (!apiData) {
            return interaction.editReply({ content: 'Invalid API code.', ephemeral: true });
        }
        
        const CHUNK_SIZE = 4;
        const totalRandomChars = CHUNK_SIZE * randomChunks;
        const bytesNeeded = Math.ceil(totalRandomChars / 2);

        const generatedKeyStrings = Array.from({ length: quantity }, () => {
            const randomHex = crypto.randomBytes(bytesNeeded).toString('hex').toUpperCase();
            const fullRandomString = randomHex.slice(0, totalRandomChars);
            
            const chunks = [];
            for (let j = 0; j < fullRandomString.length; j += CHUNK_SIZE) {
                chunks.push(fullRandomString.substring(j, j + CHUNK_SIZE));
            }
            const finalRandomPart = chunks.join('-');
            
            return prefix + finalRandomPart;
        });

        generatedKeyStrings.forEach(keyString => {
            const newKey = {
                key: keyString,
                api: apiKey,
                status: 'active',
                durationInDays: durationInDays,
                hwid: null,
                firstLoginAt: null,
                expiresAt: null,
                createdAt: new Date().toISOString()
            };
            db.keys.push(newKey);
        });

        fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));

        let formatString = 'XXXX';
        if (randomChunks > 1) {
            formatString += '-XXXX'.repeat(randomChunks - 1);
        }

        const embed = new EmbedBuilder()
            .setColor(0x00BFFF)
            .setTitle(`Created Success ${quantity} Key`)
            .setDescription(`Keys have been generated for the app's API. **${apiData.appName}**.\nExpiry:: **${durationInDays} day** (since first activation).\nKey format: \`${prefix || ''}${formatString}\``)
            .addFields({ name: 'List of generated keys', value: `\`\`\`${generatedKeyStrings.join('\n')}\`\`\`` }) 
            .setTimestamp();
            
        await interaction.editReply({ embeds: [embed] });
    },
};
