'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, UserPlus, UserMinus, Users, Search } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
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
import { getTeam, addMember, removeMember } from '@/services/teams';
import { getAllUsers } from '@/services/admin';
import { useAuthStore } from '@/stores/auth';
import type { User, UserRole } from '@/types';

const roleLabels: Record<UserRole, string> = {
  OWNER: '소유자',
  HEAD: '헤드',
  LEAD: '리드',
  ACTOR: '멤버',
};

export default function TeamMembersPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const teamId = params.id as string;

  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const isOwner = user?.role === 'OWNER';

  const { data: team, isLoading, error } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => getTeam(teamId),
  });

  const { data: allUsers } = useQuery({
    queryKey: ['admin', 'users', 'all'],
    queryFn: () => getAllUsers({ limit: 100 }),
    enabled: addMemberDialogOpen,
  });

  const addMemberMutation = useMutation({
    mutationFn: () => addMember(teamId, { userId: selectedUserId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('멤버가 추가되었습니다.');
      setAddMemberDialogOpen(false);
      setSelectedUserId('');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '멤버 추가에 실패했습니다.';
      toast.error(message);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => removeMember(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('멤버가 제거되었습니다.');
      setRemoveMemberDialogOpen(false);
      setSelectedMember(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '멤버 제거에 실패했습니다.';
      toast.error(message);
    },
  });

  // 팀에 속하지 않은 활성 사용자만 필터링
  const availableUsers = allUsers?.data.filter(
    (u) => u.status === 'ACTIVE' && !team?.members?.some((m) => m.id === u.id)
  ) || [];

  // 검색어로 멤버 필터링
  const filteredMembers = team?.members?.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return <TeamMembersSkeleton />;
  }

  if (error || !team) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-4">팀을 찾을 수 없습니다.</p>
        <Button variant="outline" asChild>
          <Link href="/teams">
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로 돌아가기
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/teams">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{team.name} - 멤버 관리</h1>
            <p className="text-muted-foreground text-sm">
              현재 {team.members?.length || 0}명의 멤버가 있습니다.
            </p>
          </div>
        </div>
        {isOwner && (
          <Button onClick={() => setAddMemberDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            멤버 추가
          </Button>
        )}
      </div>

      {/* 검색 */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="멤버 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* 멤버 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            팀 멤버
          </CardTitle>
          <CardDescription>팀에 소속된 멤버 목록입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMembers.length > 0 ? (
            <div className="space-y-3">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={member.profileImageUrl || undefined} />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{roleLabels[member.role]}</Badge>
                    {isOwner && member.id !== team.ownerId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setSelectedMember(member);
                          setRemoveMemberDialogOpen(true);
                        }}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                    {member.id === team.ownerId && (
                      <Badge>팀장</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? '검색 결과가 없습니다.' : '팀 멤버가 없습니다.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 멤버 추가 다이얼로그 */}
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>멤버 추가</DialogTitle>
            <DialogDescription>
              팀에 추가할 멤버를 선택하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">사용자 선택</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="사용자를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length > 0 ? (
                    availableUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        <div className="flex items-center gap-2">
                          <span>{u.name}</span>
                          <span className="text-muted-foreground text-xs">({u.email})</span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      추가할 수 있는 사용자가 없습니다
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={() => addMemberMutation.mutate()}
              disabled={!selectedUserId || addMemberMutation.isPending}
            >
              {addMemberMutation.isPending ? '추가 중...' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 멤버 제거 확인 다이얼로그 */}
      <Dialog open={removeMemberDialogOpen} onOpenChange={setRemoveMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>멤버 제거</DialogTitle>
            <DialogDescription>
              &apos;{selectedMember?.name}&apos;님을 팀에서 제거하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveMemberDialogOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedMember && removeMemberMutation.mutate(selectedMember.id)}
              disabled={removeMemberMutation.isPending}
            >
              {removeMemberMutation.isPending ? '제거 중...' : '제거'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TeamMembersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40 mt-2" />
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-32 mt-1" />
                </div>
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
