# 동적 앱 전환 메모

현재 구현은 PWA 설치 조건과 로컬 계정/로컬 공유게시판 흐름을 갖춘 1차 전환 단계입니다.

## 현재 완료된 기반

- `manifest.webmanifest`와 `sw.js`로 PWA 설치/오프라인 캐시 기반 추가
- `assets/icons/`에 192px, 512px, SVG 앱 아이콘 추가
- 이름/비밀번호로 입장하는 계정 흐름 추가
- 서버 API 사용 시 세션 토큰으로 게시글 등록/삭제 권한 확인
- 서버 비밀번호 저장은 `salt + pbkdf2-sha256` 기반
- 서버 세션 토큰은 8시간 만료 시간 포함
- 현재 보드 상태를 공유게시판에 저장하고 다시 불러오는 게시판 추가
- `/api/auth`, `/api/posts` 서버리스 API 초안 추가
- `api/_storage.js`로 저장소 어댑터 추가
- `KV_REST_API_URL`, `KV_REST_API_TOKEN`이 있으면 Vercel KV / Upstash Redis REST에 저장
- API가 없는 정적 로컬 환경에서는 `localStorage`로 자동 fallback
- 앱 내부 데이터 구조는 `tiles`, `mode`, `templateId`, `objectId`, `objectScale`을 게시글 형태로 저장

## 실제 온라인 공유게시판으로 바꾸는 다음 단계

프론트는 이미 API 우선, 로컬 fallback 구조입니다. 서버리스 API는 저장소 어댑터를 통해 동작합니다.

- Vercel 프로젝트에 KV/Upstash를 연결하고 아래 환경변수를 설정하면 게시판/계정이 서버 저장소를 사용합니다.
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- 환경변수가 없으면 서버 메모리 저장소를 사용하고, API 자체가 없으면 브라우저 `localStorage`로 fallback합니다.
- `POST /api/auth`는 사용자 확인 후 세션 토큰을 발급합니다.
- `GET /api/posts`는 공개 목록 조회입니다.
- `POST /api/posts`, `DELETE /api/posts`는 `Authorization: Bearer <token>`을 확인합니다.

## 서버 저장소에 필요한 최소 테이블

### users

- `id`
- `name`
- `password_hash`
- `created_at`

### posts

- `id`
- `author_id`
- `author_name`
- `created_at`
- `mode`
- `template_id`
- `object_id`
- `object_scale`
- `tile_count`
- `tiles_json`

## 주의점

현재 서버리스 API는 KV 환경변수가 있으면 영구 저장소를 쓰고, 없으면 메모리 저장소를 씁니다. 메모리 모드에서는 Vercel 함수 인스턴스가 재시작되면 서버 쪽 게시글은 사라질 수 있습니다. 실제 수업용 온라인 공유게시판으로 쓰려면 Vercel KV/Upstash를 연결하거나 Supabase, Vercel Postgres, Firebase 같은 영구 저장소로 `api/_storage.js`를 교체해야 합니다.

현재 비밀번호는 서버에서 `salt + pbkdf2-sha256`으로 저장하고, 게시글 등록/삭제는 8시간 만료 세션 토큰으로 확인합니다. 공개 서비스로 확장하려면 비밀번호 재설정, 관리자 삭제 기능, 계정별 게시글 관리 화면을 추가해야 합니다.

## 검증

Windows PowerShell에서는 실행 정책 때문에 `npm run check`가 막힐 수 있습니다. 이 경우 아래 명령을 사용합니다.

```powershell
npm.cmd run check
```

이 검증은 PWA 핵심 파일, manifest, service worker, API 문법, 인증/게시글 API 기본 동작을 확인합니다.
