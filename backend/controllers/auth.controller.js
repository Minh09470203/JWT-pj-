const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { username, password } = req.body;

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại!' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'Tạo tài khoản thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu!' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu!' });
        }

        const payload = { 
            id: user._id, 
            username: user.username, 
            role: user.role 
        };
        // 1. Tạo Access Token (Sống 15 phút)
        const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
        
        // 2. Tạo Refresh Token (Sống 7 ngày)
        const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

        // 3. Lưu Refresh Token vào Database của user này
        user.refreshToken = refreshToken;
        await user.save();

        res.cookie('accessToken', accessToken, {
            httpOnly: true,  // Quan trọng nhất: Cấm Javascript đọc được cookie này!
            secure: false,   // Đặt là true nếu dự án chạy HTTPS (hiện tại chạy localhost nên để false)
            sameSite: 'strict', // Chống tấn công giả mạo yêu cầu (CSRF)
            maxAge: 15 * 60 * 1000 // Thời gian sống: 15 phút (tính bằng millisecond)
        });

        // Gài Refresh Token vào Cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // Thời gian sống: 7 ngày
        });

        // Trả lời Front-end một câu nhẹ nhàng, không cần đính kèm token trong body nữa
        res.json({ message: 'Đăng nhập thành công! Token đã được cất an toàn vào Cookie.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

const requestRefreshToken = async (req, res) => {
    // 1. THAY ĐỔI: Lấy Refresh Token từ Cookie (do trình duyệt tự gửi) thay vì từ req.body
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) return res.status(401).json({ message: 'Không có Refresh Token trong Cookie!' });

    // 2. Kiểm tra xem Token này có trong Database không?
    const user = await User.findOne({ refreshToken });
    if (!user) return res.status(403).json({ message: 'Refresh Token không hợp lệ hoặc đã bị đăng xuất!' });

    // 3. Xác thực (Giải mã) Refresh Token xem có hết hạn chưa
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Refresh Token đã hết hạn. Vui lòng đăng nhập lại!' });

        // 4. Nếu hợp lệ, tiến hành tạo Access Token mới tinh
        const payload = { 
            id: user._id, 
            username: user.username, 
            role: user.role 
        };
        const newAccessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });

        // 5. THAY ĐỔI: Gài Access Token mới vào lại Cookie đè lên cái cũ
        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: false, 
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 phút
        });

        // Chỉ cần báo thành công, Front-end không cần cầm token này làm gì cả
        res.json({ message: 'Đã làm mới Access Token thành công!' });
    });
};

// (Thêm vào cuối file controllers/auth.controller.js)

const logout = async (req, res) => {
    // 1. Lấy Refresh Token từ Cookie mà trình duyệt gửi lên
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
        // 2. Tìm User đang sở hữu cái thẻ này trong Database
        const user = await User.findOne({ refreshToken });
        
        // 3. Nếu tìm thấy, thu hồi thẻ (set thành null) rồi lưu lại
        if (user) {
            user.refreshToken = null;
            await user.save();
        }
    }

    // 4. Lệnh quan trọng nhất: Yêu cầu trình duyệt hủy cả 2 Cookie
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    // 5. Trả lời Front-end
    res.json({ message: 'Đã đăng xuất thành công và dọn dẹp sạch sẽ!' });
};

module.exports = { register, login, requestRefreshToken, logout };
