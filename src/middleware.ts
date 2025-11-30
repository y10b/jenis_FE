import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// 인증이 필요하지 않은 경로
const authPaths = ['/login', '/signup'];

/**
 * IP 화이트리스트 검증 API 호출
 */
async function verifyIp(request: NextRequest): Promise<{ ip: string; isAllowed: boolean }> {
  try {
    // 클라이언트 IP 가져오기
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0]?.trim() || realIp || '127.0.0.1';

    const response = await fetch(`${API_URL}/ip/verify`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': ip,
        'X-Real-IP': ip,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      // API 오류 시 기본적으로 허용 (서버 다운 등의 상황)
      return { ip, isAllowed: true };
    }

    const data = await response.json();
    // 백엔드 응답이 { success: true, data: { ip, isAllowed } } 형태인 경우 처리
    if (data.success && data.data) {
      return data.data;
    }
    return data;
  } catch (error) {
    // 네트워크 오류 시 기본적으로 허용
    console.error('IP verification failed:', error);
    return { ip: 'unknown', isAllowed: true };
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 쿠키에서 토큰 확인 - accessToken이 있어야 실제 인증된 상태
  const accessToken = request.cookies.get('accessToken');
  const hasAuth = !!accessToken;

  // 로그인/회원가입 페이지 여부 확인
  const isAuthPath = authPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // 루트 페이지(화이트리스트 페이지)
  if (pathname === '/') {
    // IP 검증
    const { isAllowed } = await verifyIp(request);

    // IP가 허용되고 로그인 정보가 있으면 대시보드로 이동
    if (isAllowed && hasAuth) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // 그 외에는 화이트리스트 페이지 표시
    return NextResponse.next();
  }

  // 로그인/회원가입 페이지
  if (isAuthPath) {
    // IP 검증
    const { isAllowed } = await verifyIp(request);

    // IP가 허용되지 않으면 화이트리스트 페이지로
    if (!isAllowed) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // 이미 로그인된 사용자가 로그인/회원가입 페이지 접근 시 대시보드로 리다이렉트
    if (hasAuth) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  }

  // 보호된 경로 (대시보드 등)
  // 1. IP 검증
  const { isAllowed } = await verifyIp(request);

  // IP가 허용되지 않으면 화이트리스트 페이지로
  if (!isAllowed) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2. 인증 없으면 로그인 페이지로
  if (!hasAuth) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
