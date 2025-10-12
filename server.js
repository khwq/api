// server.js
const express = require('express');
const fs = require('fs');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const app = express();
const PORT = process.env.PORT || 3000;

// ====== CẤU HÌNH DISCORD BOT ======
const TOKEN = process.env.DISCORD_TOKEN; // đặt token bot vào biến môi trường Render
const GUILD_ID = process.env.GUILD_ID;   // ID server Discord của bạn (nếu cần)
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Khi bot online
client.once('ready', () => {
    console.log(`🤖 Bot đã đăng nhập: ${client.user.tag}`);
});

// Xử lý lệnh slash "/createkey"
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;
    if (commandName === 'createkey') {
        try {
            const dbPath = './db.json';
            if (!fs.existsSync(dbPath)) {
                return interaction.reply({ content: 'Không tìm thấy database.', ephemeral: true });
            }

            let db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
            const newKey = Math.random().toString(36).substring(2, 10).toUpperCase();

            db.keys.push({
                key: newKey,
                hwid: null,
                status: 'active',
                durationInDays: 7,
                createdAt: new Date().toISOString(),
                api: 'main'
            });

            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

            const embed = new EmbedBuilder()
                .setTitle('🔑 Key mới được tạo!')
                .setDescription(`Key: **${newKey}**`)
                .setColor('Green')
                .setFooter({ text: `Tạo bởi ${interaction.user.username}` });

            await interaction.reply({ embeds: [embed] });
        } catch (err) {
            console.error(err);
            await interaction.reply({ content: 'Lỗi khi tạo key.', ephemeral: true });
        }
    }
});

// Đăng ký lệnh /createkey (tự động khi bot chạy)
client.on('ready', async () => {
    const data = [
        {
            name: 'createkey',
            description: 'Tạo một key mới và lưu vào db.json'
        }
    ];

    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        await guild.commands.set(data);
        console.log('✅ Slash command /createkey đã được đăng ký.');
    } catch (error) {
        console.error('Lỗi đăng ký lệnh:', error);
    }
});

client.login(TOKEN);

// ====== PHẦN API CŨ CỦA BẠN ======
app.use(express.json());

app.post('/api/validate', (req, res) => {
    const { key, hwid } = req.body;

    if (!key || !hwid) {
        return res.status(400).json({ success: false, message: 'Thiếu key hoặc HWID.' });
    }

    try {
        const dbPath = './db.json';
        if (!fs.existsSync(dbPath)) {
            return res.status(500).json({ success: false, message: 'Không tìm thấy cơ sở dữ liệu.' });
        }

        let db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        const keyIndex = db.keys.findIndex(k => k.key === key);

        if (keyIndex === -1) {
            return res.json({ success: false, message: 'Key không hợp lệ.' });
        }

        let keyData = db.keys[keyIndex];
        const apiData = db.apis.find(a => a.apiKey === keyData.api);

        if (!apiData || apiData.status !== 'active') {
            return res.json({ success: false, message: 'API của key này đã bị vô hiệu hóa.' });
        }

        if (keyData.status === 'banned') {
            const unbanDate = new Date(keyData.banInfo.unbanDate).toLocaleDateString('vi-VN');
            return res.json({ success: false, message: `Key đã bị khóa. Lý do: ${keyData.banInfo.reason}. Mở khóa vào: ${unbanDate}` });
        }

        if (!keyData.hwid) {
            keyData.hwid = hwid;
            keyData.firstLoginAt = new Date().toISOString();

            const duration = keyData.durationInDays || 0;
            const firstLoginDate = new Date(keyData.firstLoginAt);
            const expiresDate = new Date(firstLoginDate.setDate(firstLoginDate.getDate() + duration));
            keyData.expiresAt = expiresDate.toISOString();

            db.keys[keyIndex] = keyData;
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

            return res.json({
                success: true,
                message: `Xác thực lần đầu thành công! Key đã được kích hoạt và gán HWID. Hạn sử dụng là ${duration} ngày.`,
                expires: keyData.expiresAt
            });
        }

        if (keyData.hwid !== hwid) {
            return res.json({ success: false, message: 'HWID không khớp. Vui lòng liên hệ admin để reset.' });
        }

        if (!keyData.expiresAt || new Date(keyData.expiresAt) < new Date()) {
            return res.json({ success: false, message: 'Key đã hết hạn sử dụng.' });
        }

        return res.json({
            success: true,
            message: 'Xác thực thành công!',
            expires: keyData.expiresAt
        });
    } catch (error) {
        console.error('Lỗi server API:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Server API đang chạy tại http://0.0.0.0:${PORT}`);
});
