'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Header } from '@/components/layout/header';
import { useAuthStore } from '@/stores/auth';
import { getMe } from '@/services/auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user: storedUser, setUser, setIsLoading } = useAuthStore();

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getMe,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5분
  });

  useEffect(() => {
    if (user) {
      setUser(user);
      setIsLoading(false);
    }
  }, [user, setUser, setIsLoading]);

  // 미들웨어에서 이미 인증 체크를 하므로 로딩 중일 때만 스켈레톤 표시
  // 저장된 사용자 정보가 있으면 바로 렌더링 (깜빡임 방지)
  if (isUserLoading && !storedUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  const displayUser = user || storedUser;

  if (!displayUser) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
