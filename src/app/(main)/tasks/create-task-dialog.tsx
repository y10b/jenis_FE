'use client';

import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { createTask, CreateTaskRequest } from '@/services/tasks';
import { getTeamMembers } from '@/services/users';
import { getTeams } from '@/services/teams';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';
import type { TaskStatus, TaskPriority } from '@/types';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  teamId: string;
  dueDate: Date | undefined;
}

export function CreateTaskDialog({ open, onOpenChange }: CreateTaskDialogProps) {
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
      status: 'TODO',
      priority: 'P2',
      assigneeId: '',
      teamId: '',
    },
  });

  const dueDate = watch('dueDate');

  const { data: teamMembers } = useQuery({
    queryKey: ['users', 'team-members'],
    queryFn: getTeamMembers,
    enabled: open,
  });

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: getTeams,
    enabled: open && isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('업무가 생성되었습니다.');
      reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '업무 생성에 실패했습니다.';
      toast.error(message);
    },
  });

  const onSubmit = (data: FormData) => {
    const request: CreateTaskRequest = {
      title: data.title,
      description: data.description || undefined,
      status: data.status,
      priority: data.priority,
      assigneeId: data.assigneeId || undefined,
      teamId: data.teamId || undefined,
      dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
    };
    createMutation.mutate(request);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle>새 업무</DialogTitle>
          <DialogDescription>새로운 업무를 생성합니다</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm">제목 *</Label>
            <Input
              id="title"
              className="h-9"
              {...register('title', { required: '제목을 입력해주세요.' })}
              placeholder="업무 제목"
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm">설명</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="업무에 대한 설명"
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm">상태</Label>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value as TaskStatus)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">할 일</SelectItem>
                  <SelectItem value="IN_PROGRESS">진행 중</SelectItem>
                  <SelectItem value="REVIEW">검토 중</SelectItem>
                  <SelectItem value="DONE">완료</SelectItem>
                  <SelectItem value="CANCELLED">취소됨</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">우선순위</Label>
              <Select
                value={watch('priority')}
                onValueChange={(value) => setValue('priority', value as TaskPriority)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="P0">긴급 (P0)</SelectItem>
                  <SelectItem value="P1">높음 (P1)</SelectItem>
                  <SelectItem value="P2">보통 (P2)</SelectItem>
                  <SelectItem value="P3">낮음 (P3)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm">담당자</Label>
              <Select
                value={watch('assigneeId') || 'none'}
                onValueChange={(value) => setValue('assigneeId', value === 'none' ? '' : value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">없음</SelectItem>
                  {teamMembers?.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isAdmin && (
              <div className="space-y-2">
                <Label className="text-sm">팀</Label>
                <Select
                  value={watch('teamId') || 'none'}
                  onValueChange={(value) => setValue('teamId', value === 'none' ? '' : value)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">없음</SelectItem>
                    {teams?.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm">마감일</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full h-9 justify-start text-left font-normal',
                    !dueDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'yyyy년 M월 d일') : '마감일 선택'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => setValue('dueDate', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter className="gap-2 pt-4 border-t sm:gap-0">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" size="sm" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                '생성'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
