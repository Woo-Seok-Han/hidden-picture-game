import { useEffect, type ReactNode } from "react";
import { useGameContext } from "../../../context/GameContext";
import { getResultImageUrl } from "../data/resultImage";

const celebrationImage = "https://img.flickrlab.com/cdn-cgi/image/format=webp/assets/complete-celebration-v1.webp";
const correctIcon = "https://img.flickrlab.com/cdn-cgi/image/format=webp/assets/complete-correct-icon-v1.webp";
const magnifierImage = "https://img.flickrlab.com/cdn-cgi/image/format=webp/assets/complete-magnifier-v1.webp";
const siteIcon = "https://img.flickrlab.com/cdn-cgi/image/format=webp/assets/complete-site-icon-v1.webp";
const timeIcon = "https://img.flickrlab.com/cdn-cgi/image/format=webp/assets/complete-time-icon-v1.webp";

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
  const { gameResult } = useGameContext();
  useEffect(() => {
    let cancelled = false;
    const urls = [...new Set(
      (gameResult?.details ?? []).map((detail) => getResultImageUrl(detail.imageUrl)).filter(Boolean),
    )];

    async function preloadResults() {
      // Warm one thumbnail at a time without delaying the results button.
      for (const url of urls) {
        if (cancelled) return;
        const image = new Image();
        image.fetchPriority = "low";
        image.decoding = "async";
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        try {
          await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new Error("Thumbnail preload failed"));
            timeoutId = setTimeout(() => reject(new Error("Thumbnail preload timed out")), 10000);
            image.src = url;
          });
          if (!cancelled && typeof image.decode === "function") await image.decode();
        } catch {
          // The results screen can retry; a failed preview must not block navigation.
        } finally {
          clearTimeout(timeoutId);
          image.onload = null;
          image.onerror = null;
        }
      }
    }

    void preloadResults();
    return () => { cancelled = true; };
  }, [gameResult]);

  const totalQuestions = gameResult?.totalQuestions ?? 0;
  const correctAnswers = gameResult?.correctAnswers ?? 0;
  const totalTime = gameResult?.totalTime ?? "--:--";

  return (
    <main className="complete-page">
      <section className="complete-content">
        <img className="complete-celebration" src={celebrationImage} alt="" />
        <img className="complete-badge" src={magnifierImage} alt="" />
        <h1>수사 완료!</h1>
        <p className="complete-subtitle">감염관리 단서를 모두 확인했습니다.</p>
        <div className="complete-metrics">
          <Metric icon={<img src={siteIcon} alt="" />} label="조사한 현장" value={String(totalQuestions)} />
          <Metric icon={<img src={correctIcon} alt="" />} label="정답" value={String(correctAnswers)} />
          <Metric icon={<img src={timeIcon} alt="" />} label="소요 시간" value={totalTime} />
        </div>
        <button className="results-button" type="button" onClick={onResults}>
          정답과 해설 확인하기 <span>→</span>
        </button>
      </section>
    </main>
  );
}
