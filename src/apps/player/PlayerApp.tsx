import { useState, useEffect, useRef, useCallback } from "react";
import type { FormEvent } from "react";
import CompleteScreen from "./components/CompleteScreen";
import EntryScreen from "./components/EntryScreen";
import GameScreen from "./components/GameScreen";
import ResultsScreen from "./components/ResultsScreen";
import { useGameContext } from "../../context/GameContext";
import { useGameSession } from "../../hooks/useGame";
import "./player.css";

type PlayerScreen = "entry" | "game" | "complete" | "results";
const GAME_PATH = "/game";
const GAME_HISTORY_BASE_STATE = { hiddenPictureGameRoute: "game-base" };
const GAME_HISTORY_GUARD_STATE = { hiddenPictureGameRoute: "game-guard" };

const NOT_ENOUGH_QUESTIONS_MESSAGE =
  "아직 준비된 문제가 부족해요. 관리자에게 문의해주세요.";

function getRouteState(pathname: string): { screen: PlayerScreen; employeeNumber?: string } {
  if (pathname.startsWith("/results/")) {
    return {
      screen: "results",
      employeeNumber: pathname.split("/results/")[1],
    };
  }

  if (pathname === "/complete") {
    return { screen: "complete" };
  }

  if (pathname === GAME_PATH) {
    return { screen: "game" };
  }

  return { screen: "entry", employeeNumber: "" };
}

export default function PlayerApp() {
  const initialRoute = getRouteState(window.location.pathname);
  const [screen, setScreen] = useState<PlayerScreen>(initialRoute.screen);
  const [employeeNumber, setEmployeeNumber] = useState(initialRoute.employeeNumber ?? "");
  const [error, setError] = useState("");
  const [isGameExitPromptOpen, setIsGameExitPromptOpen] = useState(false);
  const { clearSession } = useGameContext();
  const { startGame, isLoading } = useGameSession();
  const screenRef = useRef(screen);
  const isGameInProgressRef = useRef(screen === "game");
  const hasGameHistoryGuardRef = useRef(false);
  const isRestoringHistoryRef = useRef(false);

  const applyRoute = useCallback((pathname: string) => {
    const nextRoute = getRouteState(pathname);
    screenRef.current = nextRoute.screen;
    setScreen(nextRoute.screen);
    if (nextRoute.employeeNumber !== undefined) {
      setEmployeeNumber(nextRoute.employeeNumber);
    }
  }, []);

  const navigateTo = useCallback((path: string) => {
    window.history.pushState({}, "", path);
    applyRoute(path);
  }, [applyRoute]);

  const replaceTo = useCallback((path: string) => {
    window.history.replaceState({}, "", path);
    applyRoute(path);
  }, [applyRoute]);

  const navigateToGame = useCallback(() => {
    if (window.location.pathname === GAME_PATH) {
      window.history.replaceState(GAME_HISTORY_BASE_STATE, "", GAME_PATH);
    } else {
      window.history.pushState(GAME_HISTORY_BASE_STATE, "", GAME_PATH);
    }
    window.history.pushState(GAME_HISTORY_GUARD_STATE, "", GAME_PATH);
    hasGameHistoryGuardRef.current = true;
    applyRoute(GAME_PATH);
  }, [applyRoute]);

  const restoreGameRoute = useCallback(() => {
    setIsGameExitPromptOpen(true);
    if (window.location.pathname !== GAME_PATH) {
      window.history.pushState(GAME_HISTORY_GUARD_STATE, "", GAME_PATH);
      applyRoute(GAME_PATH);
      return;
    }

    isRestoringHistoryRef.current = true;
    window.history.forward();
    window.setTimeout(() => {
      isRestoringHistoryRef.current = false;
      if (isGameInProgressRef.current && window.location.pathname !== GAME_PATH) {
        window.history.pushState(GAME_HISTORY_GUARD_STATE, "", GAME_PATH);
        applyRoute(GAME_PATH);
      }
    }, 0);
  }, [applyRoute]);

  useEffect(() => {
    screenRef.current = screen;
    if (screen === "game") {
      isGameInProgressRef.current = true;
      if (!hasGameHistoryGuardRef.current) {
        navigateToGame();
      }
    }
  }, [screen, navigateToGame]);

  // URL 기반 라우팅
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;

      if (isRestoringHistoryRef.current) {
        applyRoute(GAME_PATH);
        return;
      }

      if (isGameInProgressRef.current) {
        restoreGameRoute();
        return;
      }

      if (pathname === GAME_PATH) {
        window.history.replaceState({}, "", "/");
        applyRoute("/");
        return;
      }

      applyRoute(pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [applyRoute, restoreGameRoute]);

  const handleEmployeeNumberChange = (value: string) => {
    setEmployeeNumber(value);
    if (error) setError("");
  };

  const handleStart = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmployeeNumber = employeeNumber.trim();

    if (!normalizedEmployeeNumber) {
      setError("탐정 사번을 입력해 주세요.");
      return;
    }

    setEmployeeNumber(normalizedEmployeeNumber);
    setError("");

    const startResult = await startGame(normalizedEmployeeNumber);
    if (!startResult.ok) {
      setError(
        startResult.message.includes("5개")
          ? NOT_ENOUGH_QUESTIONS_MESSAGE
          : startResult.message,
      );
      return;
    }

    isGameInProgressRef.current = true;
    navigateToGame();
  };

  const handleGameComplete = () => {
    isGameInProgressRef.current = false;
    hasGameHistoryGuardRef.current = false;
    replaceTo("/complete");
  };

  const handleResultsClick = () => {
    navigateTo(`/results/${employeeNumber}`);
  };

  const handleHome = () => {
    isGameInProgressRef.current = false;
    hasGameHistoryGuardRef.current = false;
    clearSession();
    setEmployeeNumber("");
    setError("");
    navigateTo("/");
  };

  const handleStayInGame = () => {
    setIsGameExitPromptOpen(false);
  };

  const handleLeaveGame = () => {
    setIsGameExitPromptOpen(false);
    isGameInProgressRef.current = false;
    hasGameHistoryGuardRef.current = false;
    clearSession();
    setError("");
    replaceTo("/");
  };

  if (screen === "game") {
    return (
      <>
        <GameScreen isPaused={isGameExitPromptOpen} onComplete={handleGameComplete} />
        {isGameExitPromptOpen && (
          <div className="game-exit-backdrop" role="presentation">
            <section className="game-exit-dialog" role="dialog" aria-modal="true" aria-labelledby="game-exit-title">
              <h2 id="game-exit-title">진행 중인 게임을 나갈까요?</h2>
              <p>지금 나가면 현재 진행 상황이 사라집니다.</p>
              <div className="game-exit-actions">
                <button type="button" className="game-exit-secondary" onClick={handleStayInGame}>계속하기</button>
                <button type="button" className="game-exit-primary" onClick={handleLeaveGame}>나가기</button>
              </div>
            </section>
          </div>
        )}
      </>
    );
  }

  if (screen === "complete") {
    return <CompleteScreen onResults={handleResultsClick} />;
  }

  if (screen === "results") {
    return <ResultsScreen employeeNumber={employeeNumber} onHome={handleHome} />;
  }

  return (
    <EntryScreen
      employeeNumber={employeeNumber}
      error={error}
      isSubmitting={isLoading}
      onEmployeeNumberChange={handleEmployeeNumberChange}
      onSubmit={handleStart}
    />
  );
}
