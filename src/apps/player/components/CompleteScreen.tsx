import type { ReactNode } from "react";
import celebrationImage from "../../../assets/complete-celebration-v1.png";
import correctIcon from "../../../assets/complete-correct-icon-v1.png";
import magnifierImage from "../../../assets/complete-magnifier-v1.png";
import siteIcon from "../../../assets/complete-site-icon-v1.png";
import timeIcon from "../../../assets/complete-time-icon-v1.png";

interface CompleteScreenProps { onResults: () => void; }

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="complete-metric">
      <span className="metric-icon" aria-hidden="true">{icon}</span>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function CompleteScreen({ onResults }: CompleteScreenProps) {
  return (
    <main className="complete-page">
      <section className="complete-content">
        <img className="complete-celebration" src={celebrationImage} alt="" />
        <img className="complete-badge" src={magnifierImage} alt="" />
        <h1>수사 완료!</h1>
        <p className="complete-subtitle">감염관리 단서를 모두 확인했습니다.</p>
        <div className="complete-metrics">
          <Metric icon={<img src={siteIcon} alt="" />} label="조사한 현장" value="5" />
          <Metric icon={<img src={correctIcon} alt="" />} label="정답" value="3" />
          <Metric icon={<img src={timeIcon} alt="" />} label="소요 시간" value="01:12" />
        </div>
        <button className="results-button" type="button" onClick={onResults}>
          정답과 해설 확인하기 <span>→</span>
        </button>
      </section>
    </main>
  );
}
