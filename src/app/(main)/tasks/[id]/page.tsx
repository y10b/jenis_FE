'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit2,
  MessageSquare,
  Save,
  Trash2,
  User,
  Users,
  History,
  X,
  Send,
  CalendarIcon,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getTask,
  updateTask,
  deleteTask,
  addComment,
  deleteComment,
  getTaskHistory,
  UpdateTaskRequest,
} from '@/services/tasks';
import { getTeamMembers } from '@/services/users';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';
import type { TaskStatus, TaskPriority, TaskComment, TaskHistory } from '@/types';

const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'TODO', label: '할 일', color: 'bg-gray-500' },
  { value: 'IN_PROGRESS', label: '진행 중', color: 'bg-blue-500' },
  { value: 'REVIEW', label: '검토 중', color: 'bg-purple-500' },
  { value: 'DONE', label: '완료', color: 'bg-green-500' },
  { value: 'CANCELLED', label: '취소됨', color: 'bg-red-500' },
];

const priorityOptions: { value: TaskPriority; label: string; variant: 'destructive' | 'default' | 'secondary' | 'outline' }[] = [
  { value: 'P0', label: '긴급', variant: 'destructive' },
  { value: 'P1', label: '높음', variant: 'default' },
  { value: 'P2', label: '보통', variant: 'secondary' },
  { value: 'P3', label: '낮음', variant: 'outline' },
];

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const taskId = params.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState('');

  // 편집 폼 상태
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: '' as TaskStatus,
    priority: '' as TaskPriority,
    dueDate: null as Date | null,
    assigneeId: '',
  });

  const { data: task, isLoading, error } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => getTask(taskId),
  });

  const { data: history } = useQuery({
    queryKey: ['task', taskId, 'history'],
    queryFn: () => getTaskHistory(taskId),
    enabled: !!task,
  });

  const { data: teamMembers } = useQuery({
    queryKey: ['users', 'team-members'],
    queryFn: getTeamMembers,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateTaskRequest) => updateTask(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('업무가 수정되었습니다.');
      setIsEditing(false);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '업무 수정에 실패했습니다.';
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('업무가 삭제되었습니다.');
      router.push('/tasks');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '업무 삭제에 실패했습니다.';
      toast.error(message);
    },
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => addComment(taskId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      toast.success('댓글이 추가되었습니다.');
      setNewComment('');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '댓글 추가에 실패했습니다.';
      toast.error(message);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(taskId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      toast.success('댓글이 삭제되었습니다.');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '댓글 삭제에 실패했습니다.';
      toast.error(message);
    },
  });

  const handleStartEdit = () => {
    if (task) {
      setEditForm({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        assigneeId: task.assigneeId || '',
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updateMutation.mutate({
      title: editForm.title,
      description: editForm.description || undefined,
      status: editForm.status,
      priority: editForm.priority,
      dueDate: editForm.dueDate ? editForm.dueDate.toISOString() : null,
      assigneeId: editForm.assigneeId || null,
    });
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      commentMutation.mutate(newComment.trim());
    }
  };

  const getStatusInfo = (status: TaskStatus) => {
    return statusOptions.find((s) => s.value === status) || statusOptions[0];
  };

  const getPriorityInfo = (priority: TaskPriority) => {
    return priorityOptions.find((p) => p.value === priority) || priorityOptions[2];
  };

  if (isLoading) {
    return <TaskDetailSkeleton />;
  }

  if (error || !task) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-4">업무를 찾을 수 없습니다.</p>
        <Button variant="outline" asChild>
          <Link href="/tasks">
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로 돌아가기
          </Link>
        </Button>
      </div>
    );
  }

  const statusInfo = getStatusInfo(task.status);
  const priorityInfo = getPriorityInfo(task.priority);
  const isCreator = user?.id === task.creatorId;
  const canEdit = isCreator || user?.role === 'OWNER' || user?.role === 'HEAD';

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tasks">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">업무 상세</h1>
            <p className="text-muted-foreground text-sm">
              생성일: {format(new Date(task.createdAt), 'yyyy년 M월 d일', { locale: ko })}
            </p>
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="mr-2 h-4 w-4" />
                  취소
                </Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {updateMutation.isPending ? '저장 중...' : '저장'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleStartEdit}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  수정
                </Button>
                <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  삭제
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 메인 콘텐츠 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 제목 & 설명 */}
          <Card>
            <CardHeader>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">제목</Label>
                    <Input
                      id="title"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      placeholder="업무 제목"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">설명</Label>
                    <Textarea
                      id="description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="업무 설명"
                      rows={5}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <CardTitle className="text-xl">{task.title}</CardTitle>
                  {task.description && (
                    <CardDescription className="whitespace-pre-wrap mt-2">
                      {task.description}
                    </CardDescription>
                  )}
                </>
              )}
            </CardHeader>
          </Card>

          {/* 댓글 & 히스토리 탭 */}
          <Card>
            <Tabs defaultValue="comments">
              <CardHeader className="pb-0">
                <TabsList>
                  <TabsTrigger value="comments" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    댓글 ({task.comments?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="history" className="gap-2">
                    <History className="h-4 w-4" />
                    히스토리
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="pt-4">
                <TabsContent value="comments" className="mt-0 space-y-4">
                  {/* 댓글 입력 */}
                  <div className="flex gap-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="댓글을 입력하세요..."
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || commentMutation.isPending}
                      size="icon"
                      className="h-auto"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>

                  <Separator />

                  {/* 댓글 목록 */}
                  <div className="space-y-4">
                    {task.comments && task.comments.length > 0 ? (
                      task.comments.map((comment: TaskComment) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.user?.profileImageUrl || undefined} />
                            <AvatarFallback className="text-xs">
                              {comment.user?.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{comment.user?.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(comment.createdAt), 'M/d HH:mm', { locale: ko })}
                                </span>
                              </div>
                              {comment.userId === user?.id && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => deleteCommentMutation.mutate(comment.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-4">
                        아직 댓글이 없습니다.
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="history" className="mt-0">
                  <div className="space-y-3">
                    {history && history.length > 0 ? (
                      history.map((item: TaskHistory) => (
                        <div key={item.id} className="flex gap-3 text-sm">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground mt-2" />
                          <div className="flex-1">
                            <p>
                              <span className="font-medium">{item.user?.name}</span>
                              <span className="text-muted-foreground">님이 </span>
                              <span className="font-medium">{item.fieldName}</span>
                              <span className="text-muted-foreground">을(를) </span>
                              {item.oldValue && (
                                <>
                                  <span className="line-through text-muted-foreground">{item.oldValue}</span>
                                  <span className="text-muted-foreground">에서 </span>
                                </>
                              )}
                              <span className="font-medium">{item.newValue}</span>
                              <span className="text-muted-foreground">(으)로 변경</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(item.createdAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-4">
                        변경 이력이 없습니다.
                      </p>
                    )}
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 상태 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">상태 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 상태 */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">상태</Label>
                {isEditing ? (
                  <Select
                    value={editForm.status}
                    onValueChange={(value) => setEditForm({ ...editForm, status: value as TaskStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${option.color}`} />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
                    <span>{statusInfo.label}</span>
                  </div>
                )}
              </div>

              {/* 우선순위 */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">우선순위</Label>
                {isEditing ? (
                  <Select
                    value={editForm.priority}
                    onValueChange={(value) => setEditForm({ ...editForm, priority: value as TaskPriority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label} ({option.value})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={priorityInfo.variant}>
                    {priorityInfo.label} ({task.priority})
                  </Badge>
                )}
              </div>

              {/* 마감일 */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">마감일</Label>
                {isEditing ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !editForm.dueDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editForm.dueDate
                          ? format(editForm.dueDate, 'yyyy년 M월 d일', { locale: ko })
                          : '마감일 선택'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={editForm.dueDate || undefined}
                        onSelect={(date) => setEditForm({ ...editForm, dueDate: date || null })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {task.dueDate
                        ? format(new Date(task.dueDate), 'yyyy년 M월 d일', { locale: ko })
                        : '-'}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              {/* 담당자 */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">담당자</Label>
                {isEditing ? (
                  <Select
                    value={editForm.assigneeId}
                    onValueChange={(value) => setEditForm({ ...editForm, assigneeId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="담당자 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">없음</SelectItem>
                      {teamMembers?.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : task.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={task.assignee.profileImageUrl || undefined} />
                      <AvatarFallback className="text-xs">
                        {task.assignee.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{task.assignee.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>미배정</span>
                  </div>
                )}
              </div>

              {/* 생성자 */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">생성자</Label>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={task.creator?.profileImageUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {task.creator?.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{task.creator?.name}</span>
                </div>
              </div>

              {/* 팀 */}
              {task.team && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">팀</Label>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{task.team.name}</span>
                  </div>
                </div>
              )}

              <Separator />

              {/* 시간 정보 */}
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    수정일: {format(new Date(task.updatedAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>업무 삭제</DialogTitle>
            <DialogDescription>
              &apos;{task.title}&apos; 업무를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
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

function TaskDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-20 w-full mt-2" />
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-10 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
