'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  GitBranch,
  GitPullRequest,
  Bug,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  Github,
  AlertCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

import {
  checkKr2Access,
  getGithubStatus,
  getGithubRepos,
  createIssueFromGitLog,
  generatePRTemplate,
  getKr2Branches,
  type GithubRepo,
  type PRTemplateResponse,
} from '@/services/github';

export function Kr2GithubTools() {
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [prDialogOpen, setPrDialogOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [issueTitle, setIssueTitle] = useState('');
  const [issueBody, setIssueBody] = useState('');
  const [sourceBranch, setSourceBranch] = useState('');
  const [targetBranch, setTargetBranch] = useState('main');
  const [prTemplate, setPrTemplate] = useState<PRTemplateResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // KR2팀 접근 권한 확인
  const { data: accessStatus, isLoading: isLoadingAccess } = useQuery({
    queryKey: ['kr2-access'],
    queryFn: checkKr2Access,
  });

  // GitHub 연동 상태 확인
  const { data: githubStatus, isLoading: isLoadingGithub } = useQuery({
    queryKey: ['github-status'],
    queryFn: getGithubStatus,
    enabled: accessStatus?.hasAccess,
  });

  // 리포지토리 목록 조회
  const { data: repos, isLoading: isLoadingRepos } = useQuery({
    queryKey: ['github-repos'],
    queryFn: getGithubRepos,
    enabled: githubStatus?.connected,
  });

  // 브랜치 목록 조회
  const { data: branches, isLoading: isLoadingBranches } = useQuery({
    queryKey: ['kr2-branches', selectedRepo],
    queryFn: () => getKr2Branches(selectedRepo),
    enabled: !!selectedRepo && githubStatus?.connected,
  });

  // 이슈 생성 mutation
  const createIssueMutation = useMutation({
    mutationFn: createIssueFromGitLog,
    onSuccess: (data) => {
      toast.success(`이슈 #${data.issueNumber}이 생성되었습니다.`);
      window.open(data.issueUrl, '_blank');
      setIssueDialogOpen(false);
      resetIssueForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '이슈 생성에 실패했습니다.');
    },
  });

  // PR 템플릿 생성 mutation
  const generatePRMutation = useMutation({
    mutationFn: generatePRTemplate,
    onSuccess: (data) => {
      setPrTemplate(data);
      toast.success('PR 템플릿이 생성되었습니다.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'PR 템플릿 생성에 실패했습니다.');
    },
  });

  const resetIssueForm = () => {
    setIssueTitle('');
    setIssueBody('');
  };

  const resetPrForm = () => {
    setSourceBranch('');
    setTargetBranch('main');
    setPrTemplate(null);
  };

  const handleCreateIssue = () => {
    if (!selectedRepo || !issueTitle.trim()) {
      toast.error('리포지토리와 이슈 제목을 입력해주세요.');
      return;
    }

    createIssueMutation.mutate({
      repo: selectedRepo,
      title: issueTitle,
      body: issueBody,
    });
  };

  const handleGeneratePR = () => {
    if (!selectedRepo || !sourceBranch) {
      toast.error('리포지토리와 소스 브랜치를 선택해주세요.');
      return;
    }

    generatePRMutation.mutate({
      repo: selectedRepo,
      sourceBranch,
      targetBranch,
    });
  };

  const handleCopyTemplate = async () => {
    if (prTemplate) {
      await navigator.clipboard.writeText(prTemplate.template);
      setCopied(true);
      toast.success('템플릿이 클립보드에 복사되었습니다.');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenPRPage = () => {
    if (prTemplate) {
      window.open(prTemplate.prCreateUrl, '_blank');
    }
  };

  // 로딩 중
  if (isLoadingAccess) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  // KR2팀이 아닌 경우 표시 안함
  if (!accessStatus?.hasAccess) {
    return null;
  }

  // GitHub 연동 안됨
  if (isLoadingGithub) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            KR2팀 GitHub 도구
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!githubStatus?.connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            KR2팀 GitHub 도구
          </CardTitle>
          <CardDescription>
            GitHub 이슈/PR 자동화 도구
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">GitHub 연동이 필요합니다</p>
              <p className="text-sm text-muted-foreground">
                설정 &gt; 연동에서 GitHub 계정을 연결해주세요.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            KR2팀 GitHub 도구
          </CardTitle>
          <CardDescription>
            Git 이력 기반 이슈 생성 및 PR 템플릿 자동 생성
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 리포지토리 선택 */}
          <div className="space-y-2">
            <Label>리포지토리 선택</Label>
            <Select value={selectedRepo} onValueChange={setSelectedRepo}>
              <SelectTrigger>
                <SelectValue placeholder="리포지토리를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingRepos ? (
                  <SelectItem value="" disabled>
                    로딩 중...
                  </SelectItem>
                ) : repos && repos.length > 0 ? (
                  repos.map((repo) => (
                    <SelectItem key={repo.id} value={repo.fullName}>
                      <div className="flex items-center gap-2">
                        <span>{repo.fullName}</span>
                        {repo.private && (
                          <Badge variant="secondary" className="text-xs">
                            Private
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    리포지토리가 없습니다
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* 버튼 그룹 */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setIssueDialogOpen(true)}
              disabled={!selectedRepo}
              variant="outline"
            >
              <Bug className="mr-2 h-4 w-4" />
              이슈 생성
            </Button>
            <Button
              onClick={() => setPrDialogOpen(true)}
              disabled={!selectedRepo}
              variant="outline"
            >
              <GitPullRequest className="mr-2 h-4 w-4" />
              PR 템플릿 생성
            </Button>
          </div>

          {selectedRepo && (
            <p className="text-xs text-muted-foreground">
              선택된 리포지토리: <code className="bg-muted px-1 py-0.5 rounded">{selectedRepo}</code>
            </p>
          )}
        </CardContent>
      </Card>

      {/* 이슈 생성 다이얼로그 */}
      <Dialog open={issueDialogOpen} onOpenChange={(open) => {
        setIssueDialogOpen(open);
        if (!open) resetIssueForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              GitHub 이슈 생성
            </DialogTitle>
            <DialogDescription>
              Git 이력을 기반으로 GitHub 이슈를 생성합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="issue-title">이슈 제목 *</Label>
              <Input
                id="issue-title"
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                placeholder="예: [Feature] 사용자 인증 기능 구현"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issue-body">이슈 내용</Label>
              <Textarea
                id="issue-body"
                value={issueBody}
                onChange={(e) => setIssueBody(e.target.value)}
                placeholder="이슈에 대한 상세 설명을 입력하세요..."
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                마크다운 문법을 지원합니다.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleCreateIssue}
              disabled={createIssueMutation.isPending || !issueTitle.trim()}
            >
              {createIssueMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Bug className="mr-2 h-4 w-4" />
                  이슈 생성
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PR 템플릿 생성 다이얼로그 */}
      <Dialog open={prDialogOpen} onOpenChange={(open) => {
        setPrDialogOpen(open);
        if (!open) resetPrForm();
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitPullRequest className="h-5 w-5" />
              PR 템플릿 생성
            </DialogTitle>
            <DialogDescription>
              브랜치 비교를 통해 PR 템플릿을 자동 생성합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 브랜치 선택 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>소스 브랜치 (작업 브랜치)</Label>
                <Select value={sourceBranch} onValueChange={setSourceBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="브랜치 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingBranches ? (
                      <SelectItem value="" disabled>
                        로딩 중...
                      </SelectItem>
                    ) : branches && branches.length > 0 ? (
                      branches.map((branch) => (
                        <SelectItem key={branch.name} value={branch.name}>
                          <div className="flex items-center gap-2">
                            <GitBranch className="h-3 w-3" />
                            <span>{branch.name}</span>
                            {branch.protected && (
                              <Badge variant="secondary" className="text-xs">
                                protected
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        브랜치가 없습니다
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>타겟 브랜치 (병합 대상)</Label>
                <Select value={targetBranch} onValueChange={setTargetBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="브랜치 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches?.map((branch) => (
                      <SelectItem key={branch.name} value={branch.name}>
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-3 w-3" />
                          <span>{branch.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleGeneratePR}
              disabled={generatePRMutation.isPending || !sourceBranch}
              className="w-full"
            >
              {generatePRMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  템플릿 생성 중...
                </>
              ) : (
                '템플릿 생성'
              )}
            </Button>

            {/* 생성된 템플릿 */}
            {prTemplate && (
              <>
                <Separator />

                {/* 요약 정보 */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    커밋 {prTemplate.summary.totalCommits}개
                  </Badge>
                  <Badge variant="outline">
                    파일 {prTemplate.summary.totalFiles}개
                  </Badge>
                  {Object.entries(prTemplate.summary.changeTypes).map(([type, count]) => (
                    <Badge key={type} variant="secondary">
                      {type}: {count}
                    </Badge>
                  ))}
                </div>

                {/* 템플릿 미리보기 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>PR 템플릿</Label>
                    <Button variant="ghost" size="sm" onClick={handleCopyTemplate}>
                      {copied ? (
                        <Check className="h-4 w-4 mr-1" />
                      ) : (
                        <Copy className="h-4 w-4 mr-1" />
                      )}
                      복사
                    </Button>
                  </div>
                  <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {prTemplate.template}
                  </pre>
                </div>

                {/* PR 생성 페이지로 이동 */}
                <Button onClick={handleOpenPRPage} className="w-full">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  GitHub에서 PR 생성하기
                </Button>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPrDialogOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
