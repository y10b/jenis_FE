'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Shield, ShieldCheck, ShieldX, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { verifyIp } from '@/services/ip';

export default function IpVerificationPage() {
  const router = useRouter();

  // 페이지 로드 시 자동으로 IP 검증
  const { data: verificationResult, isLoading, refetch } = useQuery({
    queryKey: ['ip-verify'],
    queryFn: verifyIp,
    retry: false,
    staleTime: 0,
  });

  // IP가 허용되면 로그인 페이지로 자동 이동
  useEffect(() => {
    if (verificationResult?.isAllowed) {
      const timer = setTimeout(() => {
        router.push('/login');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [verificationResult, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            {isLoading ? (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            ) : verificationResult?.isAllowed ? (
              <ShieldCheck className="h-8 w-8 text-green-600" />
            ) : (
              <ShieldX className="h-8 w-8 text-destructive" />
            )}
          </div>
          <CardTitle className="text-2xl">InTalk Backoffice</CardTitle>
          <CardDescription>
            보안을 위해 IP 주소 확인이 필요합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                IP 주소를 확인하고 있습니다...
              </p>
            </div>
          ) : verificationResult?.isAllowed ? (
            <div className="text-center space-y-4">
              <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  접근이 허용된 IP입니다
                </p>
                <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                  {verificationResult.ip}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                로그인 페이지로 이동 중...
              </p>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="rounded-lg bg-destructive/10 p-4">
                <p className="text-sm font-medium text-destructive">
                  접근이 허용되지 않은 IP입니다
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {verificationResult?.ip || '알 수 없음'}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                관리자에게 문의하여 IP 등록을 요청해주세요.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => refetch()}
              >
                다시 확인
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
