# DD MOVE OS 배포용 완성본

이 압축파일은 **압축 해제 → 환경변수 입력 → Supabase 마이그레이션 적용 → Netlify 연결** 순서만 거치면 바로 테스트 가능한 상태로 정리한 배포용 패키지다.

---

## 1. 포함된 것

- 관리자 운영 페이지: `/admin/`
- 기사 응답 페이지: `/driver/accept.html?token=...`
- 고객 예약금 결제 페이지: `/customer/pay.html?jobId=...`
- Netlify Functions
  - `create-job`
  - `assign-request`
  - `driver-respond`
  - `expire-assignment`
  - `auto-dispatch`
  - `get-jobs`
  - `get-job-detail`
  - `update-job-status`
  - `cancel-assignment`
  - `createSettlement`
  - `sendDispatch`
  - `confirm-toss-payment`
  - `config`
- Supabase 마이그레이션 파일

---

## 2. 가장 빠른 배포 순서

### A. 로컬에서 압축 해제

```bash
unzip dd-move-os-ready.zip
cd dd-move-os-ready
npm install
cp .env.example .env
```

### B. Supabase 프로젝트 만들기

1. Supabase 로그인
2. New project 생성
3. 프로젝트 생성 후 **Project Settings → API** 로 이동
4. 아래 값을 복사
   - `Project URL`
   - `Publishable key` 또는 레거시라면 `anon key`
   - 서버용은 `secret key` 또는 레거시라면 `service_role key`

### C. `.env` 입력

```env
SITE_URL=http://localhost:8888

SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_SECRET_KEY=sb_secret_xxx

TOSS_CLIENT_KEY=test_ck_xxx
TOSS_SECRET_KEY=test_sk_xxx

SOLAPI_API_KEY=
SOLAPI_API_SECRET=
SENDER_PHONE=01000000000
```

### D. Supabase 마이그레이션 반영

Supabase CLI 설치 후:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### E. 초기 기사 데이터 넣기

Supabase SQL Editor에서 아래 실행:

```sql
insert into drivers (name, phone, status, dispatch_enabled, current_lat, current_lng, rating, acceptance_rate, response_score)
values
('기사1','01011111111','active',true,37.50,126.90,4.9,92,80),
('기사2','01022222222','active',true,37.48,126.88,4.7,87,70),
('기사3','01033333333','active',true,37.52,126.95,5.0,95,90);
```

### F. 로컬 실행

```bash
npm run dev
```

접속 주소:

- 루트: `http://localhost:8888/`
- 관리자: `http://localhost:8888/admin/`

---

## 3. Netlify 배포 방법

### 방법 1. GitHub 연결

1. 이 폴더를 GitHub repo에 push
2. Netlify에서 **Add new site → Import from Git**
3. repo 선택
4. Build settings는 아래처럼 두면 된다
   - Build command: 비워도 됨
   - Publish directory: `.`
   - Functions directory: `netlify/functions`
5. Deploy

### 방법 2. CLI 배포

```bash
npm install
npx netlify login
npx netlify init
npx netlify deploy --build
npx netlify deploy --prod --build
```

---

## 4. Netlify 환경변수 넣는 위치

Netlify UI에서:

**Site configuration → Environment variables**

여기에 `.env` 값을 그대로 넣으면 된다.

권장 변수 목록:

- `SITE_URL`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `TOSS_CLIENT_KEY`
- `TOSS_SECRET_KEY`
- `SOLAPI_API_KEY`
- `SOLAPI_API_SECRET`
- `SENDER_PHONE`
- `AUTO_REASSIGN_MINUTES`
- `DISPATCH_MAX_ATTEMPTS`

---

## 5. 어디서 무슨 키를 가져오나

### Supabase

위치: **Project Settings → API**

가져올 값:

- `Project URL` → `SUPABASE_URL`
- `Publishable key` → `SUPABASE_PUBLISHABLE_KEY`
- `Secret key` → `SUPABASE_SECRET_KEY`

레거시 프로젝트라면 `anon key`, `service_role key`도 사용할 수 있다.

### Toss Payments

위치: **토스페이먼츠 개발자센터 → API 키**

가져올 값:

- `클라이언트 키` → `TOSS_CLIENT_KEY`
- `시크릿 키` → `TOSS_SECRET_KEY`

주의:

- 테스트 키끼리만 묶어서 써야 한다
- 라이브 키끼리만 묶어서 써야 한다
- 테스트/라이브 키를 섞으면 안 된다

### SOLAPI

위치: **SOLAPI 콘솔 → API Key 관리**

가져올 값:

- `API Key` → `SOLAPI_API_KEY`
- `API Secret` → `SOLAPI_API_SECRET`
- 등록된 발신번호 → `SENDER_PHONE`

없으면 문자 발송은 자동으로 mock 처리된다.

---

## 6. 실제 테스트 순서

### 1단계. 주문 만들기

관리자 페이지 `/admin/` 에서 퀵 주문 생성 폼 입력 후 주문 생성

### 2단계. 결제 링크 열기

생성된 주문 카드에서 `결제 링크` 클릭

### 3단계. 결제 승인

- Toss 키가 있으면 실제 테스트 결제창 오픈
- Toss 키가 없으면 success 페이지에서 mock 승인도 가능

### 4단계. 관리자에서 예약 확정 확인

주문 상태가 `confirmed` 로 바뀌는지 확인

### 5단계. 배차 요청

관리자 페이지에서 `배차 요청`

### 6단계. 기사 링크 접속

문자 mock이면 함수 응답에 포함된 메시지 속 링크를 복사해서 기사 페이지 접속

### 7단계. 기사 수락

기사 페이지에서 수락

### 8단계. 관리자에서 상태 확인

- `jobs.status = assigned`
- `jobs.dispatch_status = accepted`

### 9단계. 완료 처리

관리자 페이지에서 완료 처리 → `createSettlement` 실행

---

## 7. 자주 막히는 지점

### 관리자 페이지가 뜨는데 데이터가 안 보임

- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` 또는 `SUPABASE_ANON_KEY` 누락 가능성
- `/.netlify/functions/config` 접속해서 JSON 응답 확인

### 함수가 500 에러 남

- 대부분 `SUPABASE_SECRET_KEY` 또는 `SUPABASE_SERVICE_ROLE_KEY` 누락
- Netlify 함수 로그 확인

### 결제창이 안 열림

- `TOSS_CLIENT_KEY` 누락
- 모바일 iframe 안에서 열려고 하는 경우
- 테스트 키/라이브 키 혼용

### 문자 안 감

- SOLAPI 키 미입력 시 mock 처리되는 것이 정상
- 실제 문자 발송하려면 SOLAPI API 키 + 발신번호 등록 필요

---

## 8. 운영 전에 꼭 바꿔야 하는 것

- `SITE_URL` 을 실제 Netlify 도메인으로 변경
- 테스트 Toss 키를 라이브 키로 교체
- 발신번호를 실제 승인된 번호로 교체
- 관리자 보호용 인증을 추가하거나 Netlify Basic auth / 별도 로그인 적용

---

## 9. 지금 버전의 범위

이 버전은 다음이 된다.

- 주문 생성
- 예약금 결제 승인
- 기사 추천 기반 배차 요청
- 기사 수락/거절
- 상태 전환
- 정산 생성

아직 별도 고도화가 필요한 것:

- 실시간 SSE 대시보드
- 관리자 로그인
- 알림톡 템플릿
- 웹훅 기반 자동 재배차 스케줄링

즉, **MVP 운영형 완성본**이다.
