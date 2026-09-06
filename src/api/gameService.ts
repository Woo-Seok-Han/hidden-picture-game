import { API_ENDPOINTS, resolveApiAssetUrl } from './config';

// 타입 정의
export interface Question {
  id: string;
  questionNumber: number;
  imageUrl: string;
  imageAlt: string;
  timeLimitSeconds?: number;
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
  questionNumber?: number;
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
  answers?: AnswerResult[];
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
  totalTime: string;
  completedAt?: string;
  details?: QuestionDetail[];
}

export interface AnswerResult extends Answer {
  correct: boolean;
}

export interface ErrorArea {
  id?: string | number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AdminQuestion extends Question {
  explanation: string;
  timeLimitSeconds: number;
  active: boolean;
  errorAreas: ErrorArea[];
  createdAt: string;
  updatedAt: string;
}

export interface QuestionDetail {
  questionId: string;
  questionNumber: number;
  title: string;
  imageUrl: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  selectedPoint?: { x: number; y: number };
  errorAreas?: ErrorArea[];
}

export interface SaveAdminQuestionRequest {
  image?: File | null;
  imageAlt?: string;
  explanation: string;
  timeLimitSeconds: number;
  errorAreas: ErrorArea[];
}

function normalizeQuestion<T extends Question>(question: T): T {
  return {
    ...question,
    imageUrl: resolveApiAssetUrl(question.imageUrl),
  };
}

function normalizeResult<T extends GameResult>(result: T): T {
  return {
    ...result,
    details: result.details?.map((detail) => ({
      ...detail,
      imageUrl: resolveApiAssetUrl(detail.imageUrl),
    })),
  };
}

function toQuestionFormData(request: SaveAdminQuestionRequest): FormData {
  const formData = new FormData();
  if (request.image) {
    formData.append('image', request.image);
  }
  if (request.imageAlt) {
    formData.append('imageAlt', request.imageAlt);
  }
  formData.append('explanation', request.explanation);
  formData.append('timeLimitSeconds', String(request.timeLimitSeconds));
  formData.append('errorAreas', JSON.stringify(request.errorAreas));
  return formData;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const errorBody = await response.json();
    if (typeof errorBody?.message === 'string') {
      return errorBody.message;
    }
  } catch {
    // JSON 에러 본문이 없으면 HTTP 상태 코드로 대체합니다.
  }

  return `HTTP ${response.status}`;
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
      throw new Error(await readErrorMessage(response));
    }

    return await response.json();
  } catch (error) {
    console.error('게임 시작 실패:', error);
    throw error;
  }
}

export async function fetchQuestions(): Promise<Question[]> {
  try {
    const response = await fetch(API_ENDPOINTS.game.questions);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()).map(normalizeQuestion);
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

    return normalizeResult(await response.json());
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

    return normalizeResult(await response.json());
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

    return normalizeResult(await response.json());
  } catch (error) {
    console.error('사용자 결과 조회 실패:', error);
    return null;
  }
}

export async function fetchAdminQuestions(): Promise<AdminQuestion[]> {
  try {
    const response = await fetch(API_ENDPOINTS.admin.questions);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return (await response.json()).map(normalizeQuestion);
  } catch (error) {
    console.error('관리자 문제 조회 실패:', error);
    throw error;
  }
}

export async function fetchAdminResults(): Promise<GameResult[]> {
  try {
    const response = await fetch(API_ENDPOINTS.admin.results);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return (await response.json()).map(normalizeResult);
  } catch (error) {
    console.error('관리자 게임 결과 조회 실패:', error);
    throw error;
  }
}

export async function createAdminQuestion(
  request: SaveAdminQuestionRequest
): Promise<AdminQuestion | null> {
  try {
    const response = await fetch(API_ENDPOINTS.admin.questions, {
      method: 'POST',
      body: toQuestionFormData(request),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return normalizeQuestion(await response.json());
  } catch (error) {
    console.error('관리자 문제 생성 실패:', error);
    return null;
  }
}

export async function updateAdminQuestion(
  id: string,
  request: SaveAdminQuestionRequest
): Promise<AdminQuestion | null> {
  try {
    const response = await fetch(API_ENDPOINTS.admin.question(id), {
      method: 'PUT',
      body: toQuestionFormData(request),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return normalizeQuestion(await response.json());
  } catch (error) {
    console.error('관리자 문제 수정 실패:', error);
    return null;
  }
}

export async function deleteAdminQuestion(id: string): Promise<boolean> {
  try {
    const response = await fetch(API_ENDPOINTS.admin.question(id), {
      method: 'DELETE',
    });
    return response.ok;
  } catch (error) {
    console.error('관리자 문제 삭제 실패:', error);
    return false;
  }
}

export async function changeAdminQuestionActive(
  id: string,
  active: boolean
): Promise<AdminQuestion | null> {
  try {
    const response = await fetch(API_ENDPOINTS.admin.questionActive(id, active), {
      method: 'PATCH',
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return normalizeQuestion(await response.json());
  } catch (error) {
    console.error('관리자 문제 활성 상태 변경 실패:', error);
    return null;
  }
}
