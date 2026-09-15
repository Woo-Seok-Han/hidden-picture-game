// Run with: node tests/questions-request.mjs
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = await readFile(new URL('../src/api/gameService.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 },
});
const exports = {};
const requests = [];
runInNewContext(outputText, {
  exports,
  require: () => ({
    API_ENDPOINTS: {
      game: { questions: '/api/game/questions' },
      user: { results: employeeNumber => `/api/user/${employeeNumber}/results` },
    },
    resolveApiAssetUrl: url => url,
  }),
  console: { error() {} },
  fetch: url => new Promise(resolve => requests.push({ url, resolve })),
});

const first = exports.fetchQuestions();
const repeated = exports.fetchQuestions();
assert.equal(requests.length, 1, 'Concurrent loads issue one HTTP request');
assert.equal(requests[0].url, '/api/game/questions');
assert.equal(first, repeated, 'Concurrent callers share the pending result');
requests[0].resolve({ ok: true, json: async () => [] });
assert.equal((await first).length, 0);
await repeated;

const nextGame = exports.fetchQuestions();
assert.equal(requests.length, 2, 'A later game fetches fresh questions');
requests[1].resolve({ ok: false, status: 503 });
assert.equal((await nextGame).length, 0);

const retry = exports.fetchQuestions();
assert.equal(requests.length, 3, 'A failed request does not block retries');
requests[2].resolve({ ok: true, json: async () => [] });
await retry;
console.log('PASS: concurrent question loads, fresh loads, and retry after failure');

const resultA = exports.fetchUserResults('111111');
const resultARepeated = exports.fetchUserResults('111111');
const resultB = exports.fetchUserResults('222222');
assert.equal(resultA, resultARepeated, 'Same employee shares one pending result request');
assert.notEqual(resultA, resultB, 'Different employees have separate requests');
assert.equal(requests.length, 5);
requests[3].resolve({ ok: true, json: async () => ({ employeeNumber: '111111', details: [] }) });
requests[4].resolve({ ok: false, status: 503 });
assert.equal((await resultA).employeeNumber, '111111');
assert.equal(await resultB, null);
const refreshed = exports.fetchUserResults('111111');
const retried = exports.fetchUserResults('222222');
assert.equal(requests.length, 7, 'Both completed and failed result requests can be fetched again');
requests[5].resolve({ ok: true, json: async () => ({ employeeNumber: '111111', details: [] }) });
requests[6].resolve({ ok: true, json: async () => ({ employeeNumber: '222222', details: [] }) });
assert.equal((await refreshed).employeeNumber, '111111');
assert.equal((await retried).employeeNumber, '222222');
console.log('PASS: result request deduplication, employee isolation, fresh loads, and retries');
