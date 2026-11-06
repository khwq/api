const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const crypto = require('crypto');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

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

        try {
            // Kiểm tra API có tồn tại không
            const apiResult = await pool.query('SELECT * FROM apis WHERE api_key = $1', [apiKey]);
            if (apiResult.rows.length === 0) {
                return interaction.editReply({ content: 'Invalid API code.', ephemeral: true });
            }
            const apiData = apiResult.rows[0];

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

            // Thêm từng key vào Database
            for (const keyString of generatedKeyStrings) {
                await pool.query(
                    'INSERT INTO keys (key, api, status, duration_in_days) VALUES ($1, $2, $3, $4)',
                    [keyString, apiKey, 'active', durationInDays]
                );
            }

            let formatString = 'XXXX';
            if (randomChunks > 1) {
                formatString += '-XXXX'.repeat(randomChunks - 1);
            }

            const embed = new EmbedBuilder()
                .setColor(0x00BFFF)
                .setTitle(`Created Success ${quantity} Key`)
                .setDescription(`Keys have been generated for the app's API. **${apiData.app_name}**.\nExpiry:: **${durationInDays} day** (since first activation).\nKey format: \`${prefix || ''}${formatString}\``)
                .addFields({ name: 'List of generated keys', value: `\`\`\`${generatedKeyStrings.join('\n')}\`\`\`` }) 
                .setTimestamp();
                
            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            console.error(err);
            await interaction.editReply({ content: 'Lỗi kết nối Database!' });
        }
    },
};
