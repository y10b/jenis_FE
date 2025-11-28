import api from '@/lib/api';
import type { User } from '@/types';
import Cookies from 'js-cookie';

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
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

// 로그인
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', data);
  if (response.data.accessToken) {
    Cookies.set('access_token', response.data.accessToken);
  }
  return response.data;
};

// 회원가입
export const signup = async (data: SignupRequest): Promise<User> => {
  const response = await api.post<User>('/auth/signup', data);
  return response.data;
};

// 로그아웃
export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
  Cookies.remove('access_token');
};

// 토큰 갱신
export const refreshToken = async (): Promise<RefreshResponse> => {
  const response = await api.post<RefreshResponse>('/auth/refresh');
  if (response.data.accessToken) {
    Cookies.set('access_token', response.data.accessToken);
  }
  return response.data;
};

// 현재 사용자 정보 조회
export const getMe = async (): Promise<User> => {
  const response = await api.get<User>('/auth/me');
  return response.data;
};
