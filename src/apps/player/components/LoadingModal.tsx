import { useId } from "react";

export default function LoadingModal({ title, description }: { title: string; description: string }) {
  const titleId = useId();
  const descriptionId = useId();
  return (
    <dialog
      className="game-loading-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      ref={(dialog) => {
        if (dialog && !dialog.open) dialog.showModal();
      }}
      onCancel={(event) => event.preventDefault()}
    >
      <h2 id={titleId}>{title}</h2>
      <p id={descriptionId} role="status">
        {description}<br />잠시만 기다려 주세요.
      </p>
      <div className="game-loading-bar" role="progressbar" aria-label={title}>
        <span />
      </div>
    </dialog>
  );
}
