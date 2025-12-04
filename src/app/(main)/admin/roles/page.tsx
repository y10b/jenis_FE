'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { redirect } from 'next/navigation';
import {
  Shield,
  Users,
  UserCog,
  UserCheck,
  User,
  Check,
  X,
  Crown,
  Plus,
  Trash2,
  Loader2,
  Sparkles,
  Clock,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getAllFeatures,
  getMyPermissions,
  getUserPermissions,
  grantPermission,
  bulkGrantPermissions,
  revokePermission,
  initializeFeatures,
  type FeaturesByCategory,
  type UserPermissions,
} from '@/services/permissions';
import { getAllUsers } from '@/services/admin';

const roleInfo = {
  OWNER: {
    name: 'Owner',
    nameKo: '오너',
    icon: Crown,
    color: 'bg-amber-500',
    description: '시스템 전체 관리 권한을 가진 최고 관리자입니다.',
  },
  TEAM_LEAD: {
    name: 'Team Lead',
    nameKo: '팀 리드',
    icon: Shield,
    color: 'bg-purple-500',
    description: 'Problem Solver 팀의 리더로, 인턴 온보딩과 배치를 담당합니다.',
  },
  HEAD: {
    name: 'Head',
    nameKo: '헤드',
    icon: UserCog,
    color: 'bg-blue-500',
    description: '팀 관리 권한을 가진 부서장입니다.',
  },
  LEAD: {
    name: 'Lead',
    nameKo: '리드',
    icon: UserCheck,
    color: 'bg-green-500',
    description: '팀 내 업무 관리 권한을 가진 팀장입니다.',
  },
  ACTOR: {
    name: 'Actor',
    nameKo: '액터',
    icon: User,
    color: 'bg-gray-500',
    description: '기본 사용자 권한을 가진 팀원입니다.',
  },
};

const categoryNames: Record<string, string> = {
  team: '팀 관리',
  user: '사용자 관리',
  task: '업무 관리',
  document: '문서 관리',
  share: '팀 공유 관리',
  schedule: '스케줄 관리',
  retrospective: '회고 관리',
  admin: '관리자 기능',
};

export default function RolesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false);

  // 권한 확인 - OWNER, TEAM_LEAD, HEAD만 접근 가능
  const canAccess = user?.role === 'OWNER' || user?.role === 'TEAM_LEAD' || user?.role === 'HEAD';
  const isOwner = user?.role === 'OWNER';

  // 모든 기능 목록 조회
  const { data: features, isLoading: featuresLoading } = useQuery({
    queryKey: ['features'],
    queryFn: getAllFeatures,
    enabled: canAccess,
  });

  // 내 권한 조회
  const { data: myPermissions, isLoading: myPermissionsLoading } = useQuery({
    queryKey: ['my-permissions'],
    queryFn: getMyPermissions,
    enabled: canAccess,
  });

  // 사용자 목록 (OWNER만)
  const { data: usersData } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => getAllUsers({ page: 1, limit: 100 }),
    enabled: isOwner,
  });

  // 권한 부여 mutation
  const grantMutation = useMutation({
    mutationFn: (data: { userId: string; featureCodes: string[]; expiresAt?: string }) =>
      bulkGrantPermissions({
        userId: data.userId,
        featureCodes: data.featureCodes,
        granted: true,
        expiresAt: data.expiresAt,
      }),
    onSuccess: () => {
      toast.success('권한이 부여되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['my-permissions'] });
      setIsGrantDialogOpen(false);
      setSelectedUserId('');
      setSelectedFeatures([]);
      setExpiresAt('');
    },
    onError: () => {
      toast.error('권한 부여에 실패했습니다.');
    },
  });

  // 기능 초기화 mutation
  const initMutation = useMutation({
    mutationFn: initializeFeatures,
    onSuccess: () => {
      toast.success('기능이 초기화되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['features'] });
    },
    onError: () => {
      toast.error('초기화에 실패했습니다.');
    },
  });

  if (!canAccess) {
    redirect('/dashboard');
  }

  if (featuresLoading || myPermissionsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const handleFeatureToggle = (code: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleGrantPermissions = () => {
    if (!selectedUserId || selectedFeatures.length === 0) {
      toast.error('사용자와 권한을 선택해주세요.');
      return;
    }
    grantMutation.mutate({
      userId: selectedUserId,
      featureCodes: selectedFeatures,
      expiresAt: expiresAt || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">역할별 권한 관리</h1>
          <p className="text-muted-foreground mt-1">
            각 역할이 가진 권한을 확인하고 사용자에게 추가 권한을 부여할 수 있습니다.
          </p>
        </div>
        <div className="flex gap-2">
          {isOwner && (
            <>
              <Button
                variant="outline"
                onClick={() => initMutation.mutate()}
                disabled={initMutation.isPending}
              >
                {initMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                기능 초기화
              </Button>
              <Dialog open={isGrantDialogOpen} onOpenChange={setIsGrantDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    권한 부여
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>사용자에게 권한 부여</DialogTitle>
                    <DialogDescription>
                      특정 사용자에게 추가 권한을 부여합니다. 역할 기본 권한 외에 추가로 부여됩니다.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>사용자 선택</Label>
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger>
                          <SelectValue placeholder="사용자를 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          {usersData?.data?.map((u: any) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name} ({u.email}) - {roleInfo[u.role as keyof typeof roleInfo]?.nameKo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>만료일 (선택사항)</Label>
                      <Input
                        type="datetime-local"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>부여할 권한 선택</Label>
                      <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto space-y-4">
                        {features &&
                          Object.entries(features).map(([category, featureList]) => (
                            <div key={category}>
                              <h4 className="font-medium mb-2">
                                {categoryNames[category] || category}
                              </h4>
                              <div className="space-y-2 pl-4">
                                {(featureList as any[]).map((feature) => (
                                  <div key={feature.code} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={feature.code}
                                      checked={selectedFeatures.includes(feature.code)}
                                      onCheckedChange={() => handleFeatureToggle(feature.code)}
                                    />
                                    <label
                                      htmlFor={feature.code}
                                      className="text-sm font-medium leading-none cursor-pointer"
                                    >
                                      {feature.name}
                                      <span className="text-xs text-muted-foreground ml-2">
                                        ({feature.code})
                                      </span>
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsGrantDialogOpen(false)}>
                      취소
                    </Button>
                    <Button
                      onClick={handleGrantPermissions}
                      disabled={grantMutation.isPending || !selectedUserId || selectedFeatures.length === 0}
                    >
                      {grantMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      권한 부여
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* 역할 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {(Object.keys(roleInfo) as Array<keyof typeof roleInfo>).map((role) => {
          const info = roleInfo[role];
          const Icon = info.icon;
          const isCurrentRole = user?.role === role;

          return (
            <Card
              key={role}
              className={`relative ${isCurrentRole ? 'ring-2 ring-primary' : ''}`}
            >
              {isCurrentRole && (
                <Badge className="absolute -top-2 -right-2 text-xs">
                  내 역할
                </Badge>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${info.color}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{info.nameKo}</CardTitle>
                    <CardDescription className="text-xs">{info.name}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{info.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 내 커스텀 권한 표시 */}
      {myPermissions?.customPermissions && myPermissions.customPermissions.length > 0 && (
        <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-500" />
              <CardTitle className="text-green-700 dark:text-green-300">
                내 추가 권한
              </CardTitle>
            </div>
            <CardDescription>
              역할 기본 권한 외에 추가로 부여된 권한입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {myPermissions.customPermissions.map((perm) => (
                <Badge key={perm.code} variant="secondary" className="flex items-center gap-1">
                  {perm.name}
                  {perm.expiresAt && (
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <Clock className="h-3 w-3" />
                      {new Date(perm.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 권한 테이블 - 아코디언 */}
      <Card>
        <CardHeader>
          <CardTitle>권한 상세</CardTitle>
          <CardDescription>
            각 카테고리별로 역할에 따른 권한을 확인하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {features ? (
            <Accordion type="multiple" defaultValue={Object.keys(features).slice(0, 2)} className="w-full">
              {Object.entries(features).map(([category, featureList]) => (
                <AccordionItem key={category} value={category}>
                  <AccordionTrigger className="text-base font-semibold">
                    {categoryNames[category] || category}
                  </AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[250px]">권한</TableHead>
                          <TableHead className="text-center">Owner</TableHead>
                          <TableHead className="text-center">Team Lead</TableHead>
                          <TableHead className="text-center">Head</TableHead>
                          <TableHead className="text-center">Lead</TableHead>
                          <TableHead className="text-center">Actor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(featureList as any[]).map((feature) => (
                          <TableRow key={feature.code}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{feature.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {feature.description}
                                </div>
                              </div>
                            </TableCell>
                            {(['OWNER', 'TEAM_LEAD', 'HEAD', 'LEAD', 'ACTOR'] as const).map((role) => (
                              <TableCell key={role} className="text-center">
                                {feature.defaultRoles?.includes(role) ? (
                                  <Check className="h-5 w-5 text-green-500 mx-auto" />
                                ) : (
                                  <X className="h-5 w-5 text-gray-300 mx-auto" />
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>기능이 초기화되지 않았습니다.</p>
              {isOwner && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => initMutation.mutate()}
                >
                  기능 초기화
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* TEAM_LEAD 특별 권한 설명 */}
      <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-purple-700 dark:text-purple-300">
              Problem Solver (팀 리드) 특별 권한
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <strong>Problem Solver 팀</strong>은 인턴들의 배치 전 대기 팀으로, 팀 리드는 다음과 같은 특별 권한을 가집니다:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">팀원 제거:</strong> 자신이 속한 팀의 멤버만 제거할 수 있습니다. (상위 역할 제외)
            </li>
            <li>
              <strong className="text-foreground">퇴사자 계정 삭제:</strong> 자신의 팀 멤버 중 퇴사한 인턴의 계정을 완전히 삭제할 수 있습니다.
            </li>
            <li>
              <strong className="text-foreground">온보딩 문서 관리:</strong> 모든 팀의 온보딩 문서를 조회하고 관리할 수 있습니다.
            </li>
            <li>
              <strong className="text-foreground">팀 간 배치:</strong> 인턴의 팀 배치는 Owner만 할 수 있으며, 팀 리드는 Owner에게 요청해야 합니다.
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* 커스텀 권한 안내 */}
      {isOwner && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-amber-700 dark:text-amber-300">
                커스텀 권한 부여 안내
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Owner는 특정 사용자에게 역할 기본 권한 외에 추가 권한을 부여할 수 있습니다:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">권한 추가:</strong> 상단의 "권한 부여" 버튼을 클릭하여 사용자와 권한을 선택합니다.
              </li>
              <li>
                <strong className="text-foreground">만료일 설정:</strong> 필요한 경우 권한에 만료일을 설정할 수 있습니다.
              </li>
              <li>
                <strong className="text-foreground">권한 확인:</strong> 부여된 권한은 해당 사용자의 권한 페이지에서 "내 추가 권한"으로 표시됩니다.
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
