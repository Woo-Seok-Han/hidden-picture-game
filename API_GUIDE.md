# API 연결 가이드

## 환경 설정

### 1. 환경 변수 설정

`.env` 파일을 생성하고 백엔드 API URL을 설정합니다:

```env
# .env
VITE_API_URL=http://localhost:3000/api
VITE_ENV=development
```

## API 엔드포인트

게임이 필요로 하는 백엔드 API 엔드포인트:

### 게임 API

#### 1. 게임 시작
**POST** `/api/game/start`

요청:
```json
{
  "employeeNumber": "123456"
}
```

응답:
```json
{
  "sessionId": "uuid",
  "employeeNumber": "123456",
  "startTime": "2024-01-01T10:00:00Z"
}
```

#### 2. 게임 문제 조회
**GET** `/api/game/questions`

응답:
```json
[
  {
    "id": "q1",
    "questionNumber": 1,
    "imageUrl": "https://...",
    "imageAlt": "처치 카트"
  },
  ...
]
```

#### 3. 게임 답변 제출
**POST** `/api/game/submit`

요청:
```json
{
  "sessionId": "uuid",
  "answers": [
    {
      "questionId": "q1",
      "selectedPoint": { "x": 0.5, "y": 0.5 },
      "hasError": true,
      "timestamp": "2024-01-01T10:00:05Z"
    }
  ]
}
```

응답:
```json
{
  "sessionId": "uuid",
  "employeeNumber": "123456",
  "correctAnswers": 3,
  "totalQuestions": 5,
  "accuracy": 0.6,
  "totalTime": "02:30"
}
```

#### 4. 게임 완료
**POST** `/api/game/complete`

요청:
```json
{
  "sessionId": "uuid"
}
```

응답:
```json
{
  "sessionId": "uuid",
  "employeeNumber": "123456",
  "correctAnswers": 4,
  "totalQuestions": 5,
  "accuracy": 0.8,
  "totalTime": "01:45"
}
```

### 사용자 API

#### 1. 직원 검증
**POST** `/api/user/validate`

요청:
```json
{
  "employeeNumber": "123456"
}
```

응답:
```json
{
  "valid": true,
  "message": "직원이 확인되었습니다"
}
```

#### 2. 사용자 결과 조회
**GET** `/api/user/:employeeNumber/results`

응답:
```json
{
  "sessionId": "uuid",
  "employeeNumber": "123456",
  "correctAnswers": 4,
  "totalQuestions": 5,
  "accuracy": 0.8,
  "totalTime": "01:45"
}
```

## 프론트엔드 사용 방법

### 1. API 호출

```typescript
import { startGame, fetchQuestions, submitGameAnswers } from '@/api/gameService';

// 게임 시작
const response = await startGame('123456');

// 문제 조회
const questions = await fetchQuestions();

// 답변 제출
const result = await submitGameAnswers(sessionId, answers);
```

### 2. 게임 컨텍스트 사용

```typescript
import { useGameContext } from '@/context/GameContext';

function MyComponent() {
  const { session, setSession, gameResult } = useGameContext();
  
  // 세션과 결과 사용
}
```

### 3. 게임 훅 사용

```typescript
import { useGameSession, useGameAnswers } from '@/hooks/useGame';

function GameScreen() {
  const { session, startGame } = useGameSession();
  const { submitAnswers, completeGame } = useGameAnswers();
  
  // 게임 로직 구현
}
```

## CORS 설정

백엔드에서 CORS를 설정해야 프론트엔드에서 API를 호출할 수 있습니다:

```javascript
// Express 예시
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## 에러 처리

API 호출 시 에러가 발생할 수 있습니다. 각 함수는 에러 발생 시 `null`을 반환합니다:

```typescript
const result = await submitGameAnswers(sessionId, answers);
if (!result) {
  console.error('게임 답변 제출에 실패했습니다');
  // 에러 처리
}
```

## 개발 시 주의사항

1. **환경 변수**: 개발 환경과 프로덕션 환경의 API URL을 다르게 설정할 수 있습니다
2. **CORS**: 로컬 개발 시 백엔드 CORS 설정 필요
3. **타임아웃**: 장기 실행 요청은 타임아웃 설정 필요
4. **인증**: 필요시 JWT 토큰 기반 인증 추가 가능

## 다음 단계

- [ ] 백엔드 API 구현
- [ ] 데이터베이스 스키마 설계
- [ ] 인증/인가 시스템 구현
- [ ] 에러 로깅 및 모니터링
- [ ] API 문서화 (Swagger/OpenAPI)
