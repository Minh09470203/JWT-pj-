const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken, authorizeAdmin } = require('../middlewares/auth.middleware');

// Các route không cần bảo vệ
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.requestRefreshToken);
router.post('/logout', authController.logout);

// Route cho BẤT KỲ AI ĐÃ ĐĂNG NHẬP (Chỉ cần đi qua 1 cửa bảo vệ)
router.get('/dashboard', authenticateToken, (req, res) => {
    res.json({ 
        message: `Chào mừng ${req.user.username} đến với trang quản trị!`,
        userData: req.user 
    });
});

// THÊM MỚI: Route dành riêng cho ADMIN (Phải đi qua 2 cửa)
router.get('/admin-panel', authenticateToken, authorizeAdmin, (req, res) => {
    res.json({ message: `Sếp ${req.user.username} đã vào phòng VIP!`, data: 'Dữ liệu tuyệt mật' });
});

// Thêm route này để Front-end gọi ngầm mỗi khi F5 trang
router.get('/check-auth', authenticateToken, (req, res) => {
    // Nếu lọt qua được cửa bảo vệ (authenticateToken) thì có nghĩa là Token hợp lệ
    // Ta trả về thông tin user luôn để Front-end dùng nếu cần
    res.json({ message: 'Xác thực thành công', user: req.user });
});

module.exports = router;