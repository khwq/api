const { SlashCommandBuilder: SlashCommandBuilderReset, EmbedBuilder: EmbedBuilderReset } = require('discord.js');
const fsReset = require('fs');

module.exports = {
    data: new SlashCommandBuilderReset()
        .setName('resethwid')
        .setDescription('Đặt lại (reset) HWID của một key.')
        .addStringOption(option => option.setName('key').setDescription('Key cần reset HWID').setRequired(true))
        .addStringOption(option => option.setName('api_key').setDescription('Mã API của key để xác thực').setRequired(true).setMinLength(24).setMaxLength(24)),
    async execute(interaction) {
        const keyToReset = interaction.options.getString('key');
        const apiKey = interaction.options.getString('api_key');
        const db = JSON.parse(fsReset.readFileSync('./db.json', 'utf-8'));
        const keyData = db.keys.find(k => k.key === keyToReset && k.api === apiKey);

        if (!keyData) {
            return interaction.reply({ content: 'Không tìm thấy key hoặc mã API không đúng.', ephemeral: true });
        }
        if (!keyData.hwid) {
            return interaction.reply({ content: 'Key này chưa được gán HWID.', ephemeral: true });
        }
        
        const oldHwid = keyData.hwid;
        keyData.hwid = null; 
        fsReset.writeFileSync('./db.json', JSON.stringify(db, null, 2));

        const embed = new EmbedBuilderReset()
            .setColor(0xFFFF00)
            .setTitle('Reset HWID Thành Công')
            .setDescription(`Đã reset HWID cho key \`\`\`${keyToReset}\`\`\`.\nNgười dùng tiếp theo đăng nhập sẽ gán HWID mới.`)
            .addFields({ name: 'HWID cũ', value: `\`\`\${oldHwid}\`\`\``})
            .setTimestamp();
            
        await interaction.reply({ embeds: [embed] });
    },
};