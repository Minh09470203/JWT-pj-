require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
// Import các routes
const authRoutes = require('./routes/auth.routes');
const app = express();
app.use(express.json());
app.use(cookieParser());
const cors = require('cors');
// Cấu hình CORS để cho phép React (port 5173) gọi API và gửi Cookie
app.use(cors({
    origin: 'http://localhost:5173', // Đường dẫn của React App (sửa lại nếu React của bạn chạy port khác)
    credentials: true // BẮT BUỘC MỞ CỜ NÀY THÌ TRÌNH DUYỆT MỚI CHO GỬI COOKIE
}));

// Kết nối Database
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('🟢 Đã kết nối thành công với MongoDB!'))
    .catch((err) => console.error('🔴 Lỗi kết nối MongoDB:', err));

// Sử dụng Routes
// Tiền tố '/api/auth' sẽ được tự động thêm vào trước các route trong auth.routes.js
app.use('/api/auth', authRoutes); 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});