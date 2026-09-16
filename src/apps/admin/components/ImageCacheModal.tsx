import { useEffect, useRef, useState } from "react";
import { fetchAdminQuestions } from "../../../api/gameService";
import { getCacheImageUrls, warmImages } from "../data/imageCache";

export default function ImageCacheModal({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const controller = useRef<AbortController | null>(null);
  const [status, setStatus] = useState<"loading" | "running" | "done" | "stopped" | "error">("loading");
  const [counts, setCounts] = useState({ total: 0, success: 0, failed: 0 });
  const busy = status === "loading" || status === "running";
  const completed = counts.success + counts.failed;
  const percent = counts.total ? Math.round(completed / counts.total * 100) : 0;

  useEffect(() => {
    const element = dialog.current!;
    const preventDismiss = (event: Event) => event.preventDefault();
    const preventEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") event.preventDefault();
    };
    element.addEventListener("cancel", preventDismiss);
    element.addEventListener("keydown", preventEscape);
    element.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const task = new AbortController();
    controller.current = task;
    async function run() {
      try {
        const questions = await fetchAdminQuestions(task.signal);
        if (task.signal.aborted) return;
        const urls = getCacheImageUrls(questions);
        setCounts({ total: urls.length, success: 0, failed: 0 });
        setStatus("running");
        await warmImages(urls, task.signal, (success, failed) => {
          setCounts({ total: urls.length, success, failed });
        });
        if (!task.signal.aborted) setStatus("done");
      } catch {
        if (!task.signal.aborted) setStatus("error");
      }
    }
    void run();
    const onPageHide = () => task.abort();
    window.addEventListener("pagehide", onPageHide);
    return () => {
      task.abort();
      element.close();
      element.removeEventListener("cancel", preventDismiss);
      element.removeEventListener("keydown", preventEscape);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  const title = busy ? "이미지 캐시 준비 중" : status === "stopped" ? "캐시 준비 중단" : status === "error" ? "목록 조회 실패" : "캐시 준비 완료";
  return (
    <dialog ref={dialog} className="image-cache-modal" aria-labelledby="cache-title"
      aria-describedby="cache-description" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
      <div className={`cache-status-icon${busy ? " is-spinning" : ""}`} aria-hidden="true">
        {!busy && (status === "done" ? "✓" : "!")}
      </div>
      <h2 id="cache-title">{title}</h2>
      <p id="cache-description">
        {status === "loading" ? "등록된 전체 문제를 확인하고 있습니다." :
          status === "error" ? "문제 목록을 불러오지 못했습니다. 잠시 후 다시 실행해주세요." :
          status === "stopped" ? "요청을 중단했습니다. 필요하면 전체 작업을 다시 실행해주세요." :
          status === "done" && counts.total === 0 ? "캐시를 준비할 이미지가 없습니다." :
          "모든 문제의 게임용·해설용 이미지를 준비합니다."}
      </p>
      <progress max={counts.total || 1} value={completed} aria-label="이미지 요청 진행률" />
      <div className="cache-progress-label"><span>{completed} / {counts.total} 요청</span><strong>{percent}%</strong></div>
      <div className="cache-counts" role="status" aria-live="polite">
        <span>성공 <strong>{counts.success}</strong></span><span>실패 <strong>{counts.failed}</strong></span>
      </div>
      {busy && <p className="cache-help">이 화면을 유지해주세요. 페이지를 떠나면 작업이 중단됩니다.</p>}
      <button type="button" className={busy ? "secondary-admin-button" : "primary-admin-button"}
        onClick={busy ? () => { controller.current?.abort(); setStatus("stopped"); } : onClose}>
        {busy ? "중단" : "닫기"}
      </button>
    </dialog>
  );
}
