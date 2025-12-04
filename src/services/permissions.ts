import api from '@/lib/api';

export interface Feature {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  isActive: boolean;
  defaultRoles: string[];
}

export interface FeaturesByCategory {
  [category: string]: Feature[];
}

export interface Permission {
  code: string;
  name: string;
  category: string;
  source: 'role' | 'custom';
  granted: boolean;
  expiresAt?: string;
}

export interface CustomPermission {
  code: string;
  name: string;
  category: string;
  expiresAt?: string;
}

export interface UserPermissions {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  permissions: {
    [category: string]: Permission[];
  };
  customPermissions: CustomPermission[];
  allPermissionCodes: string[];
}

export interface GrantPermissionRequest {
  userId: string;
  featureCode: string;
  granted?: boolean;
  expiresAt?: string;
}

export interface BulkGrantPermissionRequest {
  userId: string;
  featureCodes: string[];
  granted?: boolean;
  expiresAt?: string;
}

// 모든 기능 목록 조회
export const getAllFeatures = async (): Promise<FeaturesByCategory> => {
  const response = await api.get<FeaturesByCategory>('/permissions/features');
  return response.data;
};

// 기능 초기화 (OWNER만)
export const initializeFeatures = async () => {
  const response = await api.post('/permissions/features/initialize');
  return response.data;
};

// 내 권한 조회
export const getMyPermissions = async (): Promise<UserPermissions> => {
  const response = await api.get<UserPermissions>('/permissions/my-permissions');
  return response.data;
};

// 특정 사용자 권한 조회
export const getUserPermissions = async (userId: string): Promise<UserPermissions> => {
  const response = await api.get<UserPermissions>(`/permissions/users/${userId}`);
  return response.data;
};

// 권한 부여
export const grantPermission = async (data: GrantPermissionRequest) => {
  const response = await api.post('/permissions/grant', data);
  return response.data;
};

// 권한 일괄 부여
export const bulkGrantPermissions = async (data: BulkGrantPermissionRequest) => {
  const response = await api.post('/permissions/grant/bulk', data);
  return response.data;
};

// 권한 제거
export const revokePermission = async (userId: string, featureCode: string) => {
  const response = await api.delete(`/permissions/users/${userId}/${featureCode}`);
  return response.data;
};

// 특정 기능 보유 사용자 조회
export const getUsersWithPermission = async (featureCode: string) => {
  const response = await api.get(`/permissions/features/${featureCode}/users`);
  return response.data;
};
