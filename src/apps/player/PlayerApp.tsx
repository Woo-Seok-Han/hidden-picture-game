import { useEffect, useState } from "react";
import type { FormEvent, MouseEvent, ReactNode } from "react";
import celebrationImage from "../../assets/complete-celebration-v1.png";
import correctIcon from "../../assets/complete-correct-icon-v1.png";
import magnifierImage from "../../assets/complete-magnifier-v1.png";
import siteIcon from "../../assets/complete-site-icon-v1.png";
import timeIcon from "../../assets/complete-time-icon-v1.png";
import "./player.css";

type PlayerScreen = "entry" | "game" | "complete" | "results";
type ResultItem = { title: string; selected: "오류 있음" | "오류 없음"; answer: "오류 있음" | "오류 없음"; correct: boolean; explanation: string };

const results: ResultItem[] = [
  { title: "처치 카트", selected: "오류 있음", answer: "오류 있음", correct: true, explanation: "손소독제가 환자 접촉 부위보다 너무 높은 위치에 있어 쉽게 오염될 수 있습니다. 눈높이 이하의 깨끗한 위치에 보관해야 합니다." },
  { title: "물품 보관장", selected: "오류 있음", answer: "오류 없음", correct: false, explanation: "해당 사진의 물품들은 모두 적절한 위치와 방법으로 보관되어 있습니다." },
  { title: "손위생 공간", selected: "오류 있음", answer: "오류 있음", correct: true, explanation: "일회용 장갑이 손위생 공간에 보관되어 교차오염의 위험이 있습니다. 손위생 공간에는 장갑을 두지 않아야 합니다." },
  { title: "냉장 약품 보관함", selected: "오류 있음", answer: "오류 있음", correct: true, explanation: "냉장 보관이 필요한 약품이 냉장고 문 쪽에 있어 온도 변화의 영향을 받을 수 있습니다. 냉장고 내부 깊숙한 위치에 보관해야 합니다." },
  { title: "폐기물 보관 구역", selected: "오류 없음", answer: "오류 있음", correct: false, explanation: "주사바늘이 일반 쓰레기통 근처에 노출되어 있습니다. 날카로운 폐기물은 전용 용기에 담아 보관해야 합니다." },
];

function SearchIcon() { return <svg aria-hidden="true" viewBox="0 0 64 64"><circle cx="27" cy="27" r="19" /><path d="m41 41 15 15" /><path className="search-sparkle" d="m27 17 2.4 6.4L36 26l-6.6 2.5L27 35l-2.5-6.5L18 26l6.5-2.6Z" /></svg>; }
function InfoIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 10.5v6" /><path d="M12 7.4h.01" /></svg>; }
function TimerIcon() { return <svg aria-hidden="true" viewBox="0 0 48 48"><circle cx="24" cy="27" r="15" /><path d="M24 27V17M24 27l7 4M19 5h10M24 5v7M37 14l3-3" /></svg>; }
function StatusIcon({ correct }: { correct: boolean }) { return <span className={`status-icon ${correct ? "is-correct" : "is-wrong"}`} aria-hidden="true">{correct ? "✓" : "×"}</span>; }

function GameScreen({ onComplete }: { onComplete: () => void }) {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [selectedPoint, setSelectedPoint] = useState<{ x: number; y: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => { const timerId = window.setInterval(() => setSecondsLeft((seconds) => (seconds > 0 ? seconds - 1 : 0)), 1000); return () => window.clearInterval(timerId); }, []);

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
    setSelectedPoint({ x: (event.clientX - bounds.left) / bounds.width, y: (event.clientY - bounds.top) / bounds.height });
    submitAnswer();
  };
  return <main className="game-page">
    <header className="game-header"><p className="game-progress">문제 {currentQuestion} / 5</p><h1>잘못 보관된 부분을 터치하세요</h1><div className="game-timer" aria-label={`남은 시간 ${secondsLeft}초`}><TimerIcon /><time dateTime={`PT${secondsLeft}S`}>00:{String(secondsLeft).padStart(2, "0")}</time></div></header>
    <button className="question-image-placeholder" type="button" aria-label={`${currentQuestion}번 문제 이미지에서 잘못된 부분 선택`} disabled={isSubmitting} onClick={handleImageClick}><span>관리자 화면에서 업로드한 {currentQuestion}번 문제 이미지가 표시됩니다.</span>{selectedPoint && <i className="selected-point" style={{ left: `${selectedPoint.x * 100}%`, top: `${selectedPoint.y * 100}%` }} aria-hidden="true" />}</button>
    <footer className="game-action-bar"><p>오류가 없다면</p><button type="button" className="no-error-button" disabled={isSubmitting} onClick={submitAnswer}>오류 없음</button><p>을 눌러주세요.</p></footer>
  </main>;
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="complete-metric"><span className="metric-icon" aria-hidden="true">{icon}</span><span>{label}</span><strong>{value}</strong></div>;
}

function CompleteScreen({ onResults }: { onResults: () => void }) {
  return <main className="complete-page">
    <section className="complete-content">
      <img className="complete-celebration" src={celebrationImage} alt="" />
      <img className="complete-badge" src={magnifierImage} alt="" />
      <h1>수사 완료!</h1><p className="complete-subtitle">감염관리 단서를 모두 확인했습니다.</p>
      <div className="complete-metrics">
        <Metric icon={<img src={siteIcon} alt="" />} label="조사한 현장" value="5" />
        <Metric icon={<img src={correctIcon} alt="" />} label="정답" value="3" />
        <Metric icon={<img src={timeIcon} alt="" />} label="소요 시간" value="01:12" />
      </div>
      <button className="results-button" type="button" onClick={onResults}>정답과 해설 확인하기 <span>→</span></button>
    </section>
  </main>;
}

function SummaryItem({ icon, label, children, boxed = false }: { icon: ReactNode; label: string; children: ReactNode; boxed?: boolean }) {
  return <div className={`summary-item ${boxed ? "is-boxed" : ""}`}><span className="summary-icon" aria-hidden="true">{icon}</span><div><span>{label}</span><strong>{children}</strong></div></div>;
}

function ResultsScreen({ employeeNumber, onHome }: { employeeNumber: string; onHome: () => void }) {
  return <main className="results-page">
    <header className="results-summary">
      <SummaryItem icon="♟" label="참여자 사번" boxed>{employeeNumber}</SummaryItem>
      <SummaryItem icon={<StatusIcon correct />} label="정답">4</SummaryItem>
      <SummaryItem icon={<StatusIcon correct={false} />} label="오답">1</SummaryItem>
      <SummaryItem icon="−" label="정답률">80% <small>(4/5)</small></SummaryItem>
      <SummaryItem icon="◷" label="총 소요 시간">02:18</SummaryItem>
      <SummaryItem icon="☑" label="총 문제" boxed>5문제</SummaryItem>
    </header>
    <section className="results-content">
      <div className="results-title-row"><h1>☑ 문제별 결과 및 해설</h1><div className="results-legend"><span><StatusIcon correct /> 정답</span><span><StatusIcon correct={false} /> 오답</span><span><i>−</i> 정답 없음(선택)</span></div></div>
      <ol className="result-list">
        {results.map((item, index) => <li className="result-card" key={item.title}>
          <span className="result-number">{index + 1}</span><div className="result-image"><span>문제 이미지</span></div>
          <div className="result-answer"><h2>{item.title}</h2><dl><div><dt>당신의 선택</dt><dd className={item.selected === "오류 있음" ? "has-error" : "no-error"}>{item.selected}</dd></div><div><dt>정답</dt><dd className={item.answer === "오류 있음" ? "has-error" : "no-error"}>{item.answer}</dd></div></dl></div>
          <div className={`result-explanation ${item.correct ? "correct" : "wrong"}`}><h3><StatusIcon correct={item.correct} /> {item.correct ? "정답입니다!" : "오답입니다."}</h3><p>{item.explanation}</p></div>
        </li>)}
      </ol>
      <button className="home-button" type="button" onClick={onHome}>⌂ 처음으로 돌아가기</button>
    </section>
  </main>;
}

export default function PlayerApp() {
  const [screen, setScreen] = useState<PlayerScreen>("entry");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [error, setError] = useState("");
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const normalized = employeeNumber.trim(); if (!normalized) { setError("사번을 입력해 주세요."); return; } setEmployeeNumber(normalized); setError(""); window.dispatchEvent(new CustomEvent("infection-game:start", { detail: { employeeNumber: normalized } })); setScreen("game"); };
  if (screen === "game") return <GameScreen onComplete={() => setScreen("complete")} />;
  if (screen === "complete") return <CompleteScreen onResults={() => setScreen("results")} />;
  if (screen === "results") return <ResultsScreen employeeNumber={employeeNumber} onHome={() => { setEmployeeNumber(""); setScreen("entry"); }} />;
  return <main className="entry-page"><div className="entry-art" aria-hidden="true" /><section className="entry-content" aria-labelledby="entry-title"><header className="entry-heading"><div className="entry-title-row"><h1 id="entry-title">감염관리 오류찾기</h1><SearchIcon /></div><p>사진 속 잘못된 부분을 찾아내고<br />올바른 감염관리를 확인하세요!</p></header><form className="entry-card" onSubmit={handleSubmit} noValidate><label htmlFor="employee-number">참여 사번을 입력하세요</label><input id="employee-number" name="employeeNumber" type="text" inputMode="numeric" autoComplete="off" value={employeeNumber} aria-invalid={Boolean(error)} aria-describedby={error ? "employee-number-error" : undefined} placeholder="사번 6자리를 입력하세요" onChange={(event) => { setEmployeeNumber(event.target.value); if (error) setError(""); }} />{error && <p className="entry-error" id="employee-number-error" role="alert">{error}</p>}<button type="submit">게임 시작</button></form><aside className="entry-notice"><InfoIcon /><p>본 게임은 1일 1회만 참여 가능합니다.</p></aside></section></main>;
}
