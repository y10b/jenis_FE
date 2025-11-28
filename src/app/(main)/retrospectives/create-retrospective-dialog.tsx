'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

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
import { createRetrospective, CreateRetrospectiveRequest } from '@/services/retrospectives';
import { cn } from '@/lib/utils';
import type { RetroType, Visibility } from '@/types';

interface CreateRetrospectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  type: RetroType;
  title: string;
  content: string;
  periodStart: Date | undefined;
  periodEnd: Date | undefined;
  visibility: Visibility;
}

const retroTypeLabels: Record<RetroType, string> = {
  WEEKLY: '주간',
  MID: '중간',
  MONTHLY: '월간',
};

const visibilityLabels: Record<Visibility, string> = {
  PRIVATE: '비공개',
  TEAM: '팀 공개',
  ALL: '전체 공개',
};

export function CreateRetrospectiveDialog({ open, onOpenChange }: CreateRetrospectiveDialogProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      type: 'WEEKLY',
      title: '',
      content: '',
      visibility: 'PRIVATE',
    },
  });

  const type = watch('type');
  const periodStart = watch('periodStart');
  const periodEnd = watch('periodEnd');

  // 회고 유형에 따라 자동으로 기간 설정
  const handleTypeChange = (newType: RetroType) => {
    setValue('type', newType);

    const now = new Date();
    let start: Date;
    let end: Date;

    switch (newType) {
      case 'WEEKLY':
        // 지난 주
        start = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        end = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        break;
      case 'MID':
        // 이번 달 1일 ~ 15일 또는 16일 ~ 말일
        const dayOfMonth = now.getDate();
        if (dayOfMonth <= 15) {
          // 지난 달 후반
          const lastMonth = subMonths(now, 1);
          start = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 16);
          end = endOfMonth(lastMonth);
        } else {
          // 이번 달 전반
          start = startOfMonth(now);
          end = new Date(now.getFullYear(), now.getMonth(), 15);
        }
        break;
      case 'MONTHLY':
        // 지난 달
        const lastMonth = subMonths(now, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      default:
        start = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        end = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    }

    setValue('periodStart', start);
    setValue('periodEnd', end);
    setValue('title', `${retroTypeLabels[newType]} 회고 (${format(start, 'M/d')} - ${format(end, 'M/d')})`);
  };

  const createMutation = useMutation({
    mutationFn: createRetrospective,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retrospectives'] });
      toast.success('회고가 생성되었습니다.');
      reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '회고 생성에 실패했습니다.';
      toast.error(message);
    },
  });

  const onSubmit = (data: FormData, isDraft: boolean) => {
    if (!data.periodStart || !data.periodEnd) {
      toast.error('회고 기간을 선택해주세요.');
      return;
    }

    const request: CreateRetrospectiveRequest = {
      type: data.type,
      title: data.title || undefined,
      content: data.content,
      periodStart: format(data.periodStart, 'yyyy-MM-dd'),
      periodEnd: format(data.periodEnd, 'yyyy-MM-dd'),
      isDraft,
      visibility: data.visibility,
    };
    createMutation.mutate(request);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      // 다이얼로그 열릴 때 주간 회고로 초기화
      handleTypeChange('WEEKLY');
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>새 회고</DialogTitle>
          <DialogDescription>
            기간을 선택하고 회고 내용을 작성하세요.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4">
          {/* 회고 유형 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>회고 유형</Label>
              <Select
                value={type}
                onValueChange={(value) => handleTypeChange(value as RetroType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">주간 회고</SelectItem>
                  <SelectItem value="MID">중간 회고</SelectItem>
                  <SelectItem value="MONTHLY">월간 회고</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>공개 범위</Label>
              <Select
                value={watch('visibility')}
                onValueChange={(value) => setValue('visibility', value as Visibility)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRIVATE">비공개</SelectItem>
                  <SelectItem value="TEAM">팀 공개</SelectItem>
                  <SelectItem value="ALL">전체 공개</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 기간 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>시작일</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !periodStart && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {periodStart ? format(periodStart, 'yyyy년 M월 d일', { locale: ko }) : '시작일 선택'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={periodStart}
                    onSelect={(date) => setValue('periodStart', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>종료일</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !periodEnd && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {periodEnd ? format(periodEnd, 'yyyy년 M월 d일', { locale: ko }) : '종료일 선택'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={periodEnd}
                    onSelect={(date) => setValue('periodEnd', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* 제목 */}
          <div className="space-y-2">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="회고 제목 (선택사항)"
            />
          </div>

          {/* 내용 */}
          <div className="space-y-2">
            <Label htmlFor="content">내용 *</Label>
            <Textarea
              id="content"
              {...register('content', { required: '내용을 입력해주세요.' })}
              placeholder="이번 기간 동안 무엇을 했고, 무엇을 느꼈나요?"
              rows={8}
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSubmit((data) => onSubmit(data, true))}
              disabled={createMutation.isPending}
            >
              임시저장
            </Button>
            <Button
              type="button"
              onClick={handleSubmit((data) => onSubmit(data, false))}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? '저장 중...' : '발행'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
