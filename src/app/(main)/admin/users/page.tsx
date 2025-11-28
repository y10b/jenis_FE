'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Shield, Users, MoreHorizontal, UserCog } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  getPendingUsers,
  getAllUsers,
  approveUser,
  rejectUser,
  updateUserRole,
  deactivateUser,
  activateUser,
} from '@/services/admin';
import { getTeams } from '@/services/teams';
import type { User, UserRole, UserStatus } from '@/types';

const roleLabels: Record<UserRole, string> = {
  OWNER: '소유자',
  HEAD: '헤드',
  LEAD: '리드',
  ACTOR: '멤버',
};

const statusLabels: Record<UserStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: '대기 중', variant: 'secondary' },
  ACTIVE: { label: '활성', variant: 'default' },
  INACTIVE: { label: '비활성', variant: 'outline' },
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [roleChangeDialogOpen, setRoleChangeDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('ACTOR');

  const { data: pendingUsers, isLoading: isPendingLoading } = useQuery({
    queryKey: ['admin', 'users', 'pending'],
    queryFn: getPendingUsers,
    enabled: activeTab === 'pending',
  });

  const { data: allUsers, isLoading: isAllLoading } = useQuery({
    queryKey: ['admin', 'users', 'all', { page }],
    queryFn: () => getAllUsers({ page, limit: 20 }),
    enabled: activeTab === 'all',
  });

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: getTeams,
  });

  const approveMutation = useMutation({
    mutationFn: ({ userId, teamId }: { userId: string; teamId?: string }) =>
      approveUser(userId, teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('사용자가 승인되었습니다.');
      setApproveDialogOpen(false);
      setSelectedUser(null);
      setSelectedTeamId('');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '승인에 실패했습니다.';
      toast.error(message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (userId: string) => rejectUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('사용자가 거절되었습니다.');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '거절에 실패했습니다.';
      toast.error(message);
    },
  });

  const roleChangeMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('역할이 변경되었습니다.');
      setRoleChangeDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '역할 변경에 실패했습니다.';
      toast.error(message);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('사용자가 비활성화되었습니다.');
    },
  });

  const activateMutation = useMutation({
    mutationFn: activateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('사용자가 활성화되었습니다.');
    },
  });

  const handleApprove = () => {
    if (selectedUser) {
      approveMutation.mutate({
        userId: selectedUser.id,
        teamId: selectedTeamId || undefined,
      });
    }
  };

  const handleRoleChange = () => {
    if (selectedUser) {
      roleChangeMutation.mutate({
        userId: selectedUser.id,
        role: selectedRole,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">사용자 관리</h1>
        <p className="text-muted-foreground">사용자를 관리하고 권한을 설정하세요</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Shield className="h-4 w-4" />
            승인 대기
            {pendingUsers && pendingUsers.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {pendingUsers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <Users className="h-4 w-4" />
            전체 사용자
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {isPendingLoading ? (
            <UsersTableSkeleton />
          ) : pendingUsers && pendingUsers.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>사용자</TableHead>
                      <TableHead>이메일</TableHead>
                      <TableHead>전화번호</TableHead>
                      <TableHead className="w-[150px]">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.profileImageUrl || undefined} />
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setApproveDialogOpen(true);
                              }}
                            >
                              <Check className="mr-1 h-4 w-4" />
                              승인
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectMutation.mutate(user.id)}
                              disabled={rejectMutation.isPending}
                            >
                              <X className="mr-1 h-4 w-4" />
                              거절
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Check className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-muted-foreground">승인 대기 중인 사용자가 없습니다.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          {isAllLoading ? (
            <UsersTableSkeleton />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>사용자</TableHead>
                      <TableHead>이메일</TableHead>
                      <TableHead>역할</TableHead>
                      <TableHead>팀</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers?.data.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.profileImageUrl || undefined} />
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{roleLabels[user.role]}</Badge>
                        </TableCell>
                        <TableCell>{user.team?.name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={statusLabels[user.status].variant}>
                            {statusLabels[user.status].label}
                          </Badge>
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
                                onClick={() => {
                                  setSelectedUser(user);
                                  setSelectedRole(user.role);
                                  setRoleChangeDialogOpen(true);
                                }}
                              >
                                <UserCog className="mr-2 h-4 w-4" />
                                역할 변경
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.status === 'ACTIVE' ? (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => deactivateMutation.mutate(user.id)}
                                >
                                  비활성화
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => activateMutation.mutate(user.id)}
                                >
                                  활성화
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* 페이지네이션 */}
          {allUsers && allUsers.meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                이전
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {allUsers.meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(allUsers.meta.totalPages, p + 1))}
                disabled={page === allUsers.meta.totalPages}
              >
                다음
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 승인 다이얼로그 */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사용자 승인</DialogTitle>
            <DialogDescription>
              {selectedUser?.name}님을 승인합니다. 팀을 선택하면 해당 팀에 배정됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">팀 선택 (선택사항)</label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="팀을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">없음</SelectItem>
                  {teams?.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleApprove} disabled={approveMutation.isPending}>
              {approveMutation.isPending ? '승인 중...' : '승인'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 역할 변경 다이얼로그 */}
      <Dialog open={roleChangeDialogOpen} onOpenChange={setRoleChangeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>역할 변경</DialogTitle>
            <DialogDescription>
              {selectedUser?.name}님의 역할을 변경합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">역할</label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTOR">멤버</SelectItem>
                  <SelectItem value="LEAD">리드</SelectItem>
                  <SelectItem value="HEAD">헤드</SelectItem>
                  <SelectItem value="OWNER">소유자</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleChangeDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleRoleChange} disabled={roleChangeMutation.isPending}>
              {roleChangeMutation.isPending ? '변경 중...' : '변경'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UsersTableSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>사용자</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>역할</TableHead>
              <TableHead>팀</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
