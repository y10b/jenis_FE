'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar, MoreHorizontal, Trash2, Edit, Play, Pause } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { getSchedules, deleteSchedule, toggleScheduleActive } from '@/services/schedules';
import { CreateScheduleDialog } from './create-schedule-dialog';
import type { Schedule, ScheduleType } from '@/types';

const scheduleTypeLabels: Record<ScheduleType, string> = {
  MEETING: '회의',
  REMINDER: '리마인더',
  REPORT: '리포트',
};

export default function SchedulesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['schedules', { page }],
    queryFn: () => getSchedules({ page, limit: 20 }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('스케줄이 삭제되었습니다.');
      setDeleteDialogOpen(false);
      setSelectedSchedule(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '스케줄 삭제에 실패했습니다.';
      toast.error(message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: toggleScheduleActive,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success(data.isActive ? '스케줄이 활성화되었습니다.' : '스케줄이 비활성화되었습니다.');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '스케줄 상태 변경에 실패했습니다.';
      toast.error(message);
    },
  });

  const handleDelete = () => {
    if (selectedSchedule) {
      deleteMutation.mutate(selectedSchedule.id);
    }
  };

  if (isLoading) {
    return <SchedulesPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">스케줄</h1>
          <p className="text-muted-foreground">반복 작업과 예약 작업을 관리하세요</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          새 스케줄
        </Button>
      </div>

      {/* 생성 다이얼로그 */}
      <CreateScheduleDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제목</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>다음 실행</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>생성자</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{schedule.title}</p>
                      {schedule.description && (
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {schedule.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {scheduleTypeLabels[schedule.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {schedule.nextRunAt ? (
                      <span className="text-sm">
                        {format(new Date(schedule.nextRunAt), 'M/d HH:mm', { locale: ko })}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={schedule.isActive ? 'default' : 'secondary'}>
                      {schedule.isActive ? '활성' : '비활성'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{schedule.creator?.name}</span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => toggleMutation.mutate(schedule.id)}
                        >
                          {schedule.isActive ? (
                            <>
                              <Pause className="mr-2 h-4 w-4" />
                              비활성화
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              활성화
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          수정
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedSchedule(schedule);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {data?.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    스케줄이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 페이지네이션 */}
      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            이전
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {data.meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
            disabled={page === data.meta.totalPages}
          >
            다음
          </Button>
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>스케줄 삭제</DialogTitle>
            <DialogDescription>
              &apos;{selectedSchedule?.title}&apos; 스케줄을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SchedulesPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제목</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>다음 실행</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>생성자</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48 mt-1" />
                  </TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
