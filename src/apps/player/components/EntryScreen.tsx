import type { FormEvent } from "react";
import { InfoIcon, SearchIcon } from "./PlayerIcons";

interface EntryScreenProps {
  employeeNumber: string;
  error: string;
  onEmployeeNumberChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function EntryScreen({ employeeNumber, error, onEmployeeNumberChange, onSubmit }: EntryScreenProps) {
  return (
    <main className="entry-page">
      <div className="entry-art" aria-hidden="true" />
      <section className="entry-content" aria-labelledby="entry-title">
        <header className="entry-heading">
          <div className="entry-title-row">
            <h1 id="entry-title">감염관리 탐정단</h1>
            <SearchIcon />
          </div>
          <p>현장의 옥의 티를 찾아내고<br />올바른 감염관리를 검증하세요!</p>
        </header>

        <form className="entry-card" onSubmit={onSubmit} noValidate>
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
            onChange={(event) => onEmployeeNumberChange(event.target.value)}
          />
          {error && <p className="entry-error" id="employee-number-error" role="alert">{error}</p>}
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
