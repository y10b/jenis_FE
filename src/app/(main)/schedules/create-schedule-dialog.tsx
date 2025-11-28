'use client';

import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { createSchedule, CreateScheduleRequest } from '@/services/schedules';
import { getTeams } from '@/services/teams';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';
import type { ScheduleType } from '@/types';

interface CreateScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  title: string;
  description: string;
  type: ScheduleType;
  scheduledAt: Date | undefined;
  scheduledTime: string;
  cronExpression: string;
  teamIds: string[];
}

const scheduleTypeLabels: Record<ScheduleType, { label: string; description: string }> = {
  MEETING: { label: '회의', description: '팀 회의 또는 미팅 일정' },
  REMINDER: { label: '리마인더', description: '특정 시간에 알림을 받을 일정' },
  REPORT: { label: '리포트', description: '정기 리포트 생성 일정' },
};

export function CreateScheduleDialog({ open, onOpenChange }: CreateScheduleDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'OWNER' || user?.role === 'HEAD';

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      title: '',
      description: '',
      type: 'MEETING',
      scheduledTime: '09:00',
      cronExpression: '',
      teamIds: [],
    },
  });

  const type = watch('type');
  const scheduledAt = watch('scheduledAt');
  const teamIds = watch('teamIds');

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: getTeams,
    enabled: open && isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: createSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('스케줄이 생성되었습니다.');
      reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '스케줄 생성에 실패했습니다.';
      toast.error(message);
    },
  });

  const onSubmit = (data: FormData) => {
    let scheduledAtISO: string | undefined;

    if (data.scheduledAt && data.scheduledTime) {
      const [hours, minutes] = data.scheduledTime.split(':').map(Number);
      const dateWithTime = new Date(data.scheduledAt);
      dateWithTime.setHours(hours, minutes, 0, 0);
      scheduledAtISO = dateWithTime.toISOString();
    }

    const request: CreateScheduleRequest = {
      title: data.title,
      description: data.description || undefined,
      type: data.type,
      scheduledAt: scheduledAtISO,
      cronExpression: data.cronExpression || undefined,
      teamIds: data.teamIds.length > 0 ? data.teamIds : undefined,
    };
    createMutation.mutate(request);
  };

  const handleTeamToggle = (teamId: string) => {
    const current = teamIds || [];
    if (current.includes(teamId)) {
      setValue('teamIds', current.filter((id) => id !== teamId));
    } else {
      setValue('teamIds', [...current, teamId]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>새 스케줄</DialogTitle>
          <DialogDescription>
            새로운 스케줄을 생성합니다.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 제목 */}
          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              {...register('title', { required: '제목을 입력해주세요.' })}
              placeholder="스케줄 제목을 입력하세요"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* 설명 */}
          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="스케줄에 대한 설명을 입력하세요"
              rows={2}
            />
          </div>

          {/* 유형 */}
          <div className="space-y-2">
            <Label>유형</Label>
            <Select
              value={type}
              onValueChange={(value) => setValue('type', value as ScheduleType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(scheduleTypeLabels).map(([key, { label, description }]) => (
                  <SelectItem key={key} value={key}>
                    <div>
                      <span>{label}</span>
                      <span className="text-muted-foreground text-xs ml-2">
                        {description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 날짜 & 시간 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>날짜</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !scheduledAt && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledAt
                      ? format(scheduledAt, 'yyyy년 M월 d일', { locale: ko })
                      : '날짜 선택'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={scheduledAt}
                    onSelect={(date) => setValue('scheduledAt', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">시간</Label>
              <Input
                id="time"
                type="time"
                {...register('scheduledTime')}
              />
            </div>
          </div>

          {/* CRON 표현식 (선택사항) */}
          <div className="space-y-2">
            <Label htmlFor="cron">CRON 표현식 (반복 일정)</Label>
            <Input
              id="cron"
              {...register('cronExpression')}
              placeholder="예: 0 9 * * 1 (매주 월요일 9시)"
            />
            <p className="text-xs text-muted-foreground">
              반복 일정을 설정하려면 CRON 표현식을 입력하세요.
            </p>
          </div>

          {/* 팀 선택 (관리자) */}
          {isAdmin && teams && teams.length > 0 && (
            <div className="space-y-2">
              <Label>대상 팀</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-32 overflow-y-auto">
                {teams.map((team) => (
                  <div key={team.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`team-${team.id}`}
                      checked={teamIds?.includes(team.id)}
                      onCheckedChange={() => handleTeamToggle(team.id)}
                    />
                    <label
                      htmlFor={`team-${team.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {team.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? '생성 중...' : '생성'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
