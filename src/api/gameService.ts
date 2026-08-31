import { API_ENDPOINTS } from './config';

// 타입 정의
export interface Question {
  id: string;
  questionNumber: number;
  imageUrl: string;
  imageAlt: string;
}

export interface GameStartRequest {
  employeeNumber: string;
}

export interface GameStartResponse {
  sessionId: string;
  employeeNumber: string;
  startTime: string;
}

export interface Answer {
  questionId: string;
  selectedPoint?: { x: number; y: number };
  hasError: boolean;
  timestamp: string;
}

export interface GameSubmitRequest {
  sessionId: string;
  answers: Answer[];
}

export interface GameResult {
  sessionId: string;
  employeeNumber: string;
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
  totalTime: string;
}

// API 호출 함수들
export async function validateEmployee(employeeNumber: string): Promise<boolean> {
  try {
    const response = await fetch(API_ENDPOINTS.user.validate, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeNumber }),
    });
    return response.ok;
  } catch (error) {
    console.error('직원 검증 실패:', error);
    return false;
  }
}

export async function startGame(employeeNumber: string): Promise<GameStartResponse | null> {
  try {
    const response = await fetch(API_ENDPOINTS.game.start, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeNumber } as GameStartRequest),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('게임 시작 실패:', error);
    return null;
  }
}

export async function fetchQuestions(): Promise<Question[]> {
  try {
    const response = await fetch(API_ENDPOINTS.game.questions);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('문제 조회 실패:', error);
    return [];
  }
}

export async function submitGameAnswers(
  sessionId: string,
  answers: Answer[]
): Promise<GameResult | null> {
  try {
    const response = await fetch(API_ENDPOINTS.game.submit, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, answers } as GameSubmitRequest),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('게임 답변 제출 실패:', error);
    return null;
  }
}

export async function completeGame(sessionId: string): Promise<GameResult | null> {
  try {
    const response = await fetch(API_ENDPOINTS.game.complete, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('게임 완료 실패:', error);
    return null;
  }
}

export async function fetchUserResults(employeeNumber: string): Promise<GameResult | null> {
  try {
    const response = await fetch(API_ENDPOINTS.user.results(employeeNumber));

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('사용자 결과 조회 실패:', error);
    return null;
  }
}
