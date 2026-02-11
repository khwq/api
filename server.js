const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

const dbPath = path.join(__dirname, 'db.json');

app.post('/api/validate', (req, res) => {
    const { key, hwid } = req.body;

    if (!key || !hwid) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu key hoặc HWID.'
        });
    }

    try {
        if (!fs.existsSync(dbPath)) {
            return res.status(500).json({
                success: false,
                message: 'Không tìm thấy cơ sở dữ liệu.'
            });
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
            return res.json({
                success: false,
                message: `Key đã bị khóa. Lý do: ${keyData.banInfo.reason}. Mở khóa vào: ${unbanDate}`
            });
        }

        // FIRST LOGIN → BIND HWID
        if (!keyData.hwid) {
            keyData.hwid = hwid;
            keyData.firstLoginAt = new Date().toISOString();

            const duration = keyData.durationInDays || 0;
            const expires = new Date();
            expires.setDate(expires.getDate() + duration);
            keyData.expiresAt = expires.toISOString();

            db.keys[keyIndex] = keyData;
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

            return res.json({
                success: true,
                message: 'Xác thực lần đầu thành công!',
                expires: keyData.expiresAt
            });
        }

        if (keyData.hwid !== hwid) {
            return res.json({
                success: false,
                message: 'HWID không khớp.'
            });
        }

        if (new Date(keyData.expiresAt) < new Date()) {
            return res.json({
                success: false,
                message: 'Key đã hết hạn.'
            });
        }

        return res.json({
            success: true,
            message: 'Xác thực thành công!',
            expires: keyData.expiresAt
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ.'
        });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`API running on port ${PORT}`);
});

// ⚠️ Chỉ require bot nếu cần
//require('./bot.js');
//require('./deploy-commands.js');
