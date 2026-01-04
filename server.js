const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 2308; 

app.use(express.json());


app.post('/api/validate', (req, res) => {
    const { key, hwid, apiKey } = req.body;

    if (!key || !hwid || !apiKey) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu key, HWID hoặc API key.'
        });
    }

    try {
        let db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

        // 1️⃣ Check API
        const apiData = db.apis.find(a => a.apiKey === apiKey);
        if (!apiData || apiData.status !== 'active') {
            return res.json({
                success: false,
                message: 'API không hợp lệ hoặc đã bị khóa.'
            });
        }

        // 2️⃣ Check KEY
        const keyIndex = db.keys.findIndex(k => k.key === key);
        if (keyIndex === -1) {
            return res.json({ success: false, message: 'Key không hợp lệ.' });
        }

        const keyData = db.keys[keyIndex];

        // ❌ KEY KHÔNG THUỘC API NÀY
        if (keyData.api !== apiKey) {
            return res.json({
                success: false,
                message: 'Key không thuộc ứng dụng này.'
            });
        }

        // 3️⃣ Ban check
        if (keyData.status === 'banned') {
            return res.json({
                success: false,
                message: 'Key đã bị khóa.'
            });
        }

        // 4️⃣ First login → bind HWID
        if (!keyData.hwid) {
            keyData.hwid = hwid;
            keyData.firstLoginAt = new Date().toISOString();

            const expires = new Date();
            expires.setDate(expires.getDate() + (keyData.durationInDays || 0));
            keyData.expiresAt = expires.toISOString();

            db.keys[keyIndex] = keyData;
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

            return res.json({
                success: true,
                message: 'Login lần đầu thành công',
                expires: keyData.expiresAt
            });
        }

        // 5️⃣ HWID mismatch
        if (keyData.hwid !== hwid) {
            return res.json({
                success: false,
                message: 'HWID không khớp.'
            });
        }

        // 6️⃣ Expired
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
    console.log(`Server API đang chạy tại http://0.0.0.0:${PORT}`);
});
require('./deploy-commands.js');
require('./bot.js');

