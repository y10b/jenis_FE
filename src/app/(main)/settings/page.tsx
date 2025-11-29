'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Key, Github, Loader2, ExternalLink, Check, X, MessageSquare } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { changePassword, getSlackTemplate, updateSlackTemplate } from '@/services/users';
import { getGithubStatus, getGithubAuthUrl, disconnectGithub } from '@/services/github';

const DEFAULT_SLACK_TEMPLATE = `:o2: KR2팀 Key Results = KR2-1 재구매율 40% → 60% KR2-2 NPS 55점 이상 KR2-3 추천·바이럴 유입 25% KR2-4 주요 코어 기능(보장분석 GPT, CRM3.0) 개선 3건 이상
:a: [{{DATE}} OK, Action] :1등_메달:가장 중요하고 시급한 일부터 :a:

{{PR_LIST}}`;

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [slackTemplateDialogOpen, setSlackTemplateDialogOpen] = useState(false);
  const [slackTemplate, setSlackTemplate] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // GitHub 연동 성공 시 토스트 표시
  useEffect(() => {
    if (searchParams.get('github') === 'success') {
      toast.success('GitHub 연동이 완료되었습니다.');
      // URL에서 쿼리 파라미터 제거
      window.history.replaceState({}, '', '/settings');
    }
  }, [searchParams]);

  // GitHub 연동 상태 조회
  const { data: githubStatus, isLoading: isLoadingGithub, refetch: refetchGithub } = useQuery({
    queryKey: ['github-status'],
    queryFn: getGithubStatus,
  });

  // 슬랙 템플릿 조회
  const { data: slackTemplateData, isLoading: isLoadingSlackTemplate } = useQuery({
    queryKey: ['slack-template'],
    queryFn: getSlackTemplate,
  });

  // 슬랙 템플릿 다이얼로그 열릴 때 기존 값 로드
  useEffect(() => {
    if (slackTemplateDialogOpen && slackTemplateData) {
      setSlackTemplate(slackTemplateData.template || DEFAULT_SLACK_TEMPLATE);
    }
  }, [slackTemplateDialogOpen, slackTemplateData]);

  // 비밀번호 변경 mutation
  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success('비밀번호가 변경되었습니다.');
      setPasswordDialogOpen(false);
      resetPasswordForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '비밀번호 변경에 실패했습니다.');
    },
  });

  // GitHub 연동 해제 mutation
  const disconnectGithubMutation = useMutation({
    mutationFn: disconnectGithub,
    onSuccess: () => {
      toast.success('GitHub 연동이 해제되었습니다.');
      refetchGithub();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'GitHub 연동 해제에 실패했습니다.');
    },
  });

  // 슬랙 템플릿 저장 mutation
  const updateSlackTemplateMutation = useMutation({
    mutationFn: updateSlackTemplate,
    onSuccess: () => {
      toast.success('슬랙 보고서 템플릿이 저장되었습니다.');
      setSlackTemplateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['slack-template'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '템플릿 저장에 실패했습니다.');
    },
  });

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('모든 필드를 입력해주세요.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const handleConnectGithub = async () => {
    try {
      const { authUrl } = await getGithubAuthUrl();
      window.location.href = authUrl;
    } catch (error: any) {
      toast.error('GitHub 연동 URL을 가져오는데 실패했습니다.');
    }
  };

  const handleDisconnectGithub = () => {
    disconnectGithubMutation.mutate();
  };

  const handleSaveSlackTemplate = () => {
    if (!slackTemplate.trim()) {
      toast.error('템플릿을 입력해주세요.');
      return;
    }
    updateSlackTemplateMutation.mutate(slackTemplate);
  };

  const handleResetSlackTemplate = () => {
    setSlackTemplate(DEFAULT_SLACK_TEMPLATE);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">설정</h1>
        <p className="text-muted-foreground">계정 설정 및 연동을 관리하세요</p>
      </div>

      {/* 보안 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            보안
          </CardTitle>
          <CardDescription>비밀번호 및 보안 설정을 관리합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">비밀번호</p>
              <p className="text-sm text-muted-foreground">계정 비밀번호를 변경합니다</p>
            </div>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(true)}>
              비밀번호 변경
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 연동 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>연동</CardTitle>
          <CardDescription>외부 서비스 연동을 관리합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* GitHub */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Github className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">GitHub</p>
                  {isLoadingGithub ? (
                    <Skeleton className="h-5 w-16" />
                  ) : githubStatus?.connected ? (
                    <Badge variant="default" className="gap-1">
                      <Check className="h-3 w-3" />
                      연동됨
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <X className="h-3 w-3" />
                      미연동
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {githubStatus?.connected
                    ? `@${githubStatus.username}으로 연동됨`
                    : 'GitHub 계정을 연동하여 이슈/PR 기능을 사용하세요'}
                </p>
              </div>
            </div>
            {githubStatus?.connected ? (
              <Button
                variant="outline"
                onClick={handleDisconnectGithub}
                disabled={disconnectGithubMutation.isPending}
              >
                {disconnectGithubMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  '연동 해제'
                )}
              </Button>
            ) : (
              <Button onClick={handleConnectGithub}>
                <ExternalLink className="mr-2 h-4 w-4" />
                연동하기
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 슬랙 일일 보고서 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            슬랙 일일 보고서
          </CardTitle>
          <CardDescription>슬랙 일일 보고서 템플릿을 설정합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">보고서 템플릿</p>
              <p className="text-sm text-muted-foreground">
                {isLoadingSlackTemplate ? (
                  <Skeleton className="h-4 w-32" />
                ) : slackTemplateData?.template ? (
                  '템플릿이 설정되어 있습니다'
                ) : (
                  '기본 템플릿을 사용합니다'
                )}
              </p>
            </div>
            <Button variant="outline" onClick={() => setSlackTemplateDialogOpen(true)}>
              템플릿 설정
            </Button>
          </div>
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">사용 가능한 변수:</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs font-mono">{'{{DATE}}'}</Badge>
              <span className="text-xs text-muted-foreground">오늘 날짜 (예: 11월 28일 금요일)</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              <Badge variant="secondary" className="text-xs font-mono">{'{{PR_LIST}}'}</Badge>
              <span className="text-xs text-muted-foreground">당일 PR 목록</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 비밀번호 변경 다이얼로그 */}
      <Dialog open={passwordDialogOpen} onOpenChange={(open) => {
        setPasswordDialogOpen(open);
        if (!open) resetPasswordForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>비밀번호 변경</DialogTitle>
            <DialogDescription>
              새로운 비밀번호를 설정합니다. 비밀번호는 최소 8자 이상이어야 합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">현재 비밀번호</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="new-password">새 비밀번호</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">새 비밀번호 확인</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  변경 중...
                </>
              ) : (
                '변경'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 슬랙 템플릿 다이얼로그 */}
      <Dialog open={slackTemplateDialogOpen} onOpenChange={setSlackTemplateDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>슬랙 보고서 템플릿 설정</DialogTitle>
            <DialogDescription>
              일일 보고서 생성 시 사용할 템플릿을 설정합니다. {'{{DATE}}'}는 오늘 날짜로, {'{{PR_LIST}}'}는 당일 PR 목록으로 자동 대체됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="slack-template">템플릿</Label>
              <Textarea
                id="slack-template"
                placeholder="슬랙 보고서 템플릿을 입력하세요..."
                value={slackTemplate}
                onChange={(e) => setSlackTemplate(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={handleResetSlackTemplate}>
                기본 템플릿으로 초기화
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSlackTemplateDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleSaveSlackTemplate}
              disabled={updateSlackTemplateMutation.isPending}
            >
              {updateSlackTemplateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                '저장'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
