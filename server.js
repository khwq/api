const express = require('express');
const { Pool } = require('pg'); // Thư viện kết nối PostgreSQL
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// Kết nối tới Supabase Database qua biến môi trường DATABASE_URL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Bắt buộc phải có khi dùng Supabase
});

app.post('/api/validate', async (req, res) => {
    const { key, hwid } = req.body;

    if (!key || !hwid) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu key hoặc HWID.'
        });
    }

    try {
        // 1. Tìm Key trong Database
        const keyResult = await pool.query('SELECT * FROM keys WHERE key = $1', [key]);
        
        if (keyResult.rows.length === 0) {
            return res.json({ success: false, message: 'Key không hợp lệ.' });
        }

        let keyData = keyResult.rows[0];

        // 2. Kiểm tra API (xem app có bị tạm dừng/vô hiệu hóa không)
        const apiResult = await pool.query('SELECT * FROM apis WHERE api_key = $1', [keyData.api]);
        
        if (apiResult.rows.length === 0 || apiResult.rows[0].status !== 'active') {
            return res.json({ success: false, message: 'API của key này đã bị vô hiệu hóa.' });
        }

        // 3. Kiểm tra Key có bị ban không
        if (keyData.status === 'banned') {
            let reason = 'Không rõ';
            let unbanDateStr = 'Vĩnh viễn';
            
            // Xử lý dữ liệu JSONB ban_info từ Postgres
            if (keyData.ban_info) {
                reason = keyData.ban_info.reason || reason;
                if (keyData.ban_info.unbanDate && keyData.ban_info.unbanDate !== 'Vĩnh viễn') {
                    unbanDateStr = new Date(keyData.ban_info.unbanDate).toLocaleDateString('vi-VN');
                }
            }
            
            return res.json({
                success: false,
                message: `Key đã bị khóa. Lý do: ${reason}. Mở khóa vào: ${unbanDateStr}`
            });
        }

        // 4. XỬ LÝ ĐĂNG NHẬP LẦN ĐẦU → BIND HWID
        if (!keyData.hwid) {
            const duration = keyData.duration_in_days || 0;
            const expires = new Date();
            expires.setDate(expires.getDate() + duration);
            const firstLogin = new Date();

            // Cập nhật HWID và thời gian vào Database
            await pool.query(
                'UPDATE keys SET hwid = $1, first_login_at = $2, expires_at = $3 WHERE key = $4',
                [hwid, firstLogin, expires, key]
            );

            return res.json({
                success: true,
                message: 'Xác thực lần đầu thành công!',
                expires: expires.toISOString()
            });
        }

        // 5. Kiểm tra HWID có khớp không
        if (keyData.hwid !== hwid) {
            return res.json({
                success: false,
                message: 'HWID không khớp.'
            });
        }

        // 6. Kiểm tra hạn sử dụng
        if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
            return res.json({
                success: false,
                message: 'Key đã hết hạn.'
            });
        }

        // 7. Mọi thứ hợp lệ
        return res.json({
            success: true,
            message: 'Xác thực thành công!',
            expires: keyData.expires_at
        });

    } catch (err) {
        console.error('Lỗi Database: ', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ.'
        });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`API running on port ${PORT}`);
});

// Tạm comment phần bot discord lại để Render chỉ chạy API cho nhẹ
// require('./bot.js');
// require('./deploy-commands.js');
