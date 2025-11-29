'use client';

import { Settings, Building2, Users, Shield } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/stores/auth';

export default function AdminSettingsPage() {
  const { user } = useAuthStore();

  // OWNER나 HEAD가 아니면 접근 제한
  if (user?.role !== 'OWNER' && user?.role !== 'HEAD') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">접근 권한이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">관리자 설정</h1>
        <p className="text-muted-foreground">시스템 설정을 관리합니다</p>
      </div>

      {/* 조직 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            조직 정보
          </CardTitle>
          <CardDescription>조직의 기본 정보입니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">조직명</p>
              <p className="font-medium">InTalk</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">플랜</p>
              <p className="font-medium">Enterprise</p>
            </div>
            <Badge>활성</Badge>
          </div>
        </CardContent>
      </Card>

      {/* 시스템 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            시스템 정보
          </CardTitle>
          <CardDescription>현재 시스템 상태 및 버전 정보입니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">API 버전</p>
              <p className="font-medium">v1.0.0</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">프론트엔드 버전</p>
              <p className="font-medium">v1.0.0</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 권한 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            역할 및 권한
          </CardTitle>
          <CardDescription>시스템의 역할별 권한 설명입니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <Badge>OWNER</Badge>
              <div>
                <p className="font-medium">대표</p>
                <p className="text-sm text-muted-foreground">
                  모든 기능에 대한 접근 권한을 가집니다. 사용자 승인, 팀 관리, 시스템 설정 등을 관리할 수 있습니다.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <Badge variant="secondary">HEAD</Badge>
              <div>
                <p className="font-medium">헤드</p>
                <p className="text-sm text-muted-foreground">
                  팀 관리 및 멤버 관리 권한을 가집니다. 사용자 승인 및 팀원 배정이 가능합니다.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <Badge variant="outline">LEAD</Badge>
              <div>
                <p className="font-medium">리드</p>
                <p className="text-sm text-muted-foreground">
                  팀 내 업무 및 스케줄을 관리할 수 있습니다. 팀원들의 업무 현황을 확인할 수 있습니다.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <Badge variant="outline">ACTOR</Badge>
              <div>
                <p className="font-medium">멤버</p>
                <p className="text-sm text-muted-foreground">
                  기본 사용자 권한입니다. 자신의 업무, 스케줄, 회고를 관리할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
