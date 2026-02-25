const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const token = req.cookies.accessToken;

    if (!token) return res.status(401).json({ message: 'Không tìm thấy Token!' });

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn!' });
        
        req.user = user;
        next();
    });
};

const authorizeAdmin = (req, res, next) => {
    // Lưu ý: Hàm này LUÔN PHẢI chạy sau authenticateToken, 
    // nên lúc này req.user chắc chắn đã có dữ liệu.
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Chỉ dành cho Admin!' });
    }
    next(); // Nếu là admin thì cho đi tiếp
};

// Export cả 2 hàm ra
module.exports = { authenticateToken, authorizeAdmin };