// File: src/axiosClient.js
import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:3000',
    withCredentials: true 
});

axiosClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // === BƯỚC SỬA LỖI Ở ĐÂY ===
        // Nếu API đang gọi là /refresh mà bị lỗi, thì ném lỗi ra ngoài luôn
        // Tuyệt đối không được dùng Interceptor để gọi lại nó, tránh vòng lặp vô tận!
        if (originalRequest.url === '/api/auth/refresh') {
            return Promise.reject(error);
        }
        // ============================

        if (error.response && (error.response.status === 401 || error.response.status === 403) && !originalRequest._retry) {
            
            originalRequest._retry = true; 

            try {
                await axiosClient.post('/api/auth/refresh');
                return axiosClient(originalRequest);
            } catch (refreshError) {
                console.error("Không thể làm mới thẻ, yêu cầu đăng nhập lại!");
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosClient;