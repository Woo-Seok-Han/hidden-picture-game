export function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 64">
      <circle cx="27" cy="27" r="19" />
      <path d="m41 41 15 15" />
      <path className="search-sparkle" d="m27 17 2.4 6.4L36 26l-6.6 2.5L27 35l-2.5-6.5L18 26l6.5-2.6Z" />
    </svg>
  );
}

export function InfoIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 10.5v6" />
      <path d="M12 7.4h.01" />
    </svg>
  );
}

export function TimerIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48">
      <circle cx="24" cy="27" r="15" />
      <path d="M24 27V17M24 27l7 4M19 5h10M24 5v7M37 14l3-3" />
    </svg>
  );
}

export function StatusIcon({ correct }: { correct: boolean }) {
  return (
    <span className={`status-icon ${correct ? "is-correct" : "is-wrong"}`} aria-hidden="true">
      {correct ? "✓" : "×"}
    </span>
  );
}
