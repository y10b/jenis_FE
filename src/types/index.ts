// 사용자 역할
export type UserRole = 'OWNER' | 'HEAD' | 'LEAD' | 'ACTOR';

// 사용자 상태
export type UserStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE';

// 업무 상태
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED';

// 업무 우선순위
export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3';

// 업무 관계 유형
export type TaskRelationType = 'DEPENDS_ON' | 'BLOCKS' | 'RELATED';

// 스케줄 유형
export type ScheduleType = 'MEETING' | 'REMINDER' | 'REPORT';

// 회고 유형
export type RetroType = 'WEEKLY' | 'MID' | 'MONTHLY';

// 공개 범위
export type Visibility = 'PRIVATE' | 'TEAM' | 'ALL';

// 사용자
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  teamId: string | null;
  profileImageUrl: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  team?: Team;
}

// 팀
export interface Team {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  owner?: Pick<User, 'id' | 'name' | 'email'>;
  _count?: {
    members: number;
  };
}

// 업무
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  creatorId: string;
  assigneeId: string | null;
  teamId: string | null;
  createdAt: string;
  updatedAt: string;
  creator?: Pick<User, 'id' | 'name' | 'email' | 'profileImageUrl'>;
  assignee?: Pick<User, 'id' | 'name' | 'email' | 'profileImageUrl'> | null;
  team?: Pick<Team, 'id' | 'name'> | null;
}

// 업무 댓글
export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: Pick<User, 'id' | 'name' | 'email' | 'profileImageUrl'>;
}

// 업무 히스토리
export interface TaskHistory {
  id: string;
  taskId: string;
  userId: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user?: Pick<User, 'id' | 'name' | 'email'>;
}

// 스케줄
export interface Schedule {
  id: string;
  title: string;
  description: string | null;
  type: ScheduleType;
  scheduledAt: string | null;
  cronExpression: string | null;
  nextRunAt: string | null;
  isActive: boolean;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  creator?: Pick<User, 'id' | 'name' | 'email'>;
  teamSchedules?: { teamId: string; team: Pick<Team, 'id' | 'name'> }[];
}

// 회고
export interface Retrospective {
  id: string;
  userId: string;
  type: RetroType;
  title: string | null;
  content: string;
  periodStart: string;
  periodEnd: string;
  isDraft: boolean;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'name' | 'email' | 'profileImageUrl'>;
  _count?: {
    shares: number;
  };
}

// 알림
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string | null;
  payload: Record<string, any> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

// 페이지네이션 메타
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 페이지네이션 응답
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// API 에러 응답
export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

// 대시보드 통계
export interface TaskStatusStats {
  total: number;
  todo: number;
  inProgress: number;
  review: number;
  done: number;
  cancelled: number;
  completionRate: number;
}

export interface TaskPriorityStats {
  p0: number;
  p1: number;
  p2: number;
  p3: number;
}

export interface TeamStats {
  id: string;
  name: string;
  memberCount: number;
  taskCount: number;
  completedCount: number;
  completionRate: number;
}

export interface DashboardOverview {
  taskStats: TaskStatusStats;
  priorityStats: TaskPriorityStats;
  recentTasks: Task[];
  upcomingDeadlines: Task[];
  teamStats: TeamStats[] | null;
  activityStats: {
    totalTasks: number;
    totalComments: number;
  };
}
