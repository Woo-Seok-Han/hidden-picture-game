// API 엔드포인트 설정
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const API_ENDPOINTS = {
  // 게임 세션
  game: {
    start: `${API_BASE_URL}/game/start`,
    questions: `${API_BASE_URL}/game/questions`,
    submit: `${API_BASE_URL}/game/submit`,
    complete: `${API_BASE_URL}/game/complete`,
  },
  // 사용자
  user: {
    validate: `${API_BASE_URL}/user/validate`,
    results: (employeeNumber: string) => `${API_BASE_URL}/user/${employeeNumber}/results`,
  },
} as const;
