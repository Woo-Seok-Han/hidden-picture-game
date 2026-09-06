import "./admin.css";

import { useState } from "react";

import AdminQuestionPage from "./pages/AdminQuestionPage";
import AdminResultsPage from "./pages/AdminResultsPage";

type AdminScreen = "questions" | "results";

export default function AdminApp() {
  const [screen, setScreen] = useState<AdminScreen>("questions");

  return (
    <>
      <nav className="admin-main-tabs" aria-label="관리자 주요 메뉴">
        <button
          type="button"
          className={screen === "questions" ? "is-active" : ""}
          onClick={() => setScreen("questions")}
        >
          문제 관리
        </button>
        <button
          type="button"
          className={screen === "results" ? "is-active" : ""}
          onClick={() => setScreen("results")}
        >
          게임 현황
        </button>
      </nav>
      {screen === "questions" ? <AdminQuestionPage /> : <AdminResultsPage />}
    </>
  );
}
