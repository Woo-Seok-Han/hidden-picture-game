import { useState } from "react";
import type { FormEvent } from "react";
import "./player.css";

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 64">
      <circle cx="27" cy="27" r="19" />
      <path d="m41 41 15 15" />
      <path className="search-sparkle" d="m27 17 2.4 6.4L36 26l-6.6 2.5L27 35l-2.5-6.5L18 26l6.5-2.6Z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 10.5v6" />
      <path d="M12 7.4h.01" />
    </svg>
  );
}

export default function PlayerApp() {
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmployeeNumber = employeeNumber.trim();

    if (!normalizedEmployeeNumber) {
      setError("탐정 사번을 입력해 주세요.");
      return;
    }

    setError("");
    window.dispatchEvent(
      new CustomEvent("infection-game:start", {
        detail: { employeeNumber: normalizedEmployeeNumber },
      }),
    );
  };

  return (
    <main className="entry-page">
      <div className="entry-art" aria-hidden="true" />

      <section className="entry-content" aria-labelledby="entry-title">
        <header className="entry-heading">
          <div className="entry-title-row">
            <h1 id="entry-title">감염관리 탐정단</h1>
            <SearchIcon />
          </div>
          <p>
            현장의 옥의 티를 찾아내고
            <br />
            올바른 감염관리를 검증하세요!
          </p>
        </header>

        <form className="entry-card" onSubmit={handleSubmit} noValidate>
          <label htmlFor="employee-number">탐정 사번을 입력하세요</label>
          <input
            id="employee-number"
            name="employeeNumber"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={employeeNumber}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "employee-number-error" : undefined}
            placeholder="사번 6자리를 입력하세요"
            onChange={(event) => {
              setEmployeeNumber(event.target.value);
              if (error) setError("");
            }}
          />
          {error && (
            <p className="entry-error" id="employee-number-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit">게임 시작</button>
        </form>

        <aside className="entry-notice">
          <InfoIcon />
          <p>본 게임은 1인 1회만 참여 가능 합니다.</p>
        </aside>
      </section>
    </main>
  );
}
