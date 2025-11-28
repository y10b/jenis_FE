import api from '@/lib/api';
import type { Task, TaskComment, TaskHistory, PaginatedResponse, TaskStatus, TaskPriority, TaskRelationType } from '@/types';

export interface TaskQueryParams {
  page?: number;
  limit?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  teamId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assigneeId?: string;
  teamId?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  assigneeId?: string | null;
}

export interface AddRelationRequest {
  targetTaskId: string;
  type: TaskRelationType;
}

// 업무 목록 조회
export const getTasks = async (params?: TaskQueryParams): Promise<PaginatedResponse<Task>> => {
  const response = await api.get<PaginatedResponse<Task>>('/tasks', { params });
  return response.data;
};

// 내 업무 목록 조회
export const getMyTasks = async (params?: TaskQueryParams): Promise<PaginatedResponse<Task>> => {
  const response = await api.get<PaginatedResponse<Task>>('/tasks/my', { params });
  return response.data;
};

// 내가 생성한 업무 목록 조회
export const getCreatedTasks = async (params?: TaskQueryParams): Promise<PaginatedResponse<Task>> => {
  const response = await api.get<PaginatedResponse<Task>>('/tasks/created', { params });
  return response.data;
};

// 업무 상세 조회
export const getTask = async (id: string): Promise<Task & { comments: TaskComment[]; relationsFrom: any[]; relationsTo: any[] }> => {
  const response = await api.get(`/tasks/${id}`);
  return response.data;
};

// 업무 생성
export const createTask = async (data: CreateTaskRequest): Promise<Task> => {
  const response = await api.post<Task>('/tasks', data);
  return response.data;
};

// 업무 수정
export const updateTask = async (id: string, data: UpdateTaskRequest): Promise<Task> => {
  const response = await api.patch<Task>(`/tasks/${id}`, data);
  return response.data;
};

// 업무 삭제
export const deleteTask = async (id: string): Promise<void> => {
  await api.delete(`/tasks/${id}`);
};

// 댓글 추가
export const addComment = async (taskId: string, content: string): Promise<TaskComment> => {
  const response = await api.post<TaskComment>(`/tasks/${taskId}/comments`, { content });
  return response.data;
};

// 댓글 삭제
export const deleteComment = async (taskId: string, commentId: string): Promise<void> => {
  await api.delete(`/tasks/${taskId}/comments/${commentId}`);
};

// 업무 히스토리 조회
export const getTaskHistory = async (taskId: string): Promise<TaskHistory[]> => {
  const response = await api.get<TaskHistory[]>(`/tasks/${taskId}/history`);
  return response.data;
};

// 업무 관계 추가
export const addRelation = async (taskId: string, data: AddRelationRequest): Promise<any> => {
  const response = await api.post(`/tasks/${taskId}/relations`, data);
  return response.data;
};

// 업무 관계 삭제
export const removeRelation = async (taskId: string, relationId: string): Promise<void> => {
  await api.delete(`/tasks/${taskId}/relations/${relationId}`);
};
