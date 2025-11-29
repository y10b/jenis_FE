'use client';

import { useState } from 'react';
import { Bell, Moon, Sun, LogIn, LogOut, Clock } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getUnreadCount } from '@/services/notifications';
import { getTodayStatus, createAttendance, AttendanceType } from '@/services/attendance';

export function Header() {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [attendanceType, setAttendanceType] = useState<AttendanceType>('CHECK_IN');
  const [note, setNote] = useState('');

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadCount,
    refetchInterval: 30000,
  });

  const { data: todayStatus } = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: getTodayStatus,
  });

  const attendanceMutation = useMutation({
    mutationFn: createAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today'] });
      const typeLabel = attendanceType === 'CHECK_IN' ? '출근' : '퇴근';
      toast.success(`${typeLabel} 처리되었습니다.`);
      setAttendanceDialogOpen(false);
      setNote('');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || '처리에 실패했습니다.';
      toast.error(message);
    },
  });

  const handleAttendanceClick = (type: AttendanceType) => {
    setAttendanceType(type);
    setAttendanceDialogOpen(true);
  };

  const handleAttendanceSubmit = () => {
    attendanceMutation.mutate({
      type: attendanceType,
      note: note || undefined,
    });
  };

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />

        {/* Attendance Status */}
        {todayStatus && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            {todayStatus.isCheckedIn && todayStatus.checkIn && (
              <>
                <Clock className="h-3 w-3" />
                <span>{format(new Date(todayStatus.checkIn.createdAt), 'HH:mm')}</span>
              </>
            )}
            {todayStatus.isCheckedOut && todayStatus.checkOut && (
              <>
                <span className="text-muted-foreground/50">-</span>
                <span>{format(new Date(todayStatus.checkOut.createdAt), 'HH:mm')}</span>
              </>
            )}
          </div>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-1.5">
          {/* Attendance Buttons */}
          {!todayStatus?.isCheckedIn ? (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleAttendanceClick('CHECK_IN')}
              className="h-8 gap-1.5 text-xs font-medium"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">출근</span>
            </Button>
          ) : !todayStatus?.isCheckedOut ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAttendanceClick('CHECK_OUT')}
              className="h-8 gap-1.5 text-xs font-medium"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">퇴근</span>
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1.5 rounded-md">
              근무 완료
            </span>
          )}

          <Separator orientation="vertical" className="h-4 mx-1" />

          {/* Notifications */}
          <Link href="/notifications">
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="h-4 w-4" />
              {unreadData && unreadData.count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium flex items-center justify-center">
                  {unreadData.count > 99 ? '99+' : unreadData.count}
                </span>
              )}
            </Button>
          </Link>

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">테마 변경</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onClick={() => setTheme('light')} className="text-sm">
                라이트
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')} className="text-sm">
                다크
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')} className="text-sm">
                시스템
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Attendance Dialog */}
      <Dialog open={attendanceDialogOpen} onOpenChange={setAttendanceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {attendanceType === 'CHECK_IN' ? '출근 기록' : '퇴근 기록'}
            </DialogTitle>
            <DialogDescription>
              {attendanceType === 'CHECK_IN'
                ? '출근을 기록합니다. 팀 리드와 대표에게 알림이 전송됩니다.'
                : '퇴근을 기록합니다. 팀 리드와 대표에게 알림이 전송됩니다.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="note" className="text-sm">메모 (선택)</Label>
              <Input
                id="note"
                placeholder="예: 재택근무, 외근 등"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAttendanceDialogOpen(false)}
            >
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleAttendanceSubmit}
              disabled={attendanceMutation.isPending}
            >
              {attendanceMutation.isPending
                ? '처리 중...'
                : attendanceType === 'CHECK_IN'
                ? '출근하기'
                : '퇴근하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
