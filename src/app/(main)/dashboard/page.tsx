'use client';

import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  Clock,
  ListTodo,
  Pause,
  TrendingUp,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getDashboardOverview, getMyDashboard } from '@/services/dashboard';
import { useAuthStore } from '@/stores/auth';
import type { TaskPriority, TaskStatus } from '@/types';

const priorityLabels: Record<TaskPriority, { label: string; variant: 'destructive' | 'default' | 'secondary' | 'outline' }> = {
  P0: { label: '긴급', variant: 'destructive' },
  P1: { label: '높음', variant: 'default' },
  P2: { label: '보통', variant: 'secondary' },
  P3: { label: '낮음', variant: 'outline' },
};

const statusLabels: Record<TaskStatus, { label: string; color: string }> = {
  TODO: { label: '할 일', color: 'bg-gray-500' },
  IN_PROGRESS: { label: '진행 중', color: 'bg-blue-500' },
  REVIEW: { label: '검토 중', color: 'bg-purple-500' },
  DONE: { label: '완료', color: 'bg-green-500' },
  CANCELLED: { label: '취소됨', color: 'bg-red-500' },
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'OWNER' || user?.role === 'HEAD';

  const { data: overview, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => getDashboardOverview(),
    enabled: isAdmin,
  });

  const { data: myDashboard, isLoading: isMyDashboardLoading } = useQuery({
    queryKey: ['dashboard', 'my'],
    queryFn: getMyDashboard,
  });

  const isLoading = isOverviewLoading || isMyDashboardLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const stats = isAdmin ? overview?.taskStats : myDashboard?.myTasks;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">대시보드</h1>
        <p className="text-muted-foreground">
          안녕하세요, {user?.name}님! 오늘의 업무 현황입니다.
        </p>
      </div>

      {/* 업무 상태 통계 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 업무</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              완료율 {stats?.completionRate || 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">할 일</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todo || 0}</div>
            <p className="text-xs text-muted-foreground">대기 중인 업무</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">진행 중</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inProgress || 0}</div>
            <p className="text-xs text-muted-foreground">현재 진행 중인 업무</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">완료</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.done || 0}</div>
            <p className="text-xs text-muted-foreground">완료된 업무</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 마감 임박 업무 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              마감 임박 업무
            </CardTitle>
            <CardDescription>7일 이내 마감 예정인 업무</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(isAdmin ? overview?.upcomingDeadlines : myDashboard?.myUpcomingDeadlines)?.slice(0, 5).map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{task.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {task.dueDate && format(new Date(task.dueDate), 'M월 d일 (EEE)', { locale: ko })}
                    </p>
                  </div>
                  <Badge variant={priorityLabels[task.priority].variant}>
                    {priorityLabels[task.priority].label}
                  </Badge>
                </Link>
              )) || (
                <p className="text-center text-muted-foreground py-4">
                  마감 임박 업무가 없습니다.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 최근 업무 */}
        <Card>
          <CardHeader>
            <CardTitle>최근 업무</CardTitle>
            <CardDescription>최근에 업데이트된 업무</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(isAdmin ? overview?.recentTasks : myDashboard?.myRecentActivity?.recentTasks)?.slice(0, 5).map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full ${statusLabels[task.status].color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {statusLabels[task.status].label}
                      </p>
                    </div>
                  </div>
                  <Badge variant={priorityLabels[task.priority].variant}>
                    {priorityLabels[task.priority].label}
                  </Badge>
                </Link>
              )) || (
                <p className="text-center text-muted-foreground py-4">
                  최근 업무가 없습니다.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 팀 통계 (관리자용) */}
      {isAdmin && overview?.teamStats && overview.teamStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              팀별 현황
            </CardTitle>
            <CardDescription>각 팀의 업무 진행 상황</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {overview.teamStats.map((team) => (
                <div
                  key={team.id}
                  className="p-4 rounded-lg border space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{team.name}</h4>
                    <Badge variant="outline">{team.memberCount}명</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">업무</span>
                    <span>{team.completedCount} / {team.taskCount}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${team.completionRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-right">
                    완료율 {team.completionRate}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-5 w-64 mt-2" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(3)].map((_, j) => (
                <Skeleton key={j} className="h-16 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
