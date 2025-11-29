import api from '@/lib/api';

// ==================== 기본 GitHub 연동 ====================

export interface GithubStatus {
  connected: boolean;
  username?: string;
  connectedAt?: string;
}

export interface GithubRepo {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  url: string;
  defaultBranch: string;
}

export interface GithubBranch {
  name: string;
  protected: boolean;
}

export interface RepoInfo {
  htmlUrl: string;
  cloneUrl: string;
  sshUrl: string;
  defaultBranch: string;
}

// GitHub 연동 상태 조회
export const getGithubStatus = async (): Promise<GithubStatus> => {
  const response = await api.get('/integrations/github/status');
  return response.data;
};

// GitHub 인증 URL 조회
export const getGithubAuthUrl = async (): Promise<{ authUrl: string }> => {
  const response = await api.get('/integrations/github/auth');
  return response.data;
};

// GitHub 연동 해제
export const disconnectGithub = async (): Promise<void> => {
  await api.delete('/integrations/github');
};

// GitHub 리포지토리 목록 조회
export const getGithubRepos = async (): Promise<GithubRepo[]> => {
  const response = await api.get('/integrations/github/repos');
  return response.data;
};

// ==================== KR2팀 전용 API ====================

export interface Kr2AccessStatus {
  hasAccess: boolean;
  teamId?: string;
  teamName?: string;
  isOwner: boolean;
}

export interface CreateIssueFromGitLogRequest {
  repo: string;
  title: string;
  body: string;
  labels?: string[];
}

export interface CreateIssueResponse {
  issueNumber: number;
  issueUrl: string;
  title: string;
}

export interface GeneratePRTemplateRequest {
  repo: string;
  sourceBranch: string;
  targetBranch?: string;
  commits?: string[];
  changedFiles?: string[];
}

export interface PRTemplateSummary {
  totalCommits: number;
  totalFiles: number;
  changeTypes: Record<string, number>;
  fileStats: Record<string, number>;
}

export interface PRTemplateResponse {
  template: string;
  prCreateUrl: string;
  summary: PRTemplateSummary;
}

// KR2팀 접근 권한 확인
export const checkKr2Access = async (): Promise<Kr2AccessStatus> => {
  const response = await api.get('/integrations/github/kr2/check-access');
  return response.data;
};

// [KR2팀] Git 이력 기반 이슈 생성
export const createIssueFromGitLog = async (
  data: CreateIssueFromGitLogRequest
): Promise<CreateIssueResponse> => {
  const response = await api.post('/integrations/github/kr2/create-issue', data);
  return response.data;
};

// [KR2팀] PR 템플릿 생성
export const generatePRTemplate = async (
  data: GeneratePRTemplateRequest
): Promise<PRTemplateResponse> => {
  const response = await api.post('/integrations/github/kr2/generate-pr-template', data);
  return response.data;
};

// [KR2팀] 브랜치 목록 조회
export const getKr2Branches = async (repo: string): Promise<GithubBranch[]> => {
  const response = await api.get('/integrations/github/kr2/branches', {
    params: { repo },
  });
  return response.data;
};

// [KR2팀] 리포지토리 정보 조회
export const getKr2RepoInfo = async (repo: string): Promise<RepoInfo> => {
  const response = await api.get('/integrations/github/kr2/repo-info', {
    params: { repo },
  });
  return response.data;
};
