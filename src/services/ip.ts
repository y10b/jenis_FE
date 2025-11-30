import api from '@/lib/api';

export interface IpVerificationResponse {
  ip: string;
  isAllowed: boolean;
}

/**
 * 현재 IP 확인 및 화이트리스트 검증
 */
export const verifyIp = async (): Promise<IpVerificationResponse> => {
  const response = await api.get<IpVerificationResponse>('/ip/verify');
  return response.data;
};
