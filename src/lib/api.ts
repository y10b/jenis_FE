import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Axios 인스턴스 생성
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // httpOnly 쿠키를 자동으로 전송
  headers: {
    'Content-Type': 'application/json',
  },
});

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    // 백엔드의 { success: true, data: ... } 래핑 해제
    if (response.data && response.data.success === true && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 401 에러이고 재시도하지 않은 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 토큰 갱신 시도 (httpOnly 쿠키 사용)
        await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        // 원래 요청 재시도
        return api(originalRequest);
      } catch (refreshError) {
        // 갱신 실패 시 로그인 페이지로 이동 (이미 로그인 페이지면 무시)
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
