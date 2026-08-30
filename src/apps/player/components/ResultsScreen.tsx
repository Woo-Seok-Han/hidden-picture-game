import type { ReactNode } from "react";
import { results } from "../data/results";
import { StatusIcon } from "./PlayerIcons";

interface ResultsScreenProps {
  employeeNumber: string;
  onHome: () => void;
}

function SummaryItem({ icon, label, children, boxed = false }: { icon: ReactNode; label: string; children: ReactNode; boxed?: boolean }) {
  return (
    <div className={`summary-item ${boxed ? "is-boxed" : ""}`}>
      <span className="summary-icon" aria-hidden="true">{icon}</span>
      <div><span>{label}</span><strong>{children}</strong></div>
    </div>
  );
}

export default function ResultsScreen({ employeeNumber, onHome }: ResultsScreenProps) {
  return (
    <main className="results-page">
      <header className="results-summary">
        <SummaryItem icon="♟" label="참여자 사번" boxed>{employeeNumber}</SummaryItem>
        <SummaryItem icon={<StatusIcon correct />} label="정답">4</SummaryItem>
        <SummaryItem icon={<StatusIcon correct={false} />} label="오답">1</SummaryItem>
        <SummaryItem icon="−" label="정답률">80% <small>(4/5)</small></SummaryItem>
        <SummaryItem icon="◷" label="총 소요 시간">02:18</SummaryItem>
        <SummaryItem icon="☑" label="총 문제" boxed>5문제</SummaryItem>
      </header>

      <section className="results-content">
        <div className="results-title-row">
          <h1>☑ 문제별 결과 및 해설</h1>
          <div className="results-legend">
            <span><StatusIcon correct /> 정답</span>
            <span><StatusIcon correct={false} /> 오답</span>
            <span><i>−</i> 정답 없음(선택)</span>
          </div>
        </div>

        <ol className="result-list">
          {results.map((item, index) => (
            <li className="result-card" key={item.title}>
              <span className="result-number">{index + 1}</span>
              <div className="result-image"><span>문제 이미지</span></div>
              <div className="result-answer">
                <h2>{item.title}</h2>
                <dl>
                  <div><dt>당신의 선택</dt><dd className={item.selected === "오류 있음" ? "has-error" : "no-error"}>{item.selected}</dd></div>
                  <div><dt>정답</dt><dd className={item.answer === "오류 있음" ? "has-error" : "no-error"}>{item.answer}</dd></div>
                </dl>
              </div>
              <div className={`result-explanation ${item.correct ? "correct" : "wrong"}`}>
                <h3><StatusIcon correct={item.correct} /> {item.correct ? "정답입니다!" : "오답입니다."}</h3>
                <p>{item.explanation}</p>
              </div>
            </li>
          ))}
        </ol>
        <button className="home-button" type="button" onClick={onHome}>⌂ 처음으로 돌아가기</button>
      </section>
    </main>
  );
}
