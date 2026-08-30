import { useState } from "react";
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
    setScreen("game");
  };

  const handleHome = () => {
    setEmployeeNumber("");
    setScreen("entry");
  };

  if (screen === "game") {
    return <GameScreen onComplete={() => setScreen("complete")} />;
  }

  if (screen === "complete") {
    return <CompleteScreen onResults={() => setScreen("results")} />;
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
