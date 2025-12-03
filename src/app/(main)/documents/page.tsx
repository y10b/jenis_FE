'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  FileText,
  MoreHorizontal,
  Trash2,
  Edit,
  Eye,
  Search,
  FolderOpen,
  Star,
  Copy,
  Check,
  Tag,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  toggleFavorite,
} from '@/services/documents';
import { getTeams } from '@/services/teams';
import { useAuthStore } from '@/stores/auth';
import type { TeamDocument } from '@/types';

// 기본 태그 제안
const SUGGESTED_TAGS = ['ENV', '계정정보', '가이드', 'API', '설정', '비밀번호', '서버', 'DB'];

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const canAccessAllTeams =
    user?.role === 'OWNER' || user?.role === 'TEAM_LEAD';

  const [page, setPage] = useState(1);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<TeamDocument | null>(
    null
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 폼 상태
  const [formTeamId, setFormTeamId] = useState<string>('');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: getTeams,
    enabled: canAccessAllTeams,
  });

  const { data: documents, isLoading } = useQuery({
    queryKey: [
      'documents',
      {
        page,
        teamId: canAccessAllTeams ? selectedTeamId : undefined,
        search: searchTerm || undefined,
        tag: selectedTag || undefined,
        favoritesOnly: showFavoritesOnly || undefined,
      },
    ],
    queryFn: () =>
      getDocuments({
        page,
        limit: 12,
        teamId: canAccessAllTeams && selectedTeamId ? selectedTeamId : undefined,
        search: searchTerm || undefined,
        tag: selectedTag || undefined,
        favoritesOnly: showFavoritesOnly || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: createDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('문서가 생성되었습니다.');
      handleCloseCreateDialog();
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || '문서 생성에 실패했습니다.';
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { title?: string; content?: string; tags?: string[] };
    }) => updateDocument(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('문서가 수정되었습니다.');
      handleCloseEditDialog();
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || '문서 수정에 실패했습니다.';
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('문서가 삭제되었습니다.');
      setDeleteDialogOpen(false);
      setSelectedDocument(null);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || '문서 삭제에 실패했습니다.';
      toast.error(message);
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: toggleFavorite,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success(data.message);
    },
    onError: () => {
      toast.error('즐겨찾기 변경에 실패했습니다.');
    },
  });

  const handleOpenCreateDialog = () => {
    setFormTeamId(user?.teamId || '');
    setFormTitle('');
    setFormContent('');
    setFormTags([]);
    setNewTag('');
    setCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setFormTeamId('');
    setFormTitle('');
    setFormContent('');
    setFormTags([]);
    setNewTag('');
  };

  const handleCreate = () => {
    if (!formTitle.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }
    if (!formContent.trim()) {
      toast.error('내용을 입력해주세요.');
      return;
    }
    const teamId = canAccessAllTeams ? formTeamId : user?.teamId;
    if (!teamId) {
      toast.error('팀을 선택해주세요.');
      return;
    }
    createMutation.mutate({
      teamId,
      title: formTitle,
      content: formContent,
      tags: formTags,
    });
  };

  const handleOpenEditDialog = (doc: TeamDocument) => {
    setSelectedDocument(doc);
    setFormTitle(doc.title);
    setFormContent(doc.content);
    setFormTags(doc.tags || []);
    setNewTag('');
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedDocument(null);
    setFormTitle('');
    setFormContent('');
    setFormTags([]);
    setNewTag('');
  };

  const handleUpdate = () => {
    if (!selectedDocument) return;
    if (!formTitle.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }
    if (!formContent.trim()) {
      toast.error('내용을 입력해주세요.');
      return;
    }
    updateMutation.mutate({
      id: selectedDocument.id,
      data: { title: formTitle, content: formContent, tags: formTags },
    });
  };

  const handleOpenViewDialog = (doc: TeamDocument) => {
    setSelectedDocument(doc);
    setViewDialogOpen(true);
  };

  const handleCopyContent = async (content: string, docId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(docId);
      toast.success('내용이 클립보드에 복사되었습니다.');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  const handleAddTag = () => {
    const tag = newTag.trim();
    if (tag && !formTags.includes(tag)) {
      setFormTags([...formTags, tag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormTags(formTags.filter((t) => t !== tagToRemove));
  };

  const handleAddSuggestedTag = (tag: string) => {
    if (!formTags.includes(tag)) {
      setFormTags([...formTags, tag]);
    }
  };

  const canEditDocument = (doc: TeamDocument) => {
    return canAccessAllTeams || doc.creatorId === user?.id;
  };

  // 사용 가능한 태그 목록
  const availableTags = documents?.allTags || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">팀 문서</h1>
          <p className="text-muted-foreground">
            {canAccessAllTeams
              ? '모든 팀의 문서를 관리하세요'
              : '팀 내에서 공유되는 문서를 관리하세요'}
          </p>
        </div>
        <Button onClick={handleOpenCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          새 문서
        </Button>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* 상단: 검색 및 팀 필터 */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="제목 또는 내용으로 검색..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
              {canAccessAllTeams && (
                <Select
                  value={selectedTeamId || 'all'}
                  onValueChange={(v) => {
                    setSelectedTeamId(v === 'all' ? '' : v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="팀 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 팀</SelectItem>
                    {teams?.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* 중간: 태그 필터 및 즐겨찾기 */}
            <div className="flex flex-wrap items-center gap-2">
              <Tabs
                value={showFavoritesOnly ? 'favorites' : 'all'}
                onValueChange={(v) => {
                  setShowFavoritesOnly(v === 'favorites');
                  setPage(1);
                }}
              >
                <TabsList className="h-8">
                  <TabsTrigger value="all" className="text-xs px-3 h-7">
                    전체
                  </TabsTrigger>
                  <TabsTrigger value="favorites" className="text-xs px-3 h-7">
                    <Star className="h-3 w-3 mr-1" />
                    즐겨찾기
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="h-6 w-px bg-border mx-1" />

              <div className="flex items-center gap-1">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground mr-1">태그:</span>
              </div>

              {selectedTag && (
                <Badge
                  variant="default"
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedTag('');
                    setPage(1);
                  }}
                >
                  {selectedTag}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}

              {availableTags
                .filter((t) => t !== selectedTag)
                .slice(0, 8)
                .map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => {
                      setSelectedTag(tag);
                      setPage(1);
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 문서 목록 */}
      {isLoading ? (
        <DocumentsPageSkeleton />
      ) : documents && documents.data.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.data.map((doc) => (
            <Card
              key={doc.id}
              className="cursor-pointer hover:shadow-md transition-shadow relative"
              onClick={() => handleOpenViewDialog(doc)}
            >
              {/* 즐겨찾기 표시 */}
              {doc.isFavorite && (
                <div className="absolute top-2 right-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between pr-6">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {doc.title}
                    </CardTitle>
                    <CardDescription className="mt-1 flex flex-wrap gap-1">
                      {doc.team?.name && (
                        <Badge variant="outline" className="text-xs">
                          {doc.team.name}
                        </Badge>
                      )}
                      {doc.tags?.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {doc.tags && doc.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{doc.tags.length - 2}
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenViewDialog(doc);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        보기
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyContent(doc.content, doc.id);
                        }}
                      >
                        {copiedId === doc.id ? (
                          <Check className="mr-2 h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="mr-2 h-4 w-4" />
                        )}
                        내용 복사
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          favoriteMutation.mutate(doc.id);
                        }}
                      >
                        <Star
                          className={`mr-2 h-4 w-4 ${doc.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`}
                        />
                        {doc.isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
                      </DropdownMenuItem>
                      {canEditDocument(doc) && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditDialog(doc);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            수정
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDocument(doc);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            삭제
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {doc.content}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage
                        src={doc.creator?.profileImageUrl || undefined}
                      />
                      <AvatarFallback className="text-[10px]">
                        {doc.creator?.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{doc.creator?.name}</span>
                  </div>
                  <span>
                    {formatDistanceToNow(new Date(doc.updatedAt), {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || selectedTag || showFavoritesOnly
                ? '검색 결과가 없습니다.'
                : '등록된 문서가 없습니다.'}
            </p>
            {!searchTerm && !selectedTag && !showFavoritesOnly && (
              <Button className="mt-4" onClick={handleOpenCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                첫 문서 만들기
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* 페이지네이션 */}
      {documents && documents.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            이전
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {documents.meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPage((p) => Math.min(documents.meta.totalPages, p + 1))
            }
            disabled={page === documents.meta.totalPages}
          >
            다음
          </Button>
        </div>
      )}

      {/* 문서 생성 다이얼로그 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>새 문서</DialogTitle>
            <DialogDescription>
              팀 내에서 공유할 새 문서를 작성합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {canAccessAllTeams && (
              <div className="space-y-2">
                <Label>팀 선택</Label>
                <Select value={formTeamId} onValueChange={setFormTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="팀을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams?.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="문서 제목을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label>태그</Label>
              <div className="flex flex-wrap gap-1 mb-2">
                {formTags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                    <button
                      type="button"
                      className="ml-1 hover:text-destructive"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="새 태그 입력"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  추가
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-xs text-muted-foreground mr-1">
                  추천 태그:
                </span>
                {SUGGESTED_TAGS.filter((t) => !formTags.includes(t)).map(
                  (tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer text-xs hover:bg-accent"
                      onClick={() => handleAddSuggestedTag(tag)}
                    >
                      + {tag}
                    </Badge>
                  )
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">내용</Label>
              <Textarea
                id="content"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="문서 내용을 입력하세요 (환경변수, 계정 정보 등)"
                rows={12}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseCreateDialog}>
              취소
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? '생성 중...' : '생성'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 문서 수정 다이얼로그 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>문서 수정</DialogTitle>
            <DialogDescription>문서 내용을 수정합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="edit-title">제목</Label>
              <Input
                id="edit-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="문서 제목을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label>태그</Label>
              <div className="flex flex-wrap gap-1 mb-2">
                {formTags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                    <button
                      type="button"
                      className="ml-1 hover:text-destructive"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="새 태그 입력"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  추가
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-xs text-muted-foreground mr-1">
                  추천 태그:
                </span>
                {SUGGESTED_TAGS.filter((t) => !formTags.includes(t)).map(
                  (tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer text-xs hover:bg-accent"
                      onClick={() => handleAddSuggestedTag(tag)}
                    >
                      + {tag}
                    </Badge>
                  )
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-content">내용</Label>
              <Textarea
                id="edit-content"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="문서 내용을 입력하세요"
                rows={12}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseEditDialog}>
              취소
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? '수정 중...' : '수정'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 문서 보기 다이얼로그 */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <DialogTitle>{selectedDocument?.title}</DialogTitle>
              {selectedDocument?.isFavorite && (
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              )}
            </div>
            <DialogDescription>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {selectedDocument?.team && (
                  <Badge variant="outline">{selectedDocument.team.name}</Badge>
                )}
                {selectedDocument?.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage
                      src={
                        selectedDocument?.creator?.profileImageUrl || undefined
                      }
                    />
                    <AvatarFallback className="text-[10px]">
                      {selectedDocument?.creator?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{selectedDocument?.creator?.name}</span>
                </div>
                {selectedDocument && (
                  <span className="text-xs">
                    마지막 수정:{' '}
                    {formatDistanceToNow(new Date(selectedDocument.updatedAt), {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </span>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 bg-muted rounded-lg relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={() =>
                selectedDocument &&
                handleCopyContent(selectedDocument.content, selectedDocument.id)
              }
            >
              {copiedId === selectedDocument?.id ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <pre className="whitespace-pre-wrap font-mono text-sm pr-8">
              {selectedDocument?.content}
            </pre>
          </div>
          <DialogFooter className="gap-2">
            {selectedDocument && (
              <Button
                variant="outline"
                onClick={() => favoriteMutation.mutate(selectedDocument.id)}
              >
                <Star
                  className={`mr-2 h-4 w-4 ${selectedDocument.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`}
                />
                {selectedDocument.isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
              </Button>
            )}
            {selectedDocument && canEditDocument(selectedDocument) && (
              <Button
                variant="outline"
                onClick={() => {
                  setViewDialogOpen(false);
                  handleOpenEditDialog(selectedDocument);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                수정
              </Button>
            )}
            <Button onClick={() => setViewDialogOpen(false)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>문서 삭제</DialogTitle>
            <DialogDescription>
              &apos;{selectedDocument?.title}&apos; 문서를 삭제하시겠습니까? 이
              작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                selectedDocument && deleteMutation.mutate(selectedDocument.id)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocumentsPageSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-5 w-20" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-16 w-full" />
            <div className="mt-4 flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
