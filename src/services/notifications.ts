import api from '@/lib/api';
import type { Notification, PaginatedResponse } from '@/types';

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: string;
}

export interface NotificationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

export interface NotificationResponse {
  data: Notification[];
  meta: NotificationMeta;
}

// 알림 목록 조회
export const getNotifications = async (params?: NotificationQueryParams): Promise<NotificationResponse> => {
  const response = await api.get<NotificationResponse>('/notifications', { params });
  return response.data;
};

// 읽지 않은 알림 수 조회
export const getUnreadCount = async (): Promise<{ count: number }> => {
  const response = await api.get<{ count: number }>('/notifications/unread-count');
  return response.data;
};

// 알림 읽음 처리
export const markAsRead = async (id: string): Promise<Notification> => {
  const response = await api.patch<Notification>(`/notifications/${id}/read`);
  return response.data;
};

// 모든 알림 읽음 처리
export const markAllAsRead = async (): Promise<{ count: number; message: string }> => {
  const response = await api.patch<{ count: number; message: string }>('/notifications/read-all');
  return response.data;
};

// 알림 삭제
export const deleteNotification = async (id: string): Promise<void> => {
  await api.delete(`/notifications/${id}`);
};

// 모든 알림 삭제
export const deleteAllNotifications = async (): Promise<{ count: number; message: string }> => {
  const response = await api.delete<{ count: number; message: string }>('/notifications');
  return response.data;
};
