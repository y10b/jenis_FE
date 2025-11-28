'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, BookOpen, MoreHorizontal, Trash2, Edit, Eye, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getMyRetrospectives,
  getSharedRetrospectives,
  deleteRetrospective,
  publishRetrospective,
} from '@/services/retrospectives';
import { CreateRetrospectiveDialog } from './create-retrospective-dialog';
import type { Retrospective, RetroType, Visibility } from '@/types';

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

export default function RetrospectivesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('my');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRetro, setSelectedRetro] = useState<Retrospective | null>(null);

  const { data: myRetros, isLoading: isMyLoading } = useQuery({
    queryKey: ['retrospectives', 'my'],
    queryFn: () => getMyRetrospectives({ limit: 20 }),
    enabled: activeTab === 'my',
  });

  const { data: sharedRetros, isLoading: isSharedLoading } = useQuery({
    queryKey: ['retrospectives', 'shared'],
    queryFn: () => getSharedRetrospectives({ limit: 20 }),
    enabled: activeTab === 'shared',
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRetrospective,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retrospectives'] });
      toast.success('회고가 삭제되었습니다.');
      setDeleteDialogOpen(false);
      setSelectedRetro(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '회고 삭제에 실패했습니다.';
      toast.error(message);
    },
  });

  const publishMutation = useMutation({
    mutationFn: publishRetrospective,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retrospectives'] });
      toast.success('회고가 발행되었습니다.');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '회고 발행에 실패했습니다.';
      toast.error(message);
    },
  });

  const handleDelete = () => {
    if (selectedRetro) {
      deleteMutation.mutate(selectedRetro.id);
    }
  };

  const isLoading = activeTab === 'my' ? isMyLoading : isSharedLoading;
  const retros = activeTab === 'my' ? myRetros?.data : sharedRetros?.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">회고</h1>
          <p className="text-muted-foreground">회고를 작성하고 공유하세요</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          새 회고
        </Button>
      </div>

      {/* 생성 다이얼로그 */}
      <CreateRetrospectiveDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my">내 회고</TabsTrigger>
          <TabsTrigger value="shared">공유받은 회고</TabsTrigger>
        </TabsList>

        <TabsContent value="my" className="mt-6">
          {isLoading ? (
            <RetroListSkeleton />
          ) : retros && retros.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {retros.map((retro) => (
                <RetroCard
                  key={retro.id}
                  retro={retro}
                  onDelete={() => {
                    setSelectedRetro(retro);
                    setDeleteDialogOpen(true);
                  }}
                  onPublish={() => publishMutation.mutate(retro.id)}
                  showActions
                />
              ))}
            </div>
          ) : (
            <EmptyState onCreateClick={() => setCreateDialogOpen(true)} />
          )}
        </TabsContent>

        <TabsContent value="shared" className="mt-6">
          {isLoading ? (
            <RetroListSkeleton />
          ) : retros && retros.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {retros.map((retro) => (
                <RetroCard key={retro.id} retro={retro} />
              ))}
            </div>
          ) : (
            <EmptyState message="공유받은 회고가 없습니다." />
          )}
        </TabsContent>
      </Tabs>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>회고 삭제</DialogTitle>
            <DialogDescription>
              이 회고를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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

function RetroCard({
  retro,
  onDelete,
  onPublish,
  showActions = false,
}: {
  retro: Retrospective;
  onDelete?: () => void;
  onPublish?: () => void;
  showActions?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg">
            {retro.title || `${retroTypeLabels[retro.type]} 회고`}
          </CardTitle>
          <CardDescription>
            {format(new Date(retro.periodStart), 'M/d', { locale: ko })} -{' '}
            {format(new Date(retro.periodEnd), 'M/d', { locale: ko })}
          </CardDescription>
        </div>
        {showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                보기
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                수정
              </DropdownMenuItem>
              {retro.isDraft && onPublish && (
                <DropdownMenuItem onClick={onPublish}>
                  <Share2 className="mr-2 h-4 w-4" />
                  발행
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline">{retroTypeLabels[retro.type]}</Badge>
          <Badge variant={retro.isDraft ? 'secondary' : 'default'}>
            {retro.isDraft ? '임시저장' : '발행됨'}
          </Badge>
          <Badge variant="outline">{visibilityLabels[retro.visibility]}</Badge>
        </div>
        {retro.user && (
          <div className="flex items-center gap-2 mt-4">
            <Avatar className="h-6 w-6">
              <AvatarImage src={retro.user.profileImageUrl || undefined} />
              <AvatarFallback className="text-xs">
                {retro.user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{retro.user.name}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({
  message = '작성한 회고가 없습니다.',
  onCreateClick,
}: {
  message?: string;
  onCreateClick?: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{message}</p>
        {onCreateClick && (
          <Button className="mt-4" onClick={onCreateClick}>
            <Plus className="mr-2 h-4 w-4" />
            새 회고 작성
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function RetroListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-3">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-14" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
