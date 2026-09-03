# groovy-frontend

## 1. Repo: groovy-frontend

`groovy-frontend`는 **React + Vite 기반 프론트엔드**를 담은 저장소입니다.

## 2. 페이지 구성

### `src/pages/`

| 페이지 | 설명 |
| :--- | :--- |
| `LoginPage` / `SignupPage` | 로그인 / 회원가입 |
| `StudyListPage` / `StudyDetailPage` / `StudyFormPage` | 스터디 목록 / 상세 / 생성·수정 |
| `StudyApplicationsPage` | 스터디 신청자 목록 (방장 전용) |
| `MemoirListPage` / `MemoirDetailPage` / `MemoirFormPage` | 회고록 목록 / 상세 / 작성·수정 |
| `CalendarPage` | 통합 캘린더 |
| `NotificationsPage` | 알림 목록 |
| `MyPage` | 마이페이지 |
| `NotFoundPage` | 404 |

## 3. 시스템 아키텍처

```
groovy-frontend (React SPA, S3+CloudFront 정적 배포, www.groovy-team26.com)
        │  fetch (VITE_API_BASE_URL, credentials: "include")
        ▼
Istio ingress gateway (api.groovy-team26.com)
        │
        ├─▶ identity-service   (/api/auth, /api/users/me, /api/tags)
        ├─▶ study-service      (/api/studies, /api/users/me/studies, /applications)
        ├─▶ content-service    (/api/memoirs)
        ├─▶ calendar-service   (/api/calendars)
        └─▶ notification-service (/api/notifications, SSE)
```

이 레포는 **DB를 갖지 않는 순수 클라이언트**입니다. 백엔드 서비스가 어떻게 나뉘어 있는지는
전혀 알 필요가 없고, api 도메인 하나만 바라봅니다.

## 4. 기술 스택

| 카테고리 | 기술 | 비고 |
| :--- | :--- | :--- |
| Framework | React 19 | |
| Routing | react-router-dom 7 | `createBrowserRouter` (`src/routes.tsx`) |
| Build Tool | Vite | `tsc -b && vite build` |
| Language | TypeScript | |
| Lint | oxlint | |
| 상태관리 | React Context API (`src/context/`) | `AuthContext`, `NotificationContext` — 별도 상태관리 라이브러리 미사용 |
| HTTP Client | 자체 `fetch` 래퍼 (`src/api/client.ts`) | axios 미사용 |
| 실시간 알림 | `EventSource` (SSE) | `NotificationContext`에서 구독 |
| Markdown | react-markdown, remark-gfm, remark-breaks | 회고록 본문 렌더링 |

## 5. MSA 모듈과의 통신 관계

| API 모듈(`src/api/`) | 호출 대상(경유: api-gateway) | 용도 |
| :--- | :--- | :--- |
| `auth.ts` | identity-service | 회원가입/로그인/로그아웃 |
| `users.ts` | identity-service | 내 정보 조회 |
| `tags.ts` | identity-service | 태그 목록/선호 태그 |
| `studies.ts` | study-service | 스터디 CRUD/신청/대기열 |
| `memoirs.ts` | content-service | 회고록/댓글/좋아요 |
| `calendars.ts` | calendar-service | 일정 CRUD |
| `notifications.ts` | notification-service | 알림 목록/읽음 처리/SSE 구독 |


## 6. 로컬 실행 방법

```bash
npm ci
cp .env.example .env    # VITE_API_BASE_URL 설정 (기본값: http://localhost:8080)
npm run dev              # http://localhost:5173
```

```bash
# 프로덕션 빌드
npm run build
npm run preview
```


## 7. 배포

`main`에 push되면 `.github/workflows/build-and-deploy.yml`이 빌드 후 S3(`groovy-prod-frontend-*`)에
업로드하고 CloudFront 캐시를 무효화합니다. 컨테이너 이미지를 만들어 배포하던 방식(Dockerfile,
docker-entrypoint.sh)은 S3+CloudFront 정적 배포로 전환하면서 제거했습니다 — 환경별로 같은
이미지를 재사용할 필요가 없어져서, 런타임 환경변수 주입(`env-config.js`) 없이 빌드타임에
`VITE_API_BASE_URL`을 고정합니다.