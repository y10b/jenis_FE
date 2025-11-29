import api from '@/lib/api';
import type { Team, User } from '@/types';

export interface CreateTeamRequest {
  name: string;
  description?: string;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
}

export interface AddMemberRequest {
  userId: string;
}

export interface CreateShareRequest {
  toTeamId: string;
  shareTasks: boolean;
  shareSchedules: boolean;
}

export interface TeamShare {
  id: string;
  fromTeamId: string;
  toTeamId: string;
  shareTasks: boolean;
  shareSchedules: boolean;
  createdAt: string;
  fromTeam?: Pick<Team, 'id' | 'name'>;
  toTeam?: Pick<Team, 'id' | 'name'>;
}

export interface TeamShares {
  sharingTo: TeamShare[];
  receivingFrom: TeamShare[];
}

// 팀 목록 조회
export const getTeams = async (): Promise<Team[]> => {
  const response = await api.get<Team[]>('/teams');
  return response.data;
};

// 팀 상세 조회
export const getTeam = async (id: string): Promise<Team & { members: User[] }> => {
  const response = await api.get(`/teams/${id}`);
  return response.data;
};

// 내 팀 조회
export const getMyTeam = async (): Promise<(Team & { members: User[] }) | null> => {
  const response = await api.get('/teams/my');
  return response.data;
};

// 팀 생성
export const createTeam = async (data: CreateTeamRequest): Promise<Team> => {
  const response = await api.post<Team>('/teams', data);
  return response.data;
};

// 팀 수정
export const updateTeam = async (id: string, data: UpdateTeamRequest): Promise<Team> => {
  const response = await api.patch<Team>(`/teams/${id}`, data);
  return response.data;
};

// 팀 삭제
export const deleteTeam = async (id: string): Promise<void> => {
  await api.delete(`/teams/${id}`);
};

// 팀 멤버 추가
export const addMember = async (teamId: string, data: AddMemberRequest): Promise<User> => {
  const response = await api.post<User>(`/teams/${teamId}/members`, data);
  return response.data;
};

// 팀 멤버 제거
export const removeMember = async (teamId: string, userId: string): Promise<void> => {
  await api.delete(`/teams/${teamId}/members/${userId}`);
};

// 팀 멤버 이동
export const transferMember = async (
  fromTeamId: string,
  userId: string,
  toTeamId: string
): Promise<User> => {
  const response = await api.patch<User>(
    `/teams/${fromTeamId}/members/${userId}/transfer/${toTeamId}`
  );
  return response.data;
};

// 팀 공유 설정 조회
export const getTeamShares = async (teamId: string): Promise<TeamShares> => {
  const response = await api.get<TeamShares>(`/teams/${teamId}/shares`);
  return response.data;
};

// 팀 공유 설정 생성
export const createTeamShare = async (teamId: string, data: CreateShareRequest): Promise<TeamShare> => {
  const response = await api.post<TeamShare>(`/teams/${teamId}/shares`, data);
  return response.data;
};

// 팀 공유 설정 삭제
export const deleteTeamShare = async (shareId: string): Promise<void> => {
  await api.delete(`/teams/shares/${shareId}`);
};
