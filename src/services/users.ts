import api from '@/lib/api';
import type { User } from '@/types';

export interface UpdateUserRequest {
  name?: string;
  phone?: string;
  profileImageUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// 사용자 정보 조회
export const getUser = async (id: string): Promise<User> => {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
};

// 사용자 정보 수정
export const updateUser = async (id: string, data: UpdateUserRequest): Promise<User> => {
  const response = await api.patch<User>(`/users/${id}`, data);
  return response.data;
};

// 비밀번호 변경
export const changePassword = async (data: ChangePasswordRequest): Promise<{ message: string }> => {
  const response = await api.patch<{ message: string }>('/users/me/password', data);
  return response.data;
};

// 팀원 목록 조회
export const getTeamMembers = async (): Promise<User[]> => {
  const response = await api.get<User[]>('/users/team-members');
  return response.data;
};

// 내 프로필 수정
export const updateProfile = async (data: UpdateUserRequest): Promise<User> => {
  const response = await api.patch<User>('/users/me', data);
  return response.data;
};

// 슬랙 보고서 템플릿 조회
export const getSlackTemplate = async (): Promise<{ template: string | null }> => {
  const response = await api.get<{ template: string | null }>('/users/me/slack-template');
  return response.data;
};

// 슬랙 보고서 템플릿 저장
export const updateSlackTemplate = async (template: string): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/users/me/slack-template', { template });
  return response.data;
};
