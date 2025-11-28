import api from '@/lib/api';
import type { DashboardOverview, TaskStatusStats, TaskPriorityStats, Task, TeamStats } from '@/types';

export interface DashboardQueryParams {
  teamId?: string;
  startDate?: string;
  endDate?: string;
}

export interface MyDashboard {
  myTasks: TaskStatusStats;
  myRecentActivity: {
    recentTasks: Task[];
    recentComments: any[];
  };
  myUpcomingDeadlines: Task[];
}

// 대시보드 개요 조회
export const getDashboardOverview = async (params?: DashboardQueryParams): Promise<DashboardOverview> => {
  const response = await api.get<DashboardOverview>('/dashboard/overview', { params });
  return response.data;
};

// 업무 상태 통계 조회
export const getTaskStatusStats = async (params?: DashboardQueryParams): Promise<TaskStatusStats> => {
  const response = await api.get<TaskStatusStats>('/dashboard/task-status', { params });
  return response.data;
};

// 업무 우선순위 통계 조회
export const getTaskPriorityStats = async (params?: DashboardQueryParams): Promise<TaskPriorityStats> => {
  const response = await api.get<TaskPriorityStats>('/dashboard/task-priority', { params });
  return response.data;
};

// 마감 임박 업무 조회
export const getUpcomingDeadlines = async (params?: DashboardQueryParams): Promise<Task[]> => {
  const response = await api.get<Task[]>('/dashboard/upcoming-deadlines', { params });
  return response.data;
};

// 팀 통계 조회
export const getTeamStats = async (): Promise<TeamStats[] | null> => {
  const response = await api.get<TeamStats[] | null>('/dashboard/team-stats');
  return response.data;
};

// 내 대시보드 조회
export const getMyDashboard = async (): Promise<MyDashboard> => {
  const response = await api.get<MyDashboard>('/dashboard/my');
  return response.data;
};
