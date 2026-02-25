import { useState, useEffect } from 'react'; // BƯỚC 1: Import thêm useEffect
import axiosClient from './axiosClient';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // BƯỚC 2: Thêm state Loading, mặc định là true (đang tải) khi mới vào web
  const [isLoading, setIsLoading] = useState(true);

  // BƯỚC 3: Dùng useEffect để gọi API check-auth ngay khi F5
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Âm thầm gọi lên Server kiểm tra thẻ
        await axiosClient.get('/api/auth/check-auth');
        
        // Lọt xuống đây nghĩa là không bị lỗi -> Thẻ hợp lệ
        setIsLoggedIn(true);
      } catch (error) {
        // Bị lỗi (401/403) -> Thẻ hết hạn hoặc chưa đăng nhập
        setIsLoggedIn(false);
      } finally {
        // Cuối cùng, dù thành công hay thất bại thì cũng phải tắt Loading đi
        setIsLoading(false);
      }
    };

    checkAuth(); // Kích hoạt hàm
  }, []); // Cặp ngoặc vuông rỗng [] có nghĩa là chỉ chạy 1 lần duy nhất khi load trang

  // ... (Các hàm handleLogin, handleGetDashboard, handleLogout giữ nguyên y hệt cũ) ...
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosClient.post('/api/auth/login', { username, password });
      setMessage('✅ ' + response.data.message);
      setIsLoggedIn(true);
    } catch (error) {
      setMessage('❌ ' + (error.response?.data?.message || 'Lỗi đăng nhập'));
    }
  };

  const handleGetDashboard = async () => {
    try {
      const response = await axiosClient.get('/api/auth/dashboard');
      setDashboardData(response.data);
      setMessage('✅ Lấy dữ liệu thành công!');
    } catch (error) {
      setMessage('❌ ' + (error.response?.data?.message || 'Phiên đăng nhập hết hạn!'));
    }
  };

  const handleLogout = async () => {
    try {
      const response = await axiosClient.post('/api/auth/logout');
      setMessage('✅ ' + response.data.message);
      setIsLoggedIn(false);
      setDashboardData(null);
      setUsername('');
      setPassword('');
    } catch (error) {
      setMessage('❌ ' + (error.response?.data?.message || 'Lỗi đăng xuất'));
    }
  };

  // ... (renderLoginForm và renderDashboard giữ nguyên) ...
  const renderLoginForm = () => (
    <div className="card">
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Đăng Nhập</h2>
      <form onSubmit={handleLogin} className="form-group">
        <input type="text" placeholder="Tên đăng nhập" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" className="btn-primary">Vào hệ thống</button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );

  const renderDashboard = () => (
    <div className="card" style={{ maxWidth: '600px' }}>
      <h2>Trang Quản Trị Hệ Thống</h2>
      <p>Xin chào, bạn đã đăng nhập thành công!</p>
      <div className="button-group">
        <button onClick={handleGetDashboard} className="btn-primary">Tải dữ liệu tuyệt mật</button>
        <button onClick={handleLogout} className="btn-danger">Đăng xuất</button>
      </div>
      {message && <p className="message">{message}</p>}
      {dashboardData && (
        <div className="data-box">
          <h3>Kết quả từ Server:</h3>
          <p>{dashboardData.message}</p>
          <pre>{JSON.stringify(dashboardData.userData, null, 2)}</pre>
        </div>
      )}
    </div>
  );

  // BƯỚC 4: Nếu đang tải thì hiện thông báo chờ, không hiện Form
  if (isLoading) {
    return (
      <div className="app-container">
        <h2>Đang kết nối đến Server...</h2>
      </div>
    );
  }

  return (
    <div className="app-container">
      {isLoggedIn ? renderDashboard() : renderLoginForm()}
    </div>
  );
}

export default App;