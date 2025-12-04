'use client';

import {
  LayoutDashboard,
  ListTodo,
  Users,
  Calendar,
  BookOpen,
  Bell,
  Settings,
  Shield,
  LogOut,
  ChevronUp,
  User2,
  FileText,
  FolderOpen,
  KeyRound,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/auth';
import { logout } from '@/services/auth';
import { toast } from 'sonner';

const mainMenuItems = [
  {
    title: '대시보드',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: '업무',
    url: '/tasks',
    icon: ListTodo,
  },
  {
    title: '팀',
    url: '/teams',
    icon: Users,
  },
  {
    title: '스케줄',
    url: '/schedules',
    icon: Calendar,
  },
  {
    title: '회고',
    url: '/retrospectives',
    icon: BookOpen,
  },
  {
    title: '알림',
    url: '/notifications',
    icon: Bell,
  },
  {
    title: '일일 보고서',
    url: '/daily-report',
    icon: FileText,
  },
  {
    title: '팀 문서',
    url: '/documents',
    icon: FolderOpen,
  },
];

const adminMenuItems = [
  {
    title: '사용자 관리',
    url: '/admin/users',
    icon: Shield,
  },
  {
    title: '역할별 권한',
    url: '/admin/roles',
    icon: KeyRound,
  },
  {
    title: '설정',
    url: '/admin/settings',
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout: logoutStore } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
      logoutStore();
      router.push('/login');
      toast.success('로그아웃되었습니다.');
    } catch {
      toast.error('로그아웃에 실패했습니다.');
    }
  };

  const isAdmin = user?.role === 'OWNER' || user?.role === 'TEAM_LEAD' || user?.role === 'HEAD';

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="font-semibold text-sm text-primary-foreground">IT</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold tracking-tight">InTalk</span>
            <span className="text-[11px] text-muted-foreground">Backoffice</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
            메뉴
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.url)}
                    className="h-9 px-3 rounded-md text-sm font-normal"
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup className="p-0 mt-4">
            <SidebarGroupLabel className="px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              관리
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.url)}
                      className="h-9 px-3 rounded-md text-sm font-normal"
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="h-auto py-2 px-2 rounded-md data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-md">
                    <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.name} />
                    <AvatarFallback className="rounded-md text-xs">
                      {user?.name?.charAt(0) || <User2 className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-sm font-medium">{user?.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                  <ChevronUp className="ml-auto h-4 w-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-52"
                side="top"
                align="end"
                sideOffset={8}
              >
                <DropdownMenuItem asChild className="gap-2 text-sm">
                  <Link href="/profile">
                    <User2 className="h-4 w-4" />
                    프로필
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="gap-2 text-sm">
                  <Link href="/settings">
                    <Settings className="h-4 w-4" />
                    설정
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="gap-2 text-sm text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
