import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { TimerIcon } from "./PlayerIcons";

interface GameScreenProps { onComplete: () => void; }

export default function GameScreen({ onComplete }: GameScreenProps) {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [selectedPoint, setSelectedPoint] = useState<{ x: number; y: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setSecondsLeft((seconds) => (seconds > 0 ? seconds - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timerId);
  }, []);

  const submitAnswer = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    window.setTimeout(() => {
      if (currentQuestion === 5) {
        onComplete();
        return;
      }
      setCurrentQuestion((question) => question + 1);
      setSecondsLeft(15);
      setSelectedPoint(null);
      setIsSubmitting(false);
    }, 350);
  };

  const handleImageClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (isSubmitting) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setSelectedPoint({
      x: (event.clientX - bounds.left) / bounds.width,
      y: (event.clientY - bounds.top) / bounds.height,
    });
    submitAnswer();
  };

  return (
    <main className="game-page">
      <header className="game-header">
        <p className="game-progress">문제 {currentQuestion} / 5</p>
        <h1>잘못 보관된 부분을 터치하세요</h1>
        <div className="game-timer" aria-label={`남은 시간 ${secondsLeft}초`}>
          <TimerIcon />
          <time dateTime={`PT${secondsLeft}S`}>00:{String(secondsLeft).padStart(2, "0")}</time>
        </div>
      </header>

      <button className="question-image-placeholder" type="button" aria-label={`${currentQuestion}번 문제 이미지에서 잘못된 부분 선택`} disabled={isSubmitting} onClick={handleImageClick}>
        <span>관리자 화면에서 업로드한 {currentQuestion}번 문제 이미지가 표시됩니다.</span>
        {selectedPoint && <i className="selected-point" style={{ left: `${selectedPoint.x * 100}%`, top: `${selectedPoint.y * 100}%` }} aria-hidden="true" />}
      </button>

      <footer className="game-action-bar">
        <p>오류가 없다면</p>
        <button type="button" className="no-error-button" disabled={isSubmitting} onClick={submitAnswer}>오류 없음</button>
        <p>을 눌러주세요.</p>
      </footer>
    </main>
  );
}
