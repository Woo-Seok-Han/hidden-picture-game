import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchAdminResults } from "../../../api/gameService";
import type { GameResult } from "../../../api/gameService";

function parseDurationSeconds(duration: string): number {
  const parts = duration.split(":").map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) {
    return 0;
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  return 0;
}

function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function formatDateTime(value?: string): string {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

type ExcelCell = string | number;

function escapeXml(value: string | number): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getColumnName(index: number): string {
  let columnName = "";
  let columnIndex = index;

  while (columnIndex >= 0) {
    columnName = String.fromCharCode((columnIndex % 26) + 65) + columnName;
    columnIndex = Math.floor(columnIndex / 26) - 1;
  }

  return columnName;
}

function createCell(value: ExcelCell, rowIndex: number, columnIndex: number, styleId?: number): string {
  const cellRef = `${getColumnName(columnIndex)}${rowIndex}`;
  const style = styleId === undefined ? "" : ` s="${styleId}"`;

  if (typeof value === "number") {
    return `<c r="${cellRef}"${style}><v>${value}</v></c>`;
  }

  return `<c r="${cellRef}" t="inlineStr"${style}><is><t>${escapeXml(value)}</t></is></c>`;
}

function createWorksheetXml(rows: ExcelCell[][]): string {
  const sheetRows = rows
    .map((row, rowIndex) => {
      const excelRowIndex = rowIndex + 1;
      const cells = row
        .map((cell, columnIndex) => createCell(cell, excelRowIndex, columnIndex, rowIndex === 0 ? 1 : undefined))
        .join("");
      return `<row r="${excelRowIndex}">${cells}</row>`;
    })
    .join("");
  const lastColumn = getColumnName(rows[0].length - 1);
  const lastRow = rows.length;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>
    <col min="1" max="1" width="22" customWidth="1"/>
    <col min="2" max="2" width="18" customWidth="1"/>
    <col min="3" max="7" width="13" customWidth="1"/>
  </cols>
  <sheetData>${sheetRows}</sheetData>
  <autoFilter ref="A1:${lastColumn}${lastRow}"/>
</worksheet>`;
}

const crcTable = Array.from({ length: 256 }, (_, tableIndex) => {
  let value = tableIndex;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function calculateCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
}

function writeUint32(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const bytes = new Uint8Array(totalLength);
  let offset = 0;

  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }

  return bytes;
}

function createStoredZip(files: Array<{ name: string; content: string }>): Uint8Array {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const contentBytes = encoder.encode(file.content);
    const crc = calculateCrc32(contentBytes);
    const localHeader = new Uint8Array(30 + nameBytes.length);

    writeUint32(localHeader, 0, 0x04034b50);
    writeUint16(localHeader, 4, 20);
    writeUint16(localHeader, 8, 0);
    writeUint32(localHeader, 14, crc);
    writeUint32(localHeader, 18, contentBytes.length);
    writeUint32(localHeader, 22, contentBytes.length);
    writeUint16(localHeader, 26, nameBytes.length);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, contentBytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    writeUint32(centralHeader, 0, 0x02014b50);
    writeUint16(centralHeader, 4, 20);
    writeUint16(centralHeader, 6, 20);
    writeUint16(centralHeader, 10, 0);
    writeUint32(centralHeader, 16, crc);
    writeUint32(centralHeader, 20, contentBytes.length);
    writeUint32(centralHeader, 24, contentBytes.length);
    writeUint16(centralHeader, 28, nameBytes.length);
    writeUint32(centralHeader, 42, offset);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + contentBytes.length;
  }

  const centralDirectory = concatBytes(centralParts);
  const endRecord = new Uint8Array(22);
  writeUint32(endRecord, 0, 0x06054b50);
  writeUint16(endRecord, 8, files.length);
  writeUint16(endRecord, 10, files.length);
  writeUint32(endRecord, 12, centralDirectory.length);
  writeUint32(endRecord, 16, offset);

  return concatBytes([...localParts, centralDirectory, endRecord]);
}

function createResultsWorkbook(results: GameResult[]): Uint8Array {
  const headers = ["완료일시", "참여자 사번", "정답 수", "총 문제", "정답률", "소요 시간", "답변 수"];
  const rows = results.map((result) => [
    formatDateTime(result.completedAt),
    result.employeeNumber,
    result.correctAnswers,
    result.totalQuestions,
    `${Math.round(result.accuracy * 100)}%`,
    result.totalTime,
    result.answers?.length ?? result.details?.length ?? 0,
  ]);

  return createStoredZip([
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="게임 현황" sheetId="1" r:id="rId1"/></sheets>
</workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    {
      name: "xl/styles.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0"/></cellXfs>
</styleSheet>`,
    },
    {
      name: "xl/worksheets/sheet1.xml",
      content: createWorksheetXml([headers, ...rows]),
    },
  ]);
}

function downloadResultsExcel(results: GameResult[]) {
  const workbook = createResultsWorkbook(results);
  const workbookBuffer = workbook.buffer.slice(
    workbook.byteOffset,
    workbook.byteOffset + workbook.byteLength,
  ) as ArrayBuffer;
  const blob = new Blob([workbookBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `game-results-${today}.xlsx`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="results-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function AdminResultsPage() {
  const [results, setResults] = useState<GameResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadResults = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const loadedResults = await fetchAdminResults();
      setResults(loadedResults);
    } catch {
      setError("게임 현황을 불러오지 못했습니다. 백엔드 서버 상태를 확인해주세요.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadResults();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadResults]);

  const summary = useMemo(() => {
    const totalGames = results.length;
    const totalCorrect = results.reduce((sum, result) => sum + result.correctAnswers, 0);
    const totalQuestions = results.reduce((sum, result) => sum + result.totalQuestions, 0);
    const totalSeconds = results.reduce((sum, result) => sum + parseDurationSeconds(result.totalTime), 0);
    const latestCompletedAt = results
      .map((result) => result.completedAt)
      .filter(Boolean)
      .sort()
      .at(-1);

    return {
      totalGames,
      averageAccuracy: totalQuestions === 0 ? "0%" : `${Math.round((totalCorrect / totalQuestions) * 100)}%`,
      averageDuration: totalGames === 0 ? "00:00" : formatDuration(totalSeconds / totalGames),
      latestCompletedAt: formatDateTime(latestCompletedAt),
    };
  }, [results]);

  const handleDownload = () => {
    downloadResultsExcel(results);
  };

  return (
    <main className="admin-page admin-results-page">
      <div className="admin-header">
        <div>
          <span className="eyebrow">ADMIN</span>
          <h1>게임 진행 현황</h1>
          <p>참여자별 정답 수와 소요 시간을 확인하세요.</p>
        </div>
        <div className="admin-header-actions">
          <button type="button" className="secondary-admin-button" onClick={loadResults} disabled={isLoading}>
            새로고침
          </button>
          <button type="button" className="primary-admin-button" onClick={handleDownload} disabled={results.length === 0}>
            엑셀 다운로드
          </button>
        </div>
      </div>

      <section className="results-stat-grid" aria-label="게임 현황 요약">
        <StatCard label="완료 게임" value={`${summary.totalGames}건`} />
        <StatCard label="평균 정답률" value={summary.averageAccuracy} />
        <StatCard label="평균 소요 시간" value={summary.averageDuration} />
        <StatCard label="최근 완료" value={summary.latestCompletedAt} />
      </section>

      <section className="admin-results-panel">
        {error && <p className="admin-message is-error">{error}</p>}
        {isLoading ? (
          <p className="empty-area">게임 현황을 불러오는 중입니다.</p>
        ) : results.length === 0 ? (
          <p className="empty-area">아직 완료된 게임이 없습니다.</p>
        ) : (
          <div className="admin-results-table-wrap">
            <table className="admin-results-table">
              <thead>
                <tr>
                  <th>완료일시</th>
                  <th>참여자 사번</th>
                  <th>정답</th>
                  <th>정답률</th>
                  <th>소요 시간</th>
                  <th>답변 수</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.sessionId}>
                    <td>{formatDateTime(result.completedAt)}</td>
                    <td>{result.employeeNumber}</td>
                    <td>
                      <strong>{result.correctAnswers}</strong>
                      <span> / {result.totalQuestions}</span>
                    </td>
                    <td>{Math.round(result.accuracy * 100)}%</td>
                    <td>{result.totalTime}</td>
                    <td>{result.answers?.length ?? result.details?.length ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
