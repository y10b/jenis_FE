import api from '@/lib/api';
import type { User, UserRole, PaginatedResponse } from '@/types';

export interface AdminUserQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  role?: UserRole;
  teamId?: string;
  search?: string;
}

// 승인 대기 사용자 목록 조회
export const getPendingUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>('/admin/users/pending');
  return response.data;
};

// 전체 사용자 목록 조회
export const getAllUsers = async (params?: AdminUserQueryParams): Promise<PaginatedResponse<User>> => {
  const response = await api.get<PaginatedResponse<User>>('/admin/users', { params });
  return response.data;
};

// 사용자 승인
export const approveUser = async (userId: string, teamId?: string): Promise<User> => {
  const response = await api.patch<User>(`/admin/users/${userId}/approve`, { teamId });
  return response.data;
};

// 사용자 거절
export const rejectUser = async (userId: string, reason?: string): Promise<User> => {
  const response = await api.patch<User>(`/admin/users/${userId}/reject`, { reason });
  return response.data;
};

// 사용자 역할 변경
export const updateUserRole = async (userId: string, role: UserRole): Promise<User> => {
  const response = await api.patch<User>(`/admin/users/${userId}/role`, { role });
  return response.data;
};

// 사용자 팀 변경
export const updateUserTeam = async (userId: string, teamId: string | null): Promise<User> => {
  const response = await api.patch<User>(`/admin/users/${userId}/team`, { teamId });
  return response.data;
};

// 사용자 비활성화
export const deactivateUser = async (userId: string): Promise<User> => {
  const response = await api.patch<User>(`/admin/users/${userId}/deactivate`);
  return response.data;
};

// 사용자 활성화
export const activateUser = async (userId: string): Promise<User> => {
  const response = await api.patch<User>(`/admin/users/${userId}/activate`);
  return response.data;
};
