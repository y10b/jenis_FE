'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, MoreHorizontal, Trash2, Edit, UserPlus, ChevronDown, ChevronUp, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { getTeams, getTeam, createTeam, deleteTeam, transferMember } from '@/services/teams';
import { useAuthStore } from '@/stores/auth';
import type { Team, User, UserRole } from '@/types';
import { Kr2GithubTools } from '@/components/github/kr2-github-tools';

const roleLabels: Record<UserRole, string> = {
  OWNER: '소유자',
  HEAD: '헤드',
  LEAD: '리드',
  ACTOR: '멤버',
};

export default function TeamsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isOwner = user?.role === 'OWNER';

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [targetTeamId, setTargetTeamId] = useState<string>('');

  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: getTeams,
  });

  const { data: expandedTeamData, isLoading: isLoadingTeamMembers } = useQuery({
    queryKey: ['team', expandedTeamId],
    queryFn: () => getTeam(expandedTeamId!),
    enabled: !!expandedTeamId,
  });

  const createMutation = useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('팀이 생성되었습니다.');
      setCreateDialogOpen(false);
      setNewTeamName('');
      setNewTeamDescription('');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '팀 생성에 실패했습니다.';
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('팀이 삭제되었습니다.');
      setDeleteDialogOpen(false);
      setSelectedTeam(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '팀 삭제에 실패했습니다.';
      toast.error(message);
    },
  });

  const transferMutation = useMutation({
    mutationFn: ({ userId, toTeamId }: { userId: string; toTeamId: string }) =>
      transferMember(expandedTeamId!, userId, toTeamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team', expandedTeamId] });
      toast.success('팀원이 이동되었습니다.');
      setTransferDialogOpen(false);
      setSelectedMember(null);
      setTargetTeamId('');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '팀원 이동에 실패했습니다.';
      toast.error(message);
    },
  });

  const handleCreate = () => {
    if (!newTeamName.trim()) {
      toast.error('팀 이름을 입력해주세요.');
      return;
    }
    createMutation.mutate({
      name: newTeamName,
      description: newTeamDescription || undefined,
    });
  };

  const handleDelete = () => {
    if (selectedTeam) {
      deleteMutation.mutate(selectedTeam.id);
    }
  };

  const handleTransfer = () => {
    if (selectedMember && targetTeamId) {
      transferMutation.mutate({ userId: selectedMember.id, toTeamId: targetTeamId });
    }
  };

  const toggleTeamExpand = (teamId: string) => {
    setExpandedTeamId(expandedTeamId === teamId ? null : teamId);
  };

  // 이동 가능한 팀 목록 (현재 팀 제외)
  const availableTeamsForTransfer = teams?.filter(t => t.id !== expandedTeamId) || [];

  if (isLoading) {
    return <TeamsPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">팀</h1>
          <p className="text-muted-foreground">팀을 관리하고 멤버를 확인하세요</p>
        </div>
        {isOwner && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            새 팀
          </Button>
        )}
      </div>

      {/* KR2팀 전용 GitHub 도구 */}
      <Kr2GithubTools />

      {teams && teams.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Collapsible
              key={team.id}
              open={expandedTeamId === team.id}
              onOpenChange={() => toggleTeamExpand(team.id)}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 flex-1">
                      <CardTitle className="text-lg font-semibold">{team.name}</CardTitle>
                      {expandedTeamId === team.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  {isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/teams/${team.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            수정
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/teams/${team.id}/members`}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            멤버 관리
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedTeam(team);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {team.description || '설명 없음'}
                  </CardDescription>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {team._count?.members || 0}명
                      </span>
                    </div>
                    <Badge variant="outline">{team.owner?.name}</Badge>
                  </div>
                </CardContent>
                <CollapsibleContent>
                  <CardContent className="pt-0 border-t">
                    <div className="pt-4">
                      <h4 className="text-sm font-medium mb-3">팀원 목록</h4>
                      {isLoadingTeamMembers && expandedTeamId === team.id ? (
                        <div className="space-y-2">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-2">
                              <Skeleton className="h-8 w-8 rounded-full" />
                              <div>
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-32 mt-1" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : expandedTeamData?.members && expandedTeamData.members.length > 0 ? (
                        <div className="space-y-2">
                          {expandedTeamData.members.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={member.profileImageUrl || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {member.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{member.name}</p>
                                  <p className="text-xs text-muted-foreground">{member.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {roleLabels[member.role]}
                                </Badge>
                                {isOwner && member.role !== 'OWNER' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    title="다른 팀으로 이동"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedMember(member);
                                      setTransferDialogOpen(true);
                                    }}
                                  >
                                    <ArrowRightLeft className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          팀원이 없습니다.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">등록된 팀이 없습니다.</p>
            {isOwner && (
              <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                새 팀 만들기
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* 팀 생성 다이얼로그 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 팀</DialogTitle>
            <DialogDescription>새로운 팀을 생성합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">팀 이름 *</Label>
              <Input
                id="name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="팀 이름을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={newTeamDescription}
                onChange={(e) => setNewTeamDescription(e.target.value)}
                placeholder="팀에 대한 설명을 입력하세요"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? '생성 중...' : '생성'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>팀 삭제</DialogTitle>
            <DialogDescription>
              &apos;{selectedTeam?.name}&apos; 팀을 삭제하시겠습니까? 팀에 멤버가 있으면 삭제할 수 없습니다.
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

      {/* 팀원 이동 다이얼로그 */}
      <Dialog open={transferDialogOpen} onOpenChange={(open) => {
        setTransferDialogOpen(open);
        if (!open) {
          setSelectedMember(null);
          setTargetTeamId('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>팀원 이동</DialogTitle>
            <DialogDescription>
              &apos;{selectedMember?.name}&apos;님을 다른 팀으로 이동합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedMember?.profileImageUrl || undefined} />
                <AvatarFallback>{selectedMember?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedMember?.name}</p>
                <p className="text-sm text-muted-foreground">{selectedMember?.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>이동할 팀 선택</Label>
              <Select value={targetTeamId} onValueChange={setTargetTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="팀을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeamsForTransfer.length > 0 ? (
                    availableTeamsForTransfer.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      이동 가능한 팀이 없습니다
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={!targetTeamId || transferMutation.isPending}
            >
              {transferMutation.isPending ? '이동 중...' : '이동'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TeamsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-5 w-48 mt-2" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-4" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
