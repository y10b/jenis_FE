'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { User, Mail, Phone, Building2, Shield, Loader2, Camera } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { getMe } from '@/services/auth';
import { updateProfile } from '@/services/users';
import { useAuthStore } from '@/stores/auth';
import type { UserRole } from '@/types';

const roleLabels: Record<UserRole, string> = {
  OWNER: '대표',
  TEAM_LEAD: '팀 리드',
  HEAD: '헤드',
  LEAD: '리드',
  ACTOR: '멤버',
};

const roleBadgeVariants: Record<UserRole, 'default' | 'secondary' | 'outline'> = {
  OWNER: 'default',
  TEAM_LEAD: 'default',
  HEAD: 'default',
  LEAD: 'secondary',
  ACTOR: 'outline',
};

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    staleTime: 1000 * 60 * 5,
  });

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setUser(updatedUser);
      toast.success('프로필이 업데이트되었습니다.');
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '프로필 업데이트에 실패했습니다.');
    },
  });

  const handleEdit = () => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('이름을 입력해주세요.');
      return;
    }
    updateMutation.mutate({ name, phone: phone || undefined });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setName('');
    setPhone('');
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">사용자 정보를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">프로필</h1>
        <p className="text-muted-foreground">내 계정 정보를 확인하고 수정하세요</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* 프로필 카드 */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback className="text-2xl">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                  disabled
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <h2 className="mt-4 text-xl font-semibold">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <Badge variant={roleBadgeVariants[user.role]} className="mt-2">
                {roleLabels[user.role]}
              </Badge>
              {user.team && (
                <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>{user.team.name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 정보 카드 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>개인 정보</CardTitle>
                <CardDescription>계정에 등록된 개인 정보입니다</CardDescription>
              </div>
              {!isEditing && (
                <Button variant="outline" onClick={handleEdit}>
                  수정
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="이름을 입력하세요"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    value={user.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">이메일은 변경할 수 없습니다</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">전화번호</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="전화번호를 입력하세요"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={updateMutation.isPending}>
                    {updateMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    저장
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    취소
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">이름</p>
                    <p className="font-medium">{user.name}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-4">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">이메일</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-4">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">전화번호</p>
                    <p className="font-medium">{user.phone || '미등록'}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-4">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">역할</p>
                    <p className="font-medium">{roleLabels[user.role]}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-4">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">소속 팀</p>
                    <p className="font-medium">{user.team?.name || '미배정'}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-5 w-48 mt-2" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-6 w-32 mt-4" />
              <Skeleton className="h-4 w-40 mt-2" />
            </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-5 w-full" />
                {i < 4 && <Separator className="mt-6" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
