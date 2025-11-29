import api from '@/lib/api';
import type { User } from '@/types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LoginResponse {
  user: User;
}

// 로그인 (httpOnly 쿠키는 서버에서 자동 설정됨)
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', data);
  return response.data;
};

// 회원가입
export const signup = async (data: SignupRequest): Promise<User> => {
  const response = await api.post<User>('/auth/signup', data);
  return response.data;
};

// 로그아웃 (httpOnly 쿠키는 서버에서 제거됨)
export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
};

// 토큰 갱신 (httpOnly 쿠키는 서버에서 자동 설정됨)
export const refreshToken = async (): Promise<void> => {
  await api.post('/auth/refresh');
};

// 현재 사용자 정보 조회
export const getMe = async (): Promise<User> => {
  const response = await api.get<User>('/auth/me');
  return response.data;
};
