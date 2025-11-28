'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from '@/services/notifications';
import type { Notification } from '@/types';

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications({ limit: 50 }),
  });

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(data.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('알림이 삭제되었습니다.');
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: deleteAllNotifications,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(data.message);
    },
  });

  const handleMarkAsRead = (notification: Notification) => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }
  };

  if (isLoading) {
    return <NotificationsPageSkeleton />;
  }

  const unreadCount = data?.meta.unreadCount || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">알림</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount}개의 읽지 않은 알림이 있습니다.` : '모든 알림을 확인했습니다.'}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              모두 읽음
            </Button>
          )}
          {data && data.data.length > 0 && (
            <Button
              variant="outline"
              onClick={() => deleteAllMutation.mutate()}
              disabled={deleteAllMutation.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              모두 삭제
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {data && data.data.length > 0 ? (
            <div className="divide-y">
              {data.data.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors ${
                    !notification.isRead ? 'bg-muted/30' : ''
                  }`}
                  onClick={() => handleMarkAsRead(notification)}
                >
                  <div
                    className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                      notification.isRead ? 'bg-transparent' : 'bg-primary'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{notification.title}</p>
                    {notification.content && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.content}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          markReadMutation.mutate(notification.id);
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(notification.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">알림이 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-5 w-48 mt-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
      <Card>
        <CardContent className="p-0 divide-y">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-4">
              <Skeleton className="h-2 w-2 rounded-full mt-2" />
              <div className="flex-1">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full mt-1" />
                <Skeleton className="h-3 w-24 mt-2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
