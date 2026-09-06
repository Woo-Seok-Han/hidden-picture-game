// API 엔드포인트 설정
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export const API_ASSET_BASE_URL = (
  import.meta.env.VITE_API_ASSET_URL || API_BASE_URL.replace(/\/api\/?$/, '')
).replace(/\/$/, '');

const LOCALHOST_ORIGIN_PATTERN = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/;

export function resolveApiAssetUrl(url: string): string {
  if (!url) {
    return url;
  }

  if (/^https?:\/\//.test(url)) {
    if (LOCALHOST_ORIGIN_PATTERN.test(url) && !LOCALHOST_ORIGIN_PATTERN.test(API_ASSET_BASE_URL)) {
      return url.replace(LOCALHOST_ORIGIN_PATTERN, API_ASSET_BASE_URL);
    }
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
