import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { fetchUserResults } from "../../../api/gameService";
import type { GameResult, QuestionDetail } from "../../../api/gameService";
import { useGameContext } from "../../../context/GameContext";
import { StatusIcon } from "./PlayerIcons";

interface ResultsScreenProps {
  employeeNumber: string;
  onHome: () => void;
}

function SummaryItem({
  icon,
  label,
  children,
  boxed = false,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  boxed?: boolean;
}) {
  return (
    <div className={`summary-item ${boxed ? "is-boxed" : ""}`}>
      <span className="summary-icon" aria-hidden="true">
        {icon}
      </span>
      <div>
        <span>{label}</span>
        <strong>{children}</strong>
      </div>
    </div>
  );
}

export default function ResultsScreen({
  employeeNumber,
  onHome,
}: ResultsScreenProps) {
  const { gameResult } = useGameContext();
  const [result, setResult] = useState<GameResult | null>(gameResult);
  const [isLoading, setIsLoading] = useState(!gameResult?.details?.length);
  const [error, setError] = useState("");

  useEffect(() => {
    if (gameResult?.details?.length) {
      const timeoutId = window.setTimeout(() => {
        setResult(gameResult);
        setIsLoading(false);
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    let ignore = false;
    async function loadResult() {
      setIsLoading(true);
      const loadedResult = await fetchUserResults(employeeNumber);
      if (ignore) {
        return;
      }
      if (!loadedResult) {
        setError("결과를 불러오지 못했습니다.");
      }
      setResult(loadedResult ?? gameResult);
      setIsLoading(false);
    }

    loadResult();
    return () => {
      ignore = true;
    };
  }, [employeeNumber, gameResult]);

  if (isLoading) {
    return (
      <main className="results-page results-state-page">
        <section className="results-state">
          <h1>채점 결과를 불러오는 중입니다.</h1>
        </section>
      </main>
    );
  }

  if (error || !result) {
    return (
      <main className="results-page results-state-page">
        <section className="results-state">
          <h1>{error || "표시할 결과가 없습니다."}</h1>
          <button className="home-button" type="button" onClick={onHome}>
            처음으로 돌아가기
          </button>
        </section>
      </main>
    );
  }

  const totalQuestions = result.totalQuestions || result.details?.length || 0;
  const wrongAnswers = Math.max(0, totalQuestions - result.correctAnswers);
  const accuracyPercent = Math.round(result.accuracy * 100);
  const details = result.details ?? [];

  return (
    <main className="results-page">
      <header className="results-summary">
        <SummaryItem icon="♟" label="참여자 사번" boxed>
          {result.employeeNumber}
        </SummaryItem>
        <SummaryItem icon={<StatusIcon correct />} label="정답">
          {result.correctAnswers}
        </SummaryItem>
        <SummaryItem icon={<StatusIcon correct={false} />} label="오답">
          {wrongAnswers}
        </SummaryItem>
        <SummaryItem icon="−" label="정답률">
          {accuracyPercent}%{" "}
          <small>
            ({result.correctAnswers}/{totalQuestions})
          </small>
        </SummaryItem>
        <SummaryItem icon="◷" label="총 소요 시간">
          {result.totalTime}
        </SummaryItem>
        <SummaryItem icon="☑" label="총 문제" boxed>
          {totalQuestions}문제
        </SummaryItem>
      </header>

      <section className="results-content">
        <div className="results-title-row">
          <h1>☑ 문제별 결과 및 해설</h1>
          <div className="results-legend">
            <span>
              <StatusIcon correct /> 정답
            </span>
            <span>
              <StatusIcon correct={false} /> 오답
            </span>
            <span>
              <i>−</i> 정답 없음(선택)
            </span>
          </div>
        </div>

        <ol className="result-list">
          {details.map((item: QuestionDetail, index) => (
            <li className="result-card" key={item.questionId}>
              <span className="result-number">{index + 1}</span>
              <div className="result-image">
                {item.imageUrl ? (
                  <>
                    <img src={item.imageUrl} alt={`${item.title} 이미지`} />
                    {item.errorAreas?.map((area, areaIndex) => (
                      <span
                        key={`${item.questionId}-${areaIndex}`}
                        className="correct-answer-area"
                        style={{
                          left: `${area.x * 100}%`,
                          top: `${area.y * 100}%`,
                          width: `${area.width * 100}%`,
                          height: `${area.height * 100}%`,
                        }}
                      />
                    ))}
                  </>
                ) : (
                  <span>문제 이미지</span>
                )}
              </div>
              <div className="result-answer">
                {/* <h2>{item.title}</h2> */}
                <dl>
                  <div>
                    <dt>당신의 선택</dt>
                    <dd
                      className={
                        item.userAnswer === "오류 있음"
                          ? "has-error"
                          : "no-error"
                      }
                    >
                      {item.userAnswer}
                    </dd>
                  </div>
                  <div>
                    <dt>정답</dt>
                    <dd
                      className={
                        item.correctAnswer === "오류 있음"
                          ? "has-error"
                          : "no-error"
                      }
                    >
                      {item.correctAnswer}
                    </dd>
                  </div>
                </dl>
              </div>
              <div
                className={`result-explanation ${
                  item.isCorrect ? "correct" : "wrong"
                }`}
              >
                <h3>
                  <StatusIcon correct={item.isCorrect} />{" "}
                  {item.isCorrect ? "정답입니다!" : "오답입니다."}
                </h3>
                <p>{item.explanation}</p>
              </div>
            </li>
          ))}
        </ol>
        <button className="home-button" type="button" onClick={onHome}>
          ⌂ 처음으로 돌아가기
        </button>
      </section>
    </main>
  );
}
