# Jenis Backoffice - Frontend

InTalk 백오피스 프론트엔드 애플리케이션입니다.

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **Form**: React Hook Form
- **HTTP Client**: Axios

## 주요 기능

- **인증**: 로그인, 회원가입, JWT 토큰 기반 인증
- **대시보드**: 업무 통계, 마감 임박 업무, 팀별 현황
- **업무 관리**: 업무 생성/수정/삭제, 상태 관리, 댓글, 히스토리
- **팀 관리**: 팀 생성, 멤버 관리
- **회고록**: 주간/중간/월간 회고 작성 및 공유
- **일정 관리**: 회의, 리마인더, 리포트 일정 관리
- **알림**: 실시간 알림 (WebSocket)

## 시작하기

### 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start
```

개발 서버는 [http://localhost:8080](http://localhost:8080)에서 실행됩니다.

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── (auth)/            # 인증 관련 페이지 (로그인, 회원가입)
│   └── (main)/            # 메인 페이지들
│       ├── admin/         # 관리자 페이지
│       ├── dashboard/     # 대시보드
│       ├── tasks/         # 업무 관리
│       ├── teams/         # 팀 관리
│       ├── retrospectives/# 회고록
│       ├── schedules/     # 일정 관리
│       └── notifications/ # 알림
├── components/            # 재사용 가능한 컴포넌트
│   ├── ui/               # shadcn/ui 컴포넌트
│   └── layout/           # 레이아웃 컴포넌트
├── services/             # API 서비스 함수
├── stores/               # Zustand 스토어
├── types/                # TypeScript 타입 정의
└── lib/                  # 유틸리티 함수
```

## 배포

Vercel을 통한 배포를 권장합니다.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/y10b/jenis_FE)

### 환경 변수 (Vercel)

- `NEXT_PUBLIC_API_URL`: 백엔드 API URL

## 라이선스

MIT
