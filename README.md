# groovy-frontend

## 1. 이 레포는 무엇인가

**Groovy**는 태그 기반으로 스터디 그룹을 매칭하고, 참여 신청/승인, 캘린더 일정 관리, 회고록 공유,
실시간 알림까지 지원하는 스터디 커뮤니티 플랫폼입니다. 백엔드는 하나의 Spring Boot 모놀리스에서
도메인별 마이크로서비스로 전환되었고, 지금은 서비스별 폴리레포로 분리되는 중입니다.

`groovy-frontend`는 그중 **React + Vite 기반 프론트엔드**를 담은 저장소입니다. 백엔드 도메인
서비스들과는 순수 HTTP 계약(`VITE_API_BASE_URL` 하나)으로만 통신하며, 공유 라이브러리나 DB
의존이 전혀 없어 6개 폴리레포 중 결합도가 가장 낮습니다.

## 2. 주요 기능

- **회원**: 회원가입 / 로그인 / 로그아웃, 마이페이지
- **스터디**: 스터디 그룹 생성/조회/수정/삭제, 참여 신청/승인/거절, 대기열 신청
- **회고록**: 회고록 작성/조회/수정/삭제, 댓글, 좋아요 (Markdown 렌더링 지원)
- **캘린더**: 개인 일정과 스터디 공식 일정 통합 조회/추가
- **태그**: 선호 태그 설정, 태그 기반 매칭 스터디 탐색
- **알림**: SSE 기반 실시간 알림 수신, 읽음 처리

### 페이지 구성 (`src/pages/`)

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
groovy-frontend (React SPA, 정적 파일)
        │  fetch (VITE_API_BASE_URL, credentials: "include")
        ▼
api-gateway :8080
        │
        ├─▶ identity-service   (/api/auth, /api/users/me, /api/tags)
        ├─▶ study-service      (/api/studies, /api/users/me/studies, /applications)
        ├─▶ content-service    (/api/memoirs)
        ├─▶ calendar-service   (/api/calendars)
        └─▶ notification-service (/api/notifications, SSE)
```

이 레포는 **DB를 갖지 않는 순수 클라이언트**입니다. 백엔드 서비스가 어떻게 나뉘어 있는지는
전혀 알 필요가 없고, api-gateway 주소 하나만 바라봅니다. 인증은 로그인 API 응답으로 받은 JWT를
저장(`api/tokenStore.ts`)해 이후 요청 헤더에 실어 보내는 방식입니다.

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

## 5. 다른 MSA 서비스와의 네트워크 호출 관계

| API 모듈(`src/api/`) | 호출 대상(경유: api-gateway) | 용도 |
| :--- | :--- | :--- |
| `auth.ts` | identity-service | 회원가입/로그인/로그아웃 |
| `users.ts` | identity-service | 내 정보 조회 |
| `tags.ts` | identity-service | 태그 목록/선호 태그 |
| `studies.ts` | study-service | 스터디 CRUD/신청/대기열 |
| `memoirs.ts` | content-service | 회고록/댓글/좋아요 |
| `calendars.ts` | calendar-service | 일정 CRUD |
| `notifications.ts` | notification-service | 알림 목록/읽음 처리/SSE 구독 |

프론트는 백엔드가 몇 개의 서비스로 나뉘어 있는지 알지 못합니다 — 모든 요청이 `VITE_API_BASE_URL`
(api-gateway) 하나로만 나가고, 실제 어느 서비스가 응답하는지는 게이트웨이 라우팅 규칙이
결정합니다.

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

```bash
# Docker 이미지로 빌드 (VITE_API_BASE_URL은 vite 특성상 빌드타임 ARG로 주입)
docker build -t groovy-frontend --build-arg VITE_API_BASE_URL=http://localhost:8080 .
docker run -p 5173:5173 groovy-frontend
```

> 백엔드 API가 준비되지 않은 동안은 각 `src/api/*` 호출이 실패하지만 화면 자체는 뜹니다.
> api-gateway를 포함한 전체 백엔드까지 함께 확인하려면 원본 `Groovy` 레포의
> `docker-compose.local.yml`을 사용하는 것을 권장합니다. `VITE_API_BASE_URL`은 빌드타임에
> 번들에 박히므로, API 주소가 바뀌면 이미지를 다시 빌드해야 합니다.

## 7. 기존 모노레포에서 뗀 부분

1. **레거시 단일 모놀리스** (`groovy/` + `front/`): 백엔드와 프론트엔드가 같은 저장소 안에
   나란히 있었지만, 처음부터 `front/`가 백엔드 소스와 상위 디렉토리 참조 없이 API 계약
   (`VITE_API_BASE_URL`)만으로 통신하는 자체 완결 구조였습니다.
2. **폴리레포 분리** (지금 이 레포): 6개 폴리레포 중 **가장 먼저, 코드 수정 없이 즉시 분리**된
   레포입니다. `front/` 디렉토리 전체(재생성 가능한 `node_modules`/`dist`/`.env.local` 제외)를
   그대로 복사했고, `package.json`의 이름(`groovy-front` → `groovy-frontend`)과 `.gitignore`/
   `.dockerignore`/CI 워크플로우 경로만 독립 레포 기준으로 조정했습니다. 백엔드가 어떻게
   6개 서비스로 갈라지는지와 무관하게 동작하는 구조라, 폴리레포 전환 순서에서도 후속 조치가
   가장 적었습니다. 격리 판단 근거는 원본 `Groovy` 레포의 `docs/transfer/groovy-frontend.md`에
   기록되어 있습니다.

## 8. 모니터링 스택에서 관측되는 부분

- 프론트엔드는 Spring Boot 서비스들과 달리 `/actuator/prometheus` 같은 메트릭 엔드포인트가
  없어 **Prometheus/Grafana 스택의 관측 대상이 아닙니다.**
- 대신 정적 파일을 `serve`로 서빙하는 컨테이너이므로, 컨테이너 단위 리소스 지표(CPU/메모리)는
  운영 환경의 cAdvisor/node-exporter로 간접 관측될 수 있습니다.
- 브라우저에서 발생하는 에러나 API 호출 실패는 이 레포에 별도 수집 파이프라인(Sentry 등)이
  붙어 있지 않아, 실제 장애 시 원인 파악은 브라우저 개발자 도구 또는 백엔드 쪽(api-gateway
  진입 시점부터 시작되는 Tempo 트레이스, Loki 로그)에서 이루어집니다.
