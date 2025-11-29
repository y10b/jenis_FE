'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Copy,
  Check,
  RefreshCw,
  Github,
  ExternalLink,
  AlertCircle,
  FileText,
  Settings,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getSlackTemplate } from '@/services/users';
import { getTodayPRs, getGithubRepos, getGithubStatus, TodayPR, GithubRepo } from '@/services/github';

const DEFAULT_SLACK_TEMPLATE = `:o2: KR2팀 Key Results = KR2-1 재구매율 40% → 60% KR2-2 NPS 55점 이상 KR2-3 추천·바이럴 유입 25% KR2-4 주요 코어 기능(보장분석 GPT, CRM3.0) 개선 3건 이상
:a: [{{DATE}} OK, Action] :1등_메달:가장 중요하고 시급한 일부터 :a:

{{PR_LIST}}`;

function formatPRList(prs: TodayPR[]): string {
  if (prs.length === 0) {
    return '(오늘 생성한 PR이 없습니다)';
  }

  return prs.map((pr, index) => {
    const repoName = pr.repo.split('/').pop() || pr.repo;
    return `${index + 1}. [KR2-4] ${repoName}\n   a. ${pr.title} (#${pr.number})`;
  }).join('\n');
}

function formatDate(): string {
  const today = new Date();
  return format(today, 'M월 d일 EEEE', { locale: ko });
}

function generateReport(template: string, prs: TodayPR[]): string {
  return template
    .replace(/\{\{DATE\}\}/g, formatDate())
    .replace(/\{\{PR_LIST\}\}/g, formatPRList(prs));
}

export default function DailyReportPage() {
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [generatedReport, setGeneratedReport] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // GitHub 연동 상태 조회
  const { data: githubStatus, isLoading: isLoadingGithubStatus } = useQuery({
    queryKey: ['github-status'],
    queryFn: getGithubStatus,
  });

  // 슬랙 템플릿 조회
  const { data: slackTemplateData, isLoading: isLoadingTemplate } = useQuery({
    queryKey: ['slack-template'],
    queryFn: getSlackTemplate,
  });

  // 리포지토리 목록 조회
  const { data: repos, isLoading: isLoadingRepos } = useQuery({
    queryKey: ['github-repos'],
    queryFn: getGithubRepos,
    enabled: githubStatus?.connected === true,
  });

  // 당일 PR 목록 조회
  const {
    data: todayPRs,
    isLoading: isLoadingPRs,
    refetch: refetchPRs,
    isRefetching,
  } = useQuery({
    queryKey: ['today-prs', selectedRepo],
    queryFn: () => getTodayPRs(selectedRepo || undefined),
    enabled: githubStatus?.connected === true,
  });

  // 보고서 생성
  useEffect(() => {
    if (todayPRs && !isLoadingTemplate) {
      const template = slackTemplateData?.template || DEFAULT_SLACK_TEMPLATE;
      setGeneratedReport(generateReport(template, todayPRs));
    }
  }, [todayPRs, slackTemplateData, isLoadingTemplate]);

  // 복사 기능
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedReport);
      setCopied(true);
      toast.success('클립보드에 복사되었습니다');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('복사에 실패했습니다');
    }
  };

  // 새로고침
  const handleRefresh = () => {
    refetchPRs();
  };

  // GitHub 미연동 상태
  if (!isLoadingGithubStatus && !githubStatus?.connected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">일일 보고서</h1>
          <p className="text-muted-foreground">오늘의 PR 기반으로 슬랙 보고서를 자동 생성합니다</p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>GitHub 연동이 필요합니다. 설정에서 GitHub를 연동해주세요.</span>
            <Link href="/settings">
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                설정으로 이동
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">일일 보고서</h1>
          <p className="text-muted-foreground">오늘의 PR 기반으로 슬랙 보고서를 자동 생성합니다</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings">
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              템플릿 설정
            </Button>
          </Link>
        </div>
      </div>

      {/* 필터 영역 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Github className="h-5 w-5" />
            PR 조회 설정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-sm">
              <Select value={selectedRepo || 'all'} onValueChange={(val) => setSelectedRepo(val === 'all' ? '' : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="모든 리포지토리" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 리포지토리</SelectItem>
                  {isLoadingRepos ? (
                    <SelectItem value="loading" disabled>로딩 중...</SelectItem>
                  ) : (
                    repos?.map((repo: GithubRepo) => (
                      <SelectItem key={repo.id} value={repo.fullName}>
                        {repo.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoadingPRs || isRefetching}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 오늘의 PR 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                오늘의 PR
              </span>
              <Badge variant="secondary">
                {isLoadingPRs ? '...' : todayPRs?.length || 0}건
              </Badge>
            </CardTitle>
            <CardDescription>
              {formatDate()} 생성된 PR 목록
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPRs ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : todayPRs && todayPRs.length > 0 ? (
              <div className="space-y-3">
                {todayPRs.map((pr) => (
                  <div
                    key={`${pr.repo}-${pr.number}`}
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            #{pr.number}
                          </Badge>
                          <span className="text-xs text-muted-foreground truncate">
                            {pr.repo.split('/').pop()}
                          </span>
                        </div>
                        <p className="text-sm font-medium truncate">{pr.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={pr.state === 'open' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {pr.state === 'open' ? '열림' : '닫힘'}
                          </Badge>
                          {pr.labels.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {pr.labels.slice(0, 2).join(', ')}
                              {pr.labels.length > 2 && ` +${pr.labels.length - 2}`}
                            </span>
                          )}
                        </div>
                      </div>
                      <a
                        href={pr.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>오늘 생성한 PR이 없습니다</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 생성된 보고서 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>생성된 보고서</span>
              <Button
                variant="default"
                size="sm"
                onClick={handleCopy}
                disabled={!generatedReport}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    복사하기
                  </>
                )}
              </Button>
            </CardTitle>
            <CardDescription>
              아래 내용을 복사하여 슬랙에 붙여넣기 하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTemplate || isLoadingPRs ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <Textarea
                value={generatedReport}
                onChange={(e) => setGeneratedReport(e.target.value)}
                rows={16}
                className="font-mono text-sm resize-none"
                placeholder="보고서가 여기에 생성됩니다..."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
