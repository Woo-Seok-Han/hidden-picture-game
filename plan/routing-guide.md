# 게임 라우팅 가이드

## 라우팅 구조

게임은 URL 기반 라우팅을 사용합니다. React Router 없이 `window.history.pushState()`를 사용해 구현되었습니다.

## 라우트 맵

### Player App (플레이어 게임)

| 경로 | 화면 | 설명 |
|------|------|------|
| `/` | EntryScreen | 탐정 사번 입력 화면 |
| `/game` | GameScreen | 5개 문제 게임 화면 |
| `/complete` | CompleteScreen | 수사 완료 화면 |
| `/results/:employeeNumber` | ResultsScreen | 결과 및 해설 화면 |

### Admin App (관리자)

| 경로 | 화면 | 설명 |
|------|------|------|
| `/admin` | AdminApp | 관리자 메인 화면 |
| `/admin/questions` | AdminQuestionPage | 문제 관리 |
| `/admin/results` | (예정) | 결과 통계 |

## 게임 플로우

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  1. EntryScreen (/)                                 │
│     ↓ "게임 시작" 클릭                               │
│                                                     │
│  2. GameScreen (/game)                              │
│     ↓ 5개 문제 완료                                 │
│                                                     │
│  3. CompleteScreen (/complete)                      │
│     ↓ "정답과 해설 확인" 클릭                        │
│                                                     │
│  4. ResultsScreen (/results/:employeeNumber)       │
│     ↓ "처음으로 돌아가기" 클릭                       │
│                                                     │
│  ← 1. EntryScreen (/)                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 라우팅 구현

### 1. URL 변경

```typescript
// 화면 전환 시 URL 업데이트
const navigateTo = (path: string) => {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

// 사용 예
navigateTo("/game");              // → /game
navigateTo("/results/123456");    // → /results/123456
navigateTo("/");                  // → /
```

### 2. URL 감지

```typescript
useEffect(() => {
  const handlePopState = () => {
    const pathname = window.location.pathname;
    
    if (pathname.startsWith("/results/")) {
      const empNumber = pathname.split("/results/")[1];
      setEmployeeNumber(empNumber);
      setScreen("results");
    } else if (pathname === "/complete") {
      setScreen("complete");
    } else if (pathname === "/game") {
      setScreen("game");
    } else {
      setScreen("entry");
    }
  };

  handlePopState();
  window.addEventListener("popstate", handlePopState);
  
  return () => window.removeEventListener("popstate", handlePopState);
}, []);
```

### 3. 화면 전환

```typescript
// 게임 시작
const handleStart = (event: FormEvent<HTMLFormElement>) => {
  // ... 유효성 검증
  navigateTo("/game");
};

// 게임 완료
const handleGameComplete = () => {
  navigateTo("/complete");
};

// 결과 확인
const handleResultsClick = () => {
  navigateTo(`/results/${employeeNumber}`);
};

// 처음으로 돌아가기
const handleHome = () => {
  navigateTo("/");
};
```

## 브라우저 뒤로가기/앞으로가기

URL 기반 라우팅을 사용하므로 브라우저의 뒤로가기/앞으로가기가 자동으로 작동합니다.

```
예시:
1. "/" 방문
2. 사번 입력 후 "게임 시작" → "/game" 이동
3. 게임 완료 → "/complete" 이동
4. "결과 확인" → "/results/123456" 이동
5. 브라우저 뒤로가기 → "/complete"로 돌아감
6. 브라우저 뒤로가기 → "/game"으로 돌아감
```

## 상태 관리

### PlayerApp 상태

```typescript
const [screen, setScreen] = useState<PlayerScreen>("entry");
const [employeeNumber, setEmployeeNumber] = useState("");
const [error, setError] = useState("");
```

- **screen**: 현재 화면 상태
- **employeeNumber**: 입력된 사번
- **error**: 입력 오류 메시지

### URL ↔ 상태 동기화

| URL | screen | employeeNumber |
|-----|--------|----------------|
| `/` | "entry" | "" |
| `/game` | "game" | "입력된 사번" |
| `/complete` | "complete" | "입력된 사번" |
| `/results/:empNo` | "results" | "empNo" |

## API 연동

각 화면 전환 시 필요한 API 호출:

### EntryScreen → GameScreen
```
POST /api/game/start
├─ 요청: { employeeNumber }
└─ 응답: { sessionId, employeeNumber, startTime }
```

### GameScreen
```
GET /api/game/questions
├─ 요청: 없음
└─ 응답: 5개 문제 데이터

사용자 클릭 시마다 답변 저장 (WebSocket 또는 로컬 상태)
```

### GameScreen → CompleteScreen
```
자동 전환 (5문제 완료 후)
```

### CompleteScreen → ResultsScreen
```
POST /api/game/submit
├─ 요청: { sessionId, answers }
└─ 응답: { 게임 결과 데이터 }
```

### ResultsScreen → EntryScreen
```
자동 전환 (URL 변경 후 상태 초기화)
```

## 개발 팁

### URL 확인
```typescript
console.log(window.location.pathname); // 현재 경로 확인
```

### 네비게이션 디버깅
```typescript
const navigateTo = (path: string) => {
  console.log(`Navigating to: ${path}`);
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
};
```

### 상태 동기화 검증
```typescript
useEffect(() => {
  console.log(`Screen: ${screen}, EmployeeNumber: ${employeeNumber}`);
}, [screen, employeeNumber]);
```

## 향후 개선사항

- [ ] React Router v6 마이그레이션
- [ ] 동적 라우트 생성
- [ ] 라우트 가드 (인증)
- [ ] 라우트 트랜지션 애니메이션
- [ ] 깊은 링크 지원
- [ ] 404 에러 페이지
