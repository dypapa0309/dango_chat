# Release Checklist

이 문서는 현재 `dango_chat` 프로젝트를 기준으로 웹 배포와 iOS 앱 업로드를 빠르게 마무리하기 위한 실행 체크리스트다.

## 1. Release Readiness

- 웹 프로덕션 빌드 확인: `npm run build`
- 앱 웹자산 빌드 확인: `npm run build:app`
- 기본 테스트 확인: `npm test`
- iOS 웹자산 동기화: `npx cap sync ios`
- iOS 시뮬레이터 빌드 확인:

```bash
xcodebuild -project ios/App/App.xcodeproj -scheme App -sdk iphonesimulator -configuration Debug build CODE_SIGNING_ALLOWED=NO
```

## 2. Netlify Environment Variables

Netlify 경로:

- `Site configuration -> Environment variables`

현재 코드 기준으로 필요한 값:

- `SITE_URL`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY` 또는 `SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY` 또는 `SUPABASE_SERVICE_ROLE_KEY`
- `TOSS_CLIENT_KEY` 또는 `TOSS_WIDGET_CLIENT_KEY`
- `TOSS_SECRET_KEY` 또는 `TOSS_WIDGET_SECRET_KEY`
- `KAKAO_MOBILITY_REST_KEY`
- `OPENAI_API_KEY`
- `GA4_PROPERTY_ID`
- `GA_CLIENT_EMAIL`
- `GA_PRIVATE_KEY`
- `ADMIN_TOKEN`

권장값 메모:

- `SITE_URL`은 실제 운영 도메인으로 설정
- `GA_PRIVATE_KEY`는 줄바꿈을 `\n` 형태로 넣기
- `ADMIN_TOKEN`은 예약 가격 재계산 보호용으로 사용하는 것이 안전

## 3. Web Deploy

Netlify는 현재 설정상 아래 값으로 동작한다.

- Build command: `npm run build`
- Publish directory: `app`
- Functions directory: `netlify/functions`

배포 전 순서:

```bash
npm install
npm run build
npm test
```

GitHub 연동 배포를 쓰면 `main` 반영 후 Netlify가 자동 배포한다.

## 4. iOS Release Checklist

프로젝트 기준 핵심 설정:

- Bundle ID: `com.dango.move`
- Team ID: `5FBH68ZU73`
- Version: `1.0`
- Build: `1`
- Deployment target: `iOS 15.0`

Xcode에서 확인할 것:

1. `ios/App/App.xcodeproj` 열기
2. `App -> Signing & Capabilities`에서 올바른 Team 선택
3. 배포 전 `Version`과 `Build` 증가
4. 실제 기기 또는 시뮬레이터에서 핵심 흐름 확인
5. `Product -> Archive`
6. Organizer에서 `Distribute App` 선택
7. `App Store Connect` 업로드

App Store Connect에서 확인할 것:

- 앱 이름, 부제, 설명
- 스크린샷
- App Privacy
- 연령 등급
- 지원 URL, 개인정보처리방침 URL

## 5. Recommended Final Smoke Test

배포 직전 최소 점검:

1. 로그인 진입 확인
2. 채팅 상담 생성 확인
3. 가격 계산 API 응답 확인
4. 결제 플로우 진입 확인
5. 기사/고객 조회 화면 주요 버튼 확인
6. 운영 함수 에러 로그 확인

## 6. Suggested Release Commands

```bash
npm run build
npm run build:app
npx cap sync ios
```

이후:

```bash
git add .
git commit -m "Prepare web and iOS release"
git push origin main
```
