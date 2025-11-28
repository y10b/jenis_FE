import api from '@/lib/api';
import type { Retrospective, PaginatedResponse, RetroType, Visibility } from '@/types';

export interface RetrospectiveQueryParams {
  page?: number;
  limit?: number;
  type?: RetroType;
  visibility?: Visibility;
  isDraft?: boolean;
  periodStartFrom?: string;
  periodStartTo?: string;
}

export interface CreateRetrospectiveRequest {
  type: RetroType;
  title?: string;
  content: string;
  periodStart: string;
  periodEnd: string;
  isDraft?: boolean;
  visibility?: Visibility;
}

export interface UpdateRetrospectiveRequest {
  type?: RetroType;
  title?: string;
  content?: string;
  periodStart?: string;
  periodEnd?: string;
  isDraft?: boolean;
  visibility?: Visibility;
}

export interface ShareRetrospectiveRequest {
  userIds?: string[];
  teamIds?: string[];
}

// 회고 목록 조회
export const getRetrospectives = async (params?: RetrospectiveQueryParams): Promise<PaginatedResponse<Retrospective>> => {
  const response = await api.get<PaginatedResponse<Retrospective>>('/retrospectives', { params });
  return response.data;
};

// 내 회고 목록 조회
export const getMyRetrospectives = async (params?: RetrospectiveQueryParams): Promise<PaginatedResponse<Retrospective>> => {
  const response = await api.get<PaginatedResponse<Retrospective>>('/retrospectives/my', { params });
  return response.data;
};

// 공유받은 회고 목록 조회
export const getSharedRetrospectives = async (params?: RetrospectiveQueryParams): Promise<PaginatedResponse<Retrospective>> => {
  const response = await api.get<PaginatedResponse<Retrospective>>('/retrospectives/shared', { params });
  return response.data;
};

// 회고 상세 조회
export const getRetrospective = async (id: string): Promise<Retrospective> => {
  const response = await api.get<Retrospective>(`/retrospectives/${id}`);
  return response.data;
};

// 회고 생성
export const createRetrospective = async (data: CreateRetrospectiveRequest): Promise<Retrospective> => {
  const response = await api.post<Retrospective>('/retrospectives', data);
  return response.data;
};

// 회고 수정
export const updateRetrospective = async (id: string, data: UpdateRetrospectiveRequest): Promise<Retrospective> => {
  const response = await api.patch<Retrospective>(`/retrospectives/${id}`, data);
  return response.data;
};

// 회고 삭제
export const deleteRetrospective = async (id: string): Promise<void> => {
  await api.delete(`/retrospectives/${id}`);
};

// 회고 발행
export const publishRetrospective = async (id: string): Promise<Retrospective> => {
  const response = await api.patch<Retrospective>(`/retrospectives/${id}/publish`);
  return response.data;
};

// 회고 공유 설정
export const shareRetrospective = async (id: string, data: ShareRetrospectiveRequest): Promise<Retrospective> => {
  const response = await api.post<Retrospective>(`/retrospectives/${id}/share`, data);
  return response.data;
};

// 회고 공유 추가
export const addRetrospectiveShare = async (id: string, data: ShareRetrospectiveRequest): Promise<Retrospective> => {
  const response = await api.post<Retrospective>(`/retrospectives/${id}/share/add`, data);
  return response.data;
};

// 회고 공유 삭제
export const removeRetrospectiveShare = async (id: string, shareId: string): Promise<void> => {
  await api.delete(`/retrospectives/${id}/share/${shareId}`);
};
