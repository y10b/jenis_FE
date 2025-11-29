'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  Clock,
  ListTodo,
  TrendingUp,
  AlertTriangle,
  Users,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getDashboardOverview, getMyDashboard } from '@/services/dashboard';
import { getTasks } from '@/services/tasks';
import { getTeam } from '@/services/teams';
import { useAuthStore } from '@/stores/auth';
import type { TaskPriority, TaskStatus } from '@/types';

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  P0: { label: '긴급', className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800' },
  P1: { label: '높음', className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800' },
  P2: { label: '보통', className: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700' },
  P3: { label: '낮음', className: 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700' },
};

const statusConfig: Record<TaskStatus, { label: string; dotColor: string }> = {
  TODO: { label: '할 일', dotColor: 'bg-slate-400' },
  IN_PROGRESS: { label: '진행 중', dotColor: 'bg-blue-500' },
  REVIEW: { label: '검토 중', dotColor: 'bg-violet-500' },
  DONE: { label: '완료', dotColor: 'bg-emerald-500' },
  CANCELLED: { label: '취소됨', dotColor: 'bg-slate-300' },
};

type TaskFilterType = 'all' | 'TODO' | 'IN_PROGRESS' | 'DONE';

const filterLabels: Record<TaskFilterType, string> = {
  all: '전체 업무',
  TODO: '할 일',
  IN_PROGRESS: '진행 중',
  DONE: '완료',
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'OWNER' || user?.role === 'HEAD';
  const [selectedFilter, setSelectedFilter] = useState<TaskFilterType | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const { data: overview, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => getDashboardOverview(),
    enabled: isAdmin,
  });

  const { data: myDashboard, isLoading: isMyDashboardLoading } = useQuery({
    queryKey: ['dashboard', 'my'],
    queryFn: getMyDashboard,
  });

  const { data: filteredTasks, isLoading: isTasksLoading } = useQuery({
    queryKey: ['tasks', 'filtered', selectedFilter],
    queryFn: () => getTasks({
      status: selectedFilter === 'all' ? undefined : selectedFilter as TaskStatus,
      limit: 50,
    }),
    enabled: !!selectedFilter,
  });

  const { data: selectedTeam, isLoading: isTeamLoading } = useQuery({
    queryKey: ['team', selectedTeamId],
    queryFn: () => getTeam(selectedTeamId!),
    enabled: !!selectedTeamId,
  });

  const { data: teamTasks, isLoading: isTeamTasksLoading } = useQuery({
    queryKey: ['tasks', 'team', selectedTeamId],
    queryFn: () => getTasks({
      teamId: selectedTeamId!,
      status: 'IN_PROGRESS',
      limit: 50,
    }),
    enabled: !!selectedTeamId,
  });

  const isLoading = isOverviewLoading || isMyDashboardLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const stats = isAdmin ? overview?.taskStats : myDashboard?.myTasks;

  return (
    <div className="page-container section-gap">
      {/* Header */}
      <header className="section-header">
        <h1 className="text-2xl font-semibold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground mt-1">
          {user?.name}님, 오늘의 업무 현황입니다
        </p>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button
          onClick={() => setSelectedFilter('all')}
          className="stat-card text-left hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="stat-label">전체 업무</span>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="stat-value">{stats?.total || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">
            완료율 {stats?.completionRate || 0}%
          </p>
        </button>

        <button
          onClick={() => setSelectedFilter('TODO')}
          className="stat-card text-left hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="stat-label">할 일</span>
            <Clock className="h-4 w-4 text-slate-400" />
          </div>
          <p className="stat-value">{stats?.todo || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">대기 중</p>
        </button>

        <button
          onClick={() => setSelectedFilter('IN_PROGRESS')}
          className="stat-card text-left hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="stat-label">진행 중</span>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </div>
          <p className="stat-value">{stats?.inProgress || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">작업 중</p>
        </button>

        <button
          onClick={() => setSelectedFilter('DONE')}
          className="stat-card text-left hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="stat-label">완료</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="stat-value">{stats?.done || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">완료됨</p>
        </button>
      </section>

      {/* Tasks Section */}
      <section className="grid gap-4 lg:gap-5 md:grid-cols-2">
        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-base">마감 임박</CardTitle>
            </div>
            <CardDescription>7일 이내 마감</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {(isAdmin ? overview?.upcomingDeadlines : myDashboard?.myUpcomingDeadlines)?.slice(0, 5).map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="flex items-center gap-3 p-3 -mx-1 rounded-md hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" />
                      {task.dueDate && format(new Date(task.dueDate), 'M월 d일 (EEE)', { locale: ko })}
                    </p>
                  </div>
                  <span className={`badge-status border ${priorityConfig[task.priority].className}`}>
                    {priorityConfig[task.priority].label}
                  </span>
                </Link>
              )) || (
                <div className="empty-state py-8">
                  <CheckCircle2 className="empty-state-icon h-8 w-8" />
                  <p className="text-sm text-muted-foreground">마감 임박 업무 없음</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">최근 업무</CardTitle>
            </div>
            <CardDescription>최근 업데이트</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {(isAdmin ? overview?.recentTasks : myDashboard?.myRecentActivity?.recentTasks)?.slice(0, 5).map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="flex items-center gap-3 p-3 -mx-1 rounded-md hover:bg-muted/50 transition-colors group"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusConfig[task.status].dotColor}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {statusConfig[task.status].label}
                    </p>
                  </div>
                  <span className={`badge-status border ${priorityConfig[task.priority].className}`}>
                    {priorityConfig[task.priority].label}
                  </span>
                </Link>
              )) || (
                <div className="empty-state py-8">
                  <ListTodo className="empty-state-icon h-8 w-8" />
                  <p className="text-sm text-muted-foreground">최근 업무 없음</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Team Stats (Admin Only) */}
      {isAdmin && overview?.teamStats && overview.teamStats.length > 0 && (
        <section>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">팀별 현황</CardTitle>
              </div>
              <CardDescription>클릭하여 상세 보기</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {overview.teamStats.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeamId(team.id)}
                    className="p-4 rounded-lg border text-left hover:border-primary/30 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium truncate">{team.name}</h4>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {team.memberCount}명
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">진행률</span>
                        <span className="font-medium">{team.completionRate}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${team.completionRate}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {team.completedCount} / {team.taskCount} 완료
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Task List Modal */}
      <Dialog open={!!selectedFilter} onOpenChange={(open) => !open && setSelectedFilter(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle>{selectedFilter && filterLabels[selectedFilter]}</DialogTitle>
            <DialogDescription>
              {selectedFilter === 'all' && '모든 업무 목록입니다'}
              {selectedFilter === 'TODO' && '아직 시작하지 않은 업무입니다'}
              {selectedFilter === 'IN_PROGRESS' && '현재 진행 중인 업무입니다'}
              {selectedFilter === 'DONE' && '완료된 업무입니다'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4 -mx-6 px-6">
            {isTasksLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredTasks?.data && filteredTasks.data.length > 0 ? (
              <div className="space-y-2">
                {filteredTasks.data.map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    onClick={() => setSelectedFilter(null)}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/30 hover:bg-muted/30 transition-colors group"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusConfig[task.status].dotColor}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {task.assignee && (
                          <div className="flex items-center gap-1.5">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={task.assignee.profileImageUrl || undefined} />
                              <AvatarFallback className="text-[10px]">
                                {task.assignee.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">
                              {task.assignee.name}
                            </span>
                          </div>
                        )}
                        {task.dueDate && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(task.dueDate), 'M/d', { locale: ko })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">{statusConfig[task.status].label}</span>
                      <span className={`badge-status border ${priorityConfig[task.priority].className}`}>
                        {priorityConfig[task.priority].label}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <ListTodo className="empty-state-icon" />
                <p className="empty-state-description">해당하는 업무가 없습니다</p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              총 {filteredTasks?.meta?.total || 0}개
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/tasks" onClick={() => setSelectedFilter(null)} className="gap-1">
                전체 보기
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Team Detail Modal */}
      <Dialog open={!!selectedTeamId} onOpenChange={(open) => !open && setSelectedTeamId(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <DialogTitle>{selectedTeam?.name || '팀 정보'}</DialogTitle>
            </div>
            <DialogDescription>
              {selectedTeam?.description || '팀원 및 진행 중인 업무'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 -mx-6 px-6 space-y-6">
            {/* Team Members */}
            <div>
              <h3 className="text-sm font-medium mb-3">
                팀원 ({selectedTeam?.members?.length || 0}명)
              </h3>
              {isTeamLoading ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-14" />
                  ))}
                </div>
              ) : selectedTeam?.members && selectedTeam.members.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedTeam.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-lg border"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={member.profileImageUrl || undefined} />
                        <AvatarFallback className="text-sm">{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded flex-shrink-0">
                        {member.role === 'OWNER' ? '대표' :
                         member.role === 'HEAD' ? '헤드' :
                         member.role === 'LEAD' ? '리드' : '멤버'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">팀원이 없습니다</p>
              )}
            </div>

            {/* Team Tasks */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                진행 중인 업무 ({teamTasks?.meta?.total || 0}개)
              </h3>
              {isTeamTasksLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-14" />
                  ))}
                </div>
              ) : teamTasks?.data && teamTasks.data.length > 0 ? (
                <div className="space-y-2">
                  {teamTasks.data.map((task) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      onClick={() => setSelectedTeamId(null)}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/30 hover:bg-muted/30 transition-colors group"
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusConfig[task.status].dotColor}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {task.assignee && (
                            <span className="text-xs text-muted-foreground">
                              {task.assignee.name}
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(task.dueDate), 'M/d', { locale: ko })}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`badge-status border ${priorityConfig[task.priority].className}`}>
                        {priorityConfig[task.priority].label}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-6 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mb-2 text-emerald-500" />
                  <p className="text-sm">진행 중인 업무가 없습니다</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" size="sm" onClick={() => setSelectedTeamId(null)}>
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="page-container section-gap">
      <header className="section-header">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-5 w-56 mt-2" />
      </header>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="stat-card">
            <Skeleton className="h-4 w-16 mb-3" />
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-3 w-20 mt-2" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:gap-5 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {[...Array(3)].map((_, j) => (
                <Skeleton key={j} className="h-14" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
