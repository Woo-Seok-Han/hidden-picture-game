// 게임 전체 데이터 타입 정의

/** 게임 화면 상태 */
export type PlayerScreen = 'entry' | 'game' | 'complete' | 'results';

/** 직원 정보 */
export interface Employee {
  employeeNumber: string;
  name?: string;
  department?: string;
}

/** 게임 문제 */
export interface Question {
  id: string;
  questionNumber: number;
  imageUrl: string;
  imageAlt: string;
}

/** 게임 세션 */
export interface GameSession {
  sessionId: string;
  employeeNumber: string;
  startTime: string;
  endTime?: string;
}

/** 답변 포인트 */
export interface SelectedPoint {
  x: number; // 0 ~ 1 (상대 좌표)
  y: number; // 0 ~ 1 (상대 좌표)
}

/** 개별 답변 */
export interface Answer {
  questionId: string;
  questionNumber: number;
  selectedPoint?: SelectedPoint;
  hasError: boolean; // true: "오류 있음", false: "오류 없음"
  timestamp: string;
}

/** 게임 결과 */
export interface GameResult {
  sessionId: string;
  employeeNumber: string;
  answers: Answer[];
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number; // 0 ~ 1
  totalTime: string; // "HH:MM:SS"
  completedAt: string;
}

/** 결과 상세 정보 */
export interface DetailedResult extends GameResult {
  details: QuestionDetail[];
}

/** 문제별 상세 결과 */
export interface QuestionDetail {
  questionId: string;
  questionNumber: number;
  title: string;
  imageUrl: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  selectedPoint?: SelectedPoint;
}

/** API 요청/응답 타입 */
export interface ApiRequest<T> {
  data: T;
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/** 에러 타입 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}
