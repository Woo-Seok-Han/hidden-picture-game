# Vercel 배포 체크리스트

## 배포 전 준비

### 코드 준비
- [ ] `git commit` 및 `git push` 완료
- [ ] 모든 변경사항 커밋됨
- [ ] `main` 브랜치는 배포 가능한 상태

### 설정 파일 확인
- [x] `vercel.json` - SPA 라우팅 설정 완료
- [x] `vite.config.ts` - 빌드 설정 완료
- [x] `.env.production` - 프로덕션 환경 변수 설정
- [x] `package.json` - 빌드 명령어 확인

### 코드 검증
- [ ] `npm run lint` - ESLint 검증 통과
- [ ] `npm run build` - 빌드 성공
- [ ] `npm run preview` - 빌드 결과 미리보기 정상 작동

### API 준비
- [ ] 백엔드 API 서버 배포 완료
- [ ] API URL 확정 (예: https://api.example.com/api)
- [ ] CORS 설정 완료
- [ ] API 엔드포인트 테스트 완료

## 배포 단계

### 1단계: GitHub 저장소 준비
```bash
# 변경사항 확인
git status

# 커밋
git add .
git commit -m "chore: prepare for vercel deployment"

# GitHub에 푸시
git push origin main
```
- [ ] GitHub에 최신 코드 푸시 완료

### 2단계: Vercel 프로젝트 생성
방법 A: Vercel 대시보드 (권장)
1. https://vercel.com/dashboard 방문
2. "Add New" → "Project"
3. GitHub 저장소 선택
4. Framework 자동 감지 (Vite로 인식됨)

방법 B: Vercel CLI
```bash
vercel login
vercel
```

- [ ] Vercel에 프로젝트 생성 완료

### 3단계: 환경 변수 설정
**Vercel 대시보드 → Settings → Environment Variables**

#### 필수 변수
| 변수 | 값 | 적용 환경 |
|------|-----|---------|
| `VITE_API_URL` | `https://api.example.com/api` | Production |
| `VITE_ENV` | `production` | Production |

#### 프리뷰 환경 (선택)
| 변수 | 값 | 적용 환경 |
|------|-----|---------|
| `VITE_API_URL` | `https://api-dev.example.com/api` | Preview |

- [ ] 환경 변수 설정 완료

### 4단계: 배포
**Vercel 대시보드**
1. "Deploy" 버튼 클릭
2. 또는 GitHub 푸시 시 자동 배포

**또는 CLI:**
```bash
vercel --prod
```

- [ ] 프로덕션 배포 완료

## 배포 후 검증

### 5단계: 라우팅 테스트
| 테스트 | URL | 예상 결과 | 확인 |
|--------|-----|----------|------|
| 홈 페이지 | `/` | EntryScreen 표시 | [ ] |
| 게임 페이지 | `/game` | GameScreen 표시 | [ ] |
| 완료 페이지 | `/complete` | CompleteScreen 표시 | [ ] |
| 결과 페이지 | `/results/123456` | ResultsScreen 표시 | [ ] |
| 관리자 홈 | `/admin` | AdminApp 표시 | [ ] |
| 잘못된 경로 | `/invalid` | EntryScreen 표시 | [ ] |

### 6단계: 기능 테스트
- [ ] 사번 입력 후 게임 시작 가능
- [ ] 게임 진행 가능
- [ ] 결과 화면 표시됨
- [ ] 처음으로 돌아가기 작동

### 7단계: API 연동 테스트
1. **개발자 도구 열기** (F12)
2. **Network 탭** 클릭
3. 각 단계에서 API 호출 확인

| 단계 | API | 상태 | 확인 |
|------|-----|------|------|
| 게임 시작 | `POST /game/start` | 200 | [ ] |
| 문제 로드 | `GET /game/questions` | 200 | [ ] |
| 답변 제출 | `POST /game/submit` | 200 | [ ] |
| CORS 에러 | N/A | 없음 | [ ] |

### 8단계: 성능 확인
1. **Chrome DevTools → Lighthouse**
2. Performance 측정
3. 로드 시간 확인 (목표: < 3초)

- [ ] 성능 측정 완료

### 9단계: 에러 확인
1. **브라우저 콘솔** 확인
   - 에러 메시지 없는지 확인
   - 경고 메시지만 있는지 확인
2. **Vercel Logs** 확인
   ```bash
   vercel logs https://your-domain.vercel.app --prod
   ```

- [ ] 에러 없음 확인

### 10단계: 모바일 테스트
- [ ] 모바일 브라우저에서 정상 작동
- [ ] 터치 동작 정상
- [ ] 레이아웃 반응형 정상

## 문제 해결

### 라우팅이 작동하지 않는 경우
```bash
# 1. vercel.json 확인
cat vercel.json

# 2. 빌드 로그 확인
vercel logs <url> --prod

# 3. 재배포
vercel --prod
```

### API 호출이 실패하는 경우
```bash
# 1. 백엔드 API 상태 확인
curl https://api.example.com/api/game/questions

# 2. 환경 변수 확인
# Vercel 대시보드 → Settings → Environment Variables

# 3. CORS 설정 확인 (백엔드)
```

### 환경 변수가 적용되지 않는 경우
```bash
# 1. 변수 재설정
# Vercel 대시보드에서 변수 삭제 후 재추가

# 2. 재배포
git commit --allow-empty -m "trigger redeploy"
git push origin main

# 또는
vercel --prod
```

## 배포 완료!

모든 체크리스트가 완료되면 배포가 성공한 것입니다! 🎉

### 다음 단계
- [ ] 도메인 설정 (선택사항)
- [ ] SSL 인증서 자동 갱신 (Vercel 기본)
- [ ] 모니터링 설정
- [ ] 로깅 설정
- [ ] 사용자에게 배포 완료 알림

### 유용한 명령어
```bash
# 배포 상태 확인
vercel list

# 특정 프로젝트의 로그 확인
vercel logs <project-name> --prod

# 배포 취소
vercel rollback

# 프로젝트 재배포
vercel --prod --force
```

### 모니터링
- Vercel 대시보드에서 실시간 배포 상태 확인
- Analytics에서 성능 메트릭 확인
- Edge Network를 통한 자동 최적화

## 주의사항

⚠️ **중요!**
- API URL이 정확한지 확인
- 백엔드 CORS 설정이 되어있는지 확인
- 환경 변수가 올바르게 적용되었는지 확인
- 배포 후 모든 기능을 테스트하세요

✅ **완료하면:**
- URL에 접속하여 게임 플레이 가능
- 결과 저장 및 조회 가능
- 관리자 화면 접근 가능
