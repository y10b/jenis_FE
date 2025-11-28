import api from '@/lib/api';
import type { Schedule, PaginatedResponse, ScheduleType } from '@/types';

export interface ScheduleQueryParams {
  page?: number;
  limit?: number;
  type?: ScheduleType;
  isActive?: boolean;
  teamId?: string;
}

export interface CreateScheduleRequest {
  title: string;
  description?: string;
  type: ScheduleType;
  scheduledAt?: string;
  cronExpression?: string;
  teamIds?: string[];
}

export interface UpdateScheduleRequest {
  title?: string;
  description?: string;
  type?: ScheduleType;
  scheduledAt?: string;
  cronExpression?: string;
  isActive?: boolean;
  teamIds?: string[];
}

// 스케줄 목록 조회
export const getSchedules = async (params?: ScheduleQueryParams): Promise<PaginatedResponse<Schedule>> => {
  const response = await api.get<PaginatedResponse<Schedule>>('/schedules', { params });
  return response.data;
};

// 내 스케줄 목록 조회
export const getMySchedules = async (params?: ScheduleQueryParams): Promise<PaginatedResponse<Schedule>> => {
  const response = await api.get<PaginatedResponse<Schedule>>('/schedules/my', { params });
  return response.data;
};

// 팀 스케줄 목록 조회
export const getTeamSchedules = async (teamId: string, params?: ScheduleQueryParams): Promise<PaginatedResponse<Schedule>> => {
  const response = await api.get<PaginatedResponse<Schedule>>(`/schedules/team/${teamId}`, { params });
  return response.data;
};

// 다가오는 스케줄 조회
export const getUpcomingSchedules = async (limit?: number): Promise<Schedule[]> => {
  const response = await api.get<Schedule[]>('/schedules/upcoming', { params: { limit } });
  return response.data;
};

// 스케줄 상세 조회
export const getSchedule = async (id: string): Promise<Schedule> => {
  const response = await api.get<Schedule>(`/schedules/${id}`);
  return response.data;
};

// 스케줄 생성
export const createSchedule = async (data: CreateScheduleRequest): Promise<Schedule> => {
  const response = await api.post<Schedule>('/schedules', data);
  return response.data;
};

// 스케줄 수정
export const updateSchedule = async (id: string, data: UpdateScheduleRequest): Promise<Schedule> => {
  const response = await api.patch<Schedule>(`/schedules/${id}`, data);
  return response.data;
};

// 스케줄 삭제
export const deleteSchedule = async (id: string): Promise<void> => {
  await api.delete(`/schedules/${id}`);
};

// 스케줄 활성화/비활성화 토글
export const toggleScheduleActive = async (id: string): Promise<Schedule> => {
  const response = await api.patch<Schedule>(`/schedules/${id}/toggle`);
  return response.data;
};
