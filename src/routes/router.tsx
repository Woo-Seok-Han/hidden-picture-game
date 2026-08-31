/**
 * 라우터 설정 (현재는 PlayerApp과 AdminApp이 내부 상태로 관리)
 * React Router 필요시 아래 코드를 활성화할 수 있습니다.
 */

// import { createBrowserRouter, RouterProvider } from 'react-router-dom';
// import PlayerApp from '../apps/player/PlayerApp';
// import AdminApp from '../apps/admin/AdminApp';

// export const router = createBrowserRouter(
//   [
//     {
//       path: '/',
//       element: <PlayerApp />,
//     },
//     {
//       path: '/admin',
//       element: <AdminApp />,
//     },
//   ],
//   {
//     basename: import.meta.env.BASE_URL,
//   }
// );

// export function Router() {
//   return <RouterProvider router={router} />;
// }

/** 게임 라우트 설정 문서 */

export const GAME_ROUTES = {
  PLAYER: {
    HOME: '/',
    GAME: '/game',
    RESULTS: '/results/:employeeNumber',
  },
  ADMIN: {
    HOME: '/admin',
    QUESTIONS: '/admin/questions',
    RESULTS: '/admin/results',
  },
} as const;

/**
 * API 엔드포인트와 화면 흐름
 * 
 * 1. EntryScreen (/)
 *    - 사번 입력 후 "게임 시작" 클릭
 *    - POST /api/game/start → sessionId 획득
 * 
 * 2. GameScreen (/game)
 *    - 5개 문제 순차 진행
 *    - GET /api/game/questions → 문제 데이터 로드
 *    - 각 문제마다 답변 수집
 * 
 * 3. CompleteScreen
 *    - 5개 문제 완료 후 표시
 *    - "정답과 해설 확인하기" 클릭
 * 
 * 4. ResultsScreen (/results/:employeeNumber)
 *    - POST /api/game/submit → 최종 결과 저장
 *    - 5개 문제별 정답/오답 표시
 *    - 해설 정보 표시
 *    - "처음으로 돌아가기" 클릭 → EntryScreen으로 이동
 */

export const GAME_FLOW = [
  {
    screen: 'entry',
    title: '탐정 사번 입력',
    api: 'POST /api/game/start',
    nextScreen: 'game',
  },
  {
    screen: 'game',
    title: '5문제 게임 진행',
    api: 'GET /api/game/questions',
    nextScreen: 'complete',
  },
  {
    screen: 'complete',
    title: '수사 완료',
    api: null,
    nextScreen: 'results',
  },
  {
    screen: 'results',
    title: '결과 및 해설',
    api: 'POST /api/game/submit',
    nextScreen: 'entry',
  },
] as const;

