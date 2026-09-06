// API 엔드포인트 설정
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export const API_ASSET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

export function resolveApiAssetUrl(url: string): string {
  if (!url || /^https?:\/\//.test(url)) {
    return url;
  }

  return `${API_ASSET_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

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
  admin: {
    questions: `${API_BASE_URL}/admin/questions`,
    question: (id: string) => `${API_BASE_URL}/admin/questions/${id}`,
    questionActive: (id: string, active: boolean) =>
      `${API_BASE_URL}/admin/questions/${id}/active?active=${active}`,
    results: `${API_BASE_URL}/admin/results`,
  },
} as const;
