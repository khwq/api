const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 2308;

// ===================== MIDDLEWARE =====================
app.use(express.json({
    limit: '1mb'
}));

// ===================== DB PATH =====================
const dbPath = path.join(__dirname, 'db.json');

// ===================== ROUTE =====================
app.post('/api/validate', (req, res) => {
    try {
        // 🧪 DEBUG (xem log Render)
        console.log("REQ BODY:", req.body);

        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Body không hợp lệ.'
            });
        }

        let { key, hwid, apiKey } = req.body;

        // Normalize
        key = typeof key === 'string' ? key.trim() : null;
        hwid = typeof hwid === 'string' ? hwid.trim() : null;
        apiKey = typeof apiKey === 'string' ? apiKey.trim() : null;

        if (!key || !hwid || !apiKey) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu key, HWID hoặc API key.'
            });
        }

        if (!fs.existsSync(dbPath)) {
            return res.status(500).json({
                success: false,
                message: 'Không tìm thấy cơ sở dữ liệu.'
            });
        }

        let db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

        // ===================== CHECK API =====================
        const apiData = db.apis.find(a => a.apiKey === apiKey);
        if (!apiData || apiData.status !== 'active') {
            return res.json({
                success: false,
                message: 'API không hợp lệ hoặc đã bị khóa.'
            });
        }

        // ===================== CHECK KEY =====================
        const keyIndex = db.keys.findIndex(k => k.key === key);
        if (keyIndex === -1) {
            return res.json({
                success: false,
                message: 'Key không hợp lệ.'
            });
        }

        const keyData = db.keys[keyIndex];

        // ❌ KEY KHÔNG THUỘC APP NÀY
        if (keyData.api !== apiKey) {
            return res.json({
                success: false,
                message: 'Key không thuộc ứng dụng này.'
            });
        }

        // ===================== BAN =====================
        if (keyData.status === 'banned') {
            return res.json({
                success: false,
                message: 'Key đã bị khóa.'
            });
        }

        // ===================== FIRST LOGIN =====================
        if (!keyData.hwid) {
            keyData.hwid = hwid;
            keyData.firstLoginAt = new Date().toISOString();

            const expires = new Date();
            expires.setDate(
                expires.getDate() + (Number(keyData.durationInDays) || 0)
            );

            keyData.expiresAt = expires.toISOString();
            db.keys[keyIndex] = keyData;

            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

            return res.json({
                success: true,
                message: 'Xác thực lần đầu thành công!',
                expires: keyData.expiresAt
            });
        }

        // ===================== HWID CHECK =====================
        if (keyData.hwid !== hwid) {
            return res.json({
                success: false,
                message: 'HWID không khớp.'
            });
        }

        // ===================== EXPIRE =====================
        if (new Date(keyData.expiresAt) < new Date()) {
            return res.json({
                success: false,
                message: 'Key đã hết hạn.'
            });
        }

        // ===================== OK =====================
        return res.json({
            success: true,
            message: 'Xác thực thành công!',
            expires: keyData.expiresAt
        });

    } catch (err) {
        console.error("SERVER ERROR:", err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ.'
        });
    }
});

// ===================== START SERVER =====================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server API running on port ${PORT}`);
});

// ⚠️ Optional
 require('./deploy-commands.js');
 require('./bot.js');
