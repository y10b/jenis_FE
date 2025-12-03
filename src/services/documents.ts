import api from '@/lib/api';
import type { TeamDocument, DocumentListResponse } from '@/types';

export interface CreateDocumentRequest {
  teamId: string;
  title: string;
  content: string;
  tags?: string[];
}

export interface UpdateDocumentRequest {
  title?: string;
  content?: string;
  tags?: string[];
}

export interface DocumentQueryParams {
  page?: number;
  limit?: number;
  teamId?: string;
  search?: string;
  tag?: string;
  favoritesOnly?: boolean;
}

export interface PopularTag {
  tag: string;
  count: number;
}

// 문서 목록 조회
export const getDocuments = async (
  params?: DocumentQueryParams
): Promise<DocumentListResponse> => {
  const response = await api.get<DocumentListResponse>('/documents', {
    params,
  });
  return response.data;
};

// 문서 상세 조회
export const getDocument = async (id: string): Promise<TeamDocument> => {
  const response = await api.get<TeamDocument>(`/documents/${id}`);
  return response.data;
};

// 문서 생성
export const createDocument = async (
  data: CreateDocumentRequest
): Promise<TeamDocument> => {
  const response = await api.post<TeamDocument>('/documents', data);
  return response.data;
};

// 문서 수정
export const updateDocument = async (
  id: string,
  data: UpdateDocumentRequest
): Promise<TeamDocument> => {
  const response = await api.put<TeamDocument>(`/documents/${id}`, data);
  return response.data;
};

// 문서 삭제
export const deleteDocument = async (id: string): Promise<void> => {
  await api.delete(`/documents/${id}`);
};

// 즐겨찾기 토글
export const toggleFavorite = async (
  id: string
): Promise<{ isFavorite: boolean; message: string }> => {
  const response = await api.post<{ isFavorite: boolean; message: string }>(
    `/documents/${id}/favorite`
  );
  return response.data;
};

// 인기 태그 조회
export const getPopularTags = async (): Promise<PopularTag[]> => {
  const response = await api.get<PopularTag[]>('/documents/tags/popular');
  return response.data;
};
