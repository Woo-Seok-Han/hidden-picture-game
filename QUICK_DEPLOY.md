# 🚀 Vercel 배포 빠른 가이드

## 1단계: 기본 설정 (완료됨) ✅

```
✅ vercel.json - SPA 라우팅 설정
✅ .env.production - 프로덕션 환경 변수
✅ vite.config.ts - 빌드 설정
✅ package.json - 배포 스크립트
```

## 2단계: 로컬 빌드 테스트

```bash
# 빌드 테스트
npm run build

# 빌드 결과 미리보기
npm run preview
```

모든 경로가 정상 작동하는지 확인하세요:
- http://localhost:4173/
- http://localhost:4173/game
- http://localhost:4173/results/123456

## 3단계: GitHub 푸시

```bash
git add .
git commit -m "chore: prepare for vercel deployment"
git push origin main
```

## 4단계: Vercel 배포

### 방법 1: Vercel 대시보드 (추천) 🌐

1. https://vercel.com 방문
2. GitHub로 로그인
3. "Add New" → "Project"
4. 저장소 선택
5. "Import" 클릭
6. Settings → Environment Variables 설정:
   - `VITE_API_URL` = `https://api.example.com/api`
   - `VITE_ENV` = `production`
7. "Deploy" 클릭

### 방법 2: Vercel CLI 🖥️

```bash
# Vercel 로그인
vercel login

# 프로덕션 배포
vercel --prod
```

## 5단계: 배포 후 확인

### 라우팅 테스트
```
https://your-domain.vercel.app/              ✅ 홈
https://your-domain.vercel.app/game          ✅ 게임
https://your-domain.vercel.app/results/123   ✅ 결과
https://your-domain.vercel.app/complete      ✅ 완료
```

### API 테스트
개발자 도구 (F12) → Network 탭 → API 호출 확인

## 환경 변수 설정

Vercel 대시보드에서 설정해야 할 환경 변수:

```env
VITE_API_URL=https://your-backend-api.com/api
VITE_ENV=production
```

## 주요 파일

| 파일 | 용도 |
|------|------|
| `vercel.json` | SPA 라우팅 설정 |
| `.env.production` | 프로덕션 환경 변수 (로컬 용) |
| `vite.config.ts` | Vite 빌드 설정 |
| `package.json` | 빌드 스크립트 |

## 배포 후 문제 해결

### Q: 라우팅이 작동하지 않음
**A:** `vercel.json`의 `rewrites` 설정 확인 후 재배포

### Q: API 호출 실패 (CORS)
**A:** 백엔드 CORS 설정에 Vercel 도메인 추가

### Q: 환경 변수가 적용되지 않음
**A:** Vercel 대시보드에서 변수 재설정 후 재배포

## 유용한 링크

- 📖 [전체 배포 가이드](./VERCEL_DEPLOY_GUIDE.md)
- ✅ [배포 체크리스트](./DEPLOYMENT_CHECKLIST.md)
- 🔄 [라우팅 가이드](./ROUTING_GUIDE.md)
- 🔌 [API 가이드](./API_GUIDE.md)

## 배포 완료! 🎉

축하합니다! 이제 전 세계 어디서나 게임에 접속할 수 있습니다!

```
제공 URL: https://your-domain.vercel.app
```

### 도메인 연결 (선택사항)

Vercel Settings에서 커스텀 도메인 설정 가능:
- 도메인 구매 (Vercel 또는 외부)
- DNS 설정
- SSL 자동 인증서 (무료)
