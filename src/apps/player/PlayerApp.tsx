import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import CompleteScreen from "./components/CompleteScreen";
import EntryScreen from "./components/EntryScreen";
import GameScreen from "./components/GameScreen";
import ResultsScreen from "./components/ResultsScreen";
import "./player.css";

type PlayerScreen = "entry" | "game" | "complete" | "results";

export default function PlayerApp() {
  const [screen, setScreen] = useState<PlayerScreen>("entry");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [error, setError] = useState("");

  // URL 기반 라우팅
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;
      
      if (pathname.startsWith("/results/")) {
        const empNumber = pathname.split("/results/")[1];
        setEmployeeNumber(empNumber);
        setScreen("results");
      } else if (pathname === "/complete") {
        setScreen("complete");
      } else if (pathname === "/game") {
        setScreen("game");
      } else {
        setScreen("entry");
        setEmployeeNumber("");
      }
    };

    // 초기 경로 처리
    handlePopState();

    // 브라우저 뒤로/앞으로 이벤트 처리
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleEmployeeNumberChange = (value: string) => {
    setEmployeeNumber(value);
    if (error) setError("");
  };

  const handleStart = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmployeeNumber = employeeNumber.trim();

    if (!normalizedEmployeeNumber) {
      setError("탐정 사번을 입력해 주세요.");
      return;
    }

    setEmployeeNumber(normalizedEmployeeNumber);
    setError("");
    
    window.dispatchEvent(
      new CustomEvent("infection-game:start", {
        detail: { employeeNumber: normalizedEmployeeNumber },
      }),
    );

    navigateTo("/game");
  };

  const handleGameComplete = () => {
    navigateTo("/complete");
  };

  const handleResultsClick = () => {
    navigateTo(`/results/${employeeNumber}`);
  };

  const handleHome = () => {
    setEmployeeNumber("");
    setError("");
    navigateTo("/");
  };

  if (screen === "game") {
    return <GameScreen onComplete={handleGameComplete} />;
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
      onEmployeeNumberChange={handleEmployeeNumberChange}
      onSubmit={handleStart}
    />
  );
}
