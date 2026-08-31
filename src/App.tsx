import { useEffect } from "react";
import AdminApp from "./apps/admin/AdminApp";
import PlayerApp from "./apps/player/PlayerApp";

/**
 * 메인 앱 컴포넌트
 * 경로에 따라 Player 또는 Admin 앱을 렌더링합니다.
 * 
 * 라우트:
 * - "/" → PlayerApp (게임 플레이어)
 * - "/game" → PlayerApp (게임 화면)
 * - "/results/*" → PlayerApp (결과 화면)
 * - "/complete" → PlayerApp (완료 화면)
 * - "/admin/*" → AdminApp (관리자 화면)
 * 
 * Vercel SPA 배포 시 모든 요청이 이 컴포넌트로 라우트됩니다.
 */
function App() {
  useEffect(() => {
    // SPA 라우팅 디버깅
    if (__DEV__) {
      console.log(`[App] Current path: ${window.location.pathname}`);
    }
  }, []);

  const isAdminPath =
    window.location.pathname === "/admin" ||
    window.location.pathname.startsWith("/admin/");

  return isAdminPath ? <AdminApp /> : <PlayerApp />;
}

export default App;
