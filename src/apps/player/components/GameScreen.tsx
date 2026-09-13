import { useCallback, useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { fetchQuestions } from "../../../api/gameService";
import type { Answer, Question } from "../../../api/gameService";
import { useGameContext } from "../../../context/GameContext";
import { useGameAnswers } from "../../../hooks/useGame";
import { TimerIcon } from "./PlayerIcons";

const ANSWER_FEEDBACK_DURATION_MS = 1500;

interface GameScreenProps {
  isPaused?: boolean;
  onComplete: () => void;
}

type AnswerFeedback = {
  correct: boolean;
};

function isPointInErrorArea(point: { x: number; y: number }, question: Question) {
  return question.errorAreas?.some((area) => (
    point.x >= area.x
    && point.x <= area.x + area.width
    && point.y >= area.y
    && point.y <= area.y + area.height
  )) ?? false;
}

function isAnswerCorrect(question: Question, point: { x: number; y: number } | null) {
  const hasError = Boolean(question.errorAreas?.length);
  if (!hasError) {
    return point === null;
  }
  return point !== null && isPointInErrorArea(point, question);
}

function playAnswerFeedbackSound(correct: boolean) {
  try {
    const AudioContextConstructor = window.AudioContext
      ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextConstructor) {
      return;
    }

    const audioContext = new AudioContextConstructor();
    const now = audioContext.currentTime;
    const gain = audioContext.createGain();
    gain.connect(audioContext.destination);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(correct ? 0.08 : 0.07, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

    const tones = correct
      ? [{ frequency: 660, delay: 0 }, { frequency: 880, delay: 0.11 }]
      : [{ frequency: 220, delay: 0 }, { frequency: 150, delay: 0.11 }];

    tones.forEach(({ frequency, delay }) => {
      const oscillator = audioContext.createOscillator();
      oscillator.type = correct ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(frequency, now + delay);
      oscillator.connect(gain);
      oscillator.start(now + delay);
      oscillator.stop(now + delay + 0.16);
    });

    window.setTimeout(() => {
      void audioContext.close();
    }, 450);
  } catch {
    // Some browsers block audio creation until user interaction. Feedback UI still works.
  }
}

export default function GameScreen({
  isPaused = false,
  onComplete,
}: GameScreenProps) {
  const { session } = useGameContext();
  const { submitAnswers } = useGameAnswers();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [selectedPoint, setSelectedPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<AnswerFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    let ignore = false;

    async function loadQuestions() {
      const loadedQuestions = await fetchQuestions();
      if (ignore) {
        return;
      }
      setQuestions(loadedQuestions);
      setSecondsLeft(loadedQuestions[0]?.timeLimitSeconds ?? 15);
      if (loadedQuestions.length === 0) {
        setError(
          "등록된 문제가 없습니다. 관리자 화면에서 문제를 등록해주세요."
        );
      }
    }

    loadQuestions();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!currentQuestion || isSubmitting || isPaused) {
      return;
    }

    const timerId = window.setInterval(() => {
      setSecondsLeft((seconds) => (seconds > 0 ? seconds - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [currentQuestion, isPaused, isSubmitting]);

  const submitAnswer = useCallback(
    async (point: { x: number; y: number } | null) => {
      if (isSubmitting || isPaused) return;
      if (!session) {
        setError("게임 세션이 없습니다. 처음 화면에서 다시 시작해주세요.");
        return;
      }
      if (!currentQuestion) {
        return;
      }

      setIsSubmitting(true);
      setError("");
      const correct = isAnswerCorrect(currentQuestion, point);
      setAnswerFeedback({ correct });
      playAnswerFeedbackSound(correct);

      const nextAnswers = [
        ...answers,
        {
          questionId: currentQuestion.id,
          questionNumber: currentQuestion.questionNumber,
          selectedPoint: point ?? undefined,
          hasError: Boolean(point),
          timestamp: new Date().toISOString(),
        },
      ];

      if (currentQuestionIndex === questions.length - 1) {
        window.setTimeout(async () => {
          const submitted = await submitAnswers(nextAnswers);
          if (submitted) {
            onComplete();
            return;
          }
          setAnswerFeedback(null);
          setIsSubmitting(false);
          setError("답변을 제출하지 못했습니다. 다시 시도해주세요.");
        }, ANSWER_FEEDBACK_DURATION_MS);
        return;
      }

      window.setTimeout(() => {
        const nextIndex = currentQuestionIndex + 1;
        setAnswers(nextAnswers);
        setCurrentQuestionIndex(nextIndex);
        setSecondsLeft(questions[nextIndex]?.timeLimitSeconds ?? 15);
        setSelectedPoint(null);
        setImageSize(null);
        setAnswerFeedback(null);
        setIsSubmitting(false);
      }, ANSWER_FEEDBACK_DURATION_MS);
    },
    [
      answers,
      currentQuestion,
      currentQuestionIndex,
      isPaused,
      isSubmitting,
      onComplete,
      questions,
      session,
      submitAnswers,
    ]
  );

  useEffect(() => {
    if (secondsLeft !== 0 || isSubmitting || isPaused || !currentQuestion) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      submitAnswer(null);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [currentQuestion, isPaused, isSubmitting, secondsLeft, submitAnswer]);

  const handleImageClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (isSubmitting || isPaused || !imageSize) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) return;
    const point = {
      x: (event.clientX - bounds.left) / bounds.width,
      y: (event.clientY - bounds.top) / bounds.height,
    };
    if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) return;
    setSelectedPoint(point);
    submitAnswer(point);
  };

  if (error) {
    return (
      <main className="game-page game-message-page">
        <section className="game-message">
          <h1>{error}</h1>
        </section>
      </main>
    );
  }

  if (!currentQuestion) {
    return (
      <main className="game-page game-message-page">
        <section className="game-message">
          <h1>문제를 불러오는 중입니다.</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="game-page">
      <header className="game-header">
        <p className="game-progress">
          문제 {currentQuestionIndex + 1} / {questions.length}
        </p>
        <h1>오류가 있는 부분을 터치하세요</h1>
        <div className="game-timer" aria-label={`남은 시간 ${secondsLeft}초`}>
          <TimerIcon />
          <time dateTime={`PT${secondsLeft}S`}>
            00:{String(secondsLeft).padStart(2, "0")}
          </time>
        </div>
      </header>

      <div className="question-image-stage">
        <button
          className="question-image-placeholder has-image"
          type="button"
          aria-label={`${currentQuestion.questionNumber}번 문제 이미지에서 잘못된 부분 선택`}
          disabled={isSubmitting || isPaused || !imageSize}
          onClick={handleImageClick}
          style={
            imageSize
              ? {
                  width: `min(100cqw, calc(100cqh * ${
                    imageSize.width / imageSize.height
                  }))`,
                  aspectRatio: `${imageSize.width} / ${imageSize.height}`,
                }
              : { height: "100%" }
          }
        >
          <img
            key={currentQuestion.id}
            src={currentQuestion.imageUrl}
            alt={currentQuestion.imageAlt}
            draggable={false}
            onLoad={(event) =>
              setImageSize({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              })
            }
          />
          {selectedPoint && (
            <i
              className="selected-point"
              style={{
                left: `${selectedPoint.x * 100}%`,
                top: `${selectedPoint.y * 100}%`,
              }}
              aria-hidden="true"
            />
          )}
          {answerFeedback && (
            <output
              className={`answer-feedback ${answerFeedback.correct ? "is-correct" : "is-wrong"}`}
              aria-live="assertive"
              aria-label={answerFeedback.correct ? "정답입니다" : "오답입니다"}
            >
              {answerFeedback.correct ? "O" : "X"}
            </output>
          )}
        </button>
      </div>

      <footer className="game-action-bar">
        <p>오류가 없다면</p>
        <button
          type="button"
          className="no-error-button"
          disabled={isSubmitting || isPaused}
          onClick={() => submitAnswer(null)}
        >
          오류 없음
        </button>
        <p>을 눌러주세요.</p>
      </footer>
    </main>
  );
}
