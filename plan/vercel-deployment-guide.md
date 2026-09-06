# Vercel 배포 가이드

## 배포 전 체크리스트

- [x] `vercel.json` - SPA 라우팅 설정
- [x] `vite.config.ts` - 빌드 설정
- [ ] 환경 변수 설정
- [ ] 백엔드 API URL 설정

## 1. Vercel 계정 및 프로젝트 설정

### 1.1 Vercel CLI 설치 (선택사항)
```bash
npm install -g vercel
```

### 1.2 프로젝트 연결
GitHub에 푸시 후 Vercel 대시보드에서 연결하거나:
```bash
vercel
```

## 2. 환경 변수 설정

### Vercel 대시보드에서 설정

**프로젝트 Settings → Environment Variables**

#### 개발 환경 (.env.development)
```env
VITE_API_URL=http://localhost:3000/api
VITE_ENV=development
```

#### 프로덕션 환경 (Vercel)
```env
VITE_API_URL=https://your-backend-api.com/api
VITE_ENV=production
```

### 환경별 설정 방법

**Vercel 대시보드:**
1. 프로젝트 선택
2. Settings → Environment Variables
3. 다음 변수들 추가:

| 변수명 | 개발 | 프로덕션 | 미리보기 |
|--------|------|--------|---------|
| `VITE_API_URL` | `http://localhost:3000/api` | `https://api.example.com/api` | `https://api-dev.example.com/api` |
| `VITE_ENV` | `development` | `production` | `preview` |

## 3. 배포 방법

### 방법 1: GitHub 연결 (권장)
```bash
# 1. GitHub 저장소에 푸시
git push origin main

# 2. Vercel 대시보드에서 프로젝트 생성
#    → GitHub 저장소 선택
#    → Environment Variables 설정
#    → Deploy
```

### 방법 2: Vercel CLI
```bash
# 1. 로그인
vercel login

# 2. 프로젝트 배포
vercel

# 3. 프로덕션 배포
vercel --prod
```

### 방법 3: npm 스크립트 추가

**package.json:**
```json
{
  "scripts": {
    "build": "tsc -b && vite build",
    "deploy": "vercel",
    "deploy:prod": "vercel --prod"
  }
}
```

```bash
npm run deploy:prod
```

## 4. vercel.json 설정 설명

### SPA 라우팅 설정
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**설명:**
- `buildCommand`: Vercel에서 실행할 빌드 명령어
- `outputDirectory`: 빌드 결과 디렉토리 (Vite는 `dist`)
- `rewrites`: 모든 요청을 `index.html`로 리다이렉트
  - 이렇게 하면 `/game`, `/results/123` 등의 경로에서도 `index.html`이 로드됨
  - React 앱이 클라이언트에서 라우팅을 처리할 수 있음

## 5. 라우팅 동작 확인

### 배포 후 URL 테스트

| URL | 예상 결과 |
|-----|---------|
| `https://your-domain.vercel.app/` | EntryScreen 표시 |
| `https://your-domain.vercel.app/game` | GameScreen 표시 |
| `https://your-domain.vercel.app/results/123456` | ResultsScreen 표시 (사번: 123456) |

## 6. CORS 설정

백엔드 서버에서 CORS를 설정해야 합니다.

### Express 예시
```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-domain.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 또는 환경변수로 동적 설정
```javascript
const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [
  'http://localhost:5173'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

## 7. 배포 후 확인 사항

### 7.1 빌드 확인
```bash
# Vercel Logs에서 확인
vercel logs <project-url> --prod
```

### 7.2 라우팅 테스트
```bash
# 각 경로를 테스트
curl https://your-domain.vercel.app/
curl https://your-domain.vercel.app/game
curl https://your-domain.vercel.app/results/123456
```

### 7.3 API 연동 확인
1. 브라우저 개발자 도구 → Network 탭
2. API 요청 확인
3. CORS 에러 없는지 확인

## 8. 환경별 배포

### Preview 배포 (테스트용)
```bash
vercel
```
GitHub PR 생성 시 자동으로 미리보기 배포됨

### Production 배포 (실제 서비스)
```bash
vercel --prod
```

## 9. 무중단 배포

Vercel은 기본적으로 무중단 배포를 지원합니다:
1. 새 빌드가 성공하면 즉시 활성화
2. 이전 버전은 자동 롤백 가능
3. 배포 히스토리 유지

## 10. 성능 최적화

### 10.1 번들 크기 확인
```bash
npm run build
# dist 폴더의 파일 크기 확인
```

### 10.2 Vercel Analytics (선택사항)
대시보드에서 성능 메트릭 확인

### 10.3 이미지 최적화
- 이미지는 `/public` 폴더에 배치
- SVG 형식 권장 (작은 크기)
- WebP 변환 고려

## 11. 트러블슈팅

### 문제: 라우팅이 작동하지 않음
**해결책:**
- `vercel.json`의 `rewrites` 설정 확인
- 빌드 로그에서 에러 확인
- Vercel 재배포

### 문제: 환경 변수가 제대로 로드되지 않음
**해결책:**
- Vercel 대시보드에서 변수 확인
- 빌드 로그에서 변수 값 확인
- `import.meta.env.VITE_*` 형식 사용

### 문제: API 요청 실패 (CORS 에러)
**해결책:**
- 백엔드 CORS 설정 확인
- 프론트엔드 API URL 정확성 확인
- 네트워크 탭에서 실제 요청 URL 확인

### 문제: 빌드 실패
**해결책:**
- 로컬에서 `npm run build` 실행 확인
- TypeScript 에러 확인
- 의존성 버전 확인

## 12. 배포 완료 후

배포 완료 후 다음을 확인하세요:
1. ✅ 프로덕션 URL에서 앱 실행 확인
2. ✅ 라우팅 동작 확인
3. ✅ API 연동 확인
4. ✅ 에러 콘솔 확인 (개발자 도구)
5. ✅ 모바일 반응형 확인

## 13. 유용한 링크

- [Vercel 공식 문서](https://vercel.com/docs)
- [Vite 배포 가이드](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Vercel SPA 라우팅](https://vercel.com/docs/concepts/solutions/spa)

## 14. 다음 단계

- [ ] 백엔드 배포 (예: AWS, Heroku, Railway)
- [ ] 데이터베이스 설정
- [ ] 모니터링 및 로깅 설정
- [ ] SSL 인증서 설정
- [ ] 커스텀 도메인 연결
