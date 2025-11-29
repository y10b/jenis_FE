import api from '@/lib/api';

export type AttendanceType = 'CHECK_IN' | 'CHECK_OUT';

export interface Attendance {
  id: string;
  userId: string;
  type: AttendanceType;
  note: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    profileImageUrl: string | null;
    team?: {
      id: string;
      name: string;
    } | null;
  };
}

export interface TodayStatus {
  checkIn: Attendance | null;
  checkOut: Attendance | null;
  isCheckedIn: boolean;
  isCheckedOut: boolean;
}

export interface CreateAttendanceRequest {
  type: AttendanceType;
  note?: string;
}

// 출퇴근 기록
export const createAttendance = async (data: CreateAttendanceRequest): Promise<Attendance> => {
  const response = await api.post<Attendance>('/attendance', data);
  return response.data;
};

// 오늘의 출퇴근 상태 조회
export const getTodayStatus = async (): Promise<TodayStatus> => {
  const response = await api.get<TodayStatus>('/attendance/today');
  return response.data;
};

// 출퇴근 기록 목록 조회 (관리자용)
export const getAttendances = async (params?: {
  date?: string;
  teamId?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: Attendance[]; meta: { total: number; page: number; limit: number; totalPages: number } }> => {
  const response = await api.get('/attendance', { params });
  return response.data;
};
