// Run: node tests/image-cache.mjs. Uses headless Chrome and mocked API/CDN responses.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const origin = 'http://127.0.0.1:5179';
const profile = await mkdtemp(join(tmpdir(), 'image-cache-'));
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5179', '--strictPort'], { windowsHide: true, stdio: 'ignore' });
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--remote-debugging-port=9239', `--user-data-dir=${profile}`, '--no-first-run', 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let socket;
let apiFails = false;
let empty = false;
let slow = false;
let requestCount = 0;
const base = 'https://img.flickrlab.com/cdn-cgi/image/width=1900,format=auto/uploads/';
const questions = ['a.png', 'b.png', 'bad.png', 'a.png'].map((name, i) => ({ id: String(i), questionNumber: i + 1, imageUrl: base + name, imageAlt: 'test', active: i === 0, explanation: 'test', timeLimitSeconds: 10, errorAreas: [] }));
async function waitFor(check) {
  for (let n = 0; n < 120; n++) {
    try { if (await check()) return; } catch { /* Wait for startup/render. */ }
    await delay(100);
  }
  throw new Error('Timed out');
}
try {
  await waitFor(async () => (await fetch(origin)).ok);
  let target;
  await waitFor(async () => {
    target = (await (await fetch('http://127.0.0.1:9239/json')).json()).find(t => t.type === 'page');
    return target;
  });
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
  let id = 0;
  const pending = new Map();
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      pending.set(++id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  socket.addEventListener('message', async event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const item = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) item.reject(new Error(message.error.message));
      else item.resolve(message.result);
    } else if (message.method === 'Fetch.requestPaused') {
      const { requestId, request } = message.params;
      const api = request.url.includes('/api/');
      if (!api) requestCount++;
      await delay(api ? 30 : slow ? 2000 : 150);
      const failed = api ? apiFails : request.url.includes('bad.png');
      const body = api ? JSON.stringify(empty ? [] : questions) : failed ? 'missing' : '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180"><rect width="300" height="180" fill="#d1e9ff"/></svg>';
      try {
        await send('Fetch.fulfillRequest', { requestId, responseCode: failed ? 500 : 200,
          responseHeaders: [{ name: 'Content-Type', value: api ? 'application/json' : failed ? 'text/plain' : 'image/svg+xml' }, ...(api ? [{ name: 'Access-Control-Allow-Origin', value: '*' }] : []), { name: 'Cache-Control', value: 'public, max-age=3600' }],
          body: Buffer.from(body).toString('base64') });
      } catch { /* An aborted request can disappear before fulfillment. */ }
    }
  });
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  await send('Page.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: 'http://localhost:3000/api/*' }, { urlPattern: '*://img.flickrlab.com/*' }] });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.warmRequests = [];
    const originalFetch = window.fetch;
    window.fetch = (url, options) => {
      if (options?.cache === 'reload') window.warmRequests.push(String(url));
      return originalFetch(url, options);
    };
  ` });
  await send('Emulation.setDeviceMetricsOverride', { width: 1100, height: 850, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: origin + '/admin' });
  try {
    await waitFor(() => evaluate('document.querySelectorAll(".saved-question-item").length === 4'));
  } catch (error) {
    console.log(await evaluate('document.body.innerText'));
    throw error;
  }
  await evaluate('document.querySelectorAll(".admin-tabs button")[1].click()');
  await waitFor(() => evaluate('!!document.querySelector(".cache-start-button")'));
  const start = () => evaluate('document.querySelector(".cache-start-button").click()');
  const close = () => evaluate('document.querySelector(".image-cache-modal > button").click()');
  const done = () => waitFor(() => evaluate('document.querySelector("#cache-title")?.textContent === "캐시 준비 완료"'));
  slow = true;
  await start();
  await waitFor(() => evaluate('document.querySelector(".image-cache-modal")?.open'));
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  assert.equal(await evaluate('document.querySelector(".image-cache-modal").open'), true);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 5, y: 5, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 5, y: 5, button: 'left', clickCount: 1 });
  assert.equal(await evaluate('document.querySelector(".image-cache-modal").open'), true);
  await waitFor(() => evaluate('window.warmRequests.length === 3'));
  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(join(profile, 'running.png'), Buffer.from(screenshot.data, 'base64'));
  await close(); // Stop, not dismiss.
  assert.equal(await evaluate('document.querySelector("#cache-title").textContent'), '캐시 준비 중단');
  await delay(2200);
  assert.equal(await evaluate('window.warmRequests.length'), 3, 'Stop prevents queued requests');
  assert.match(await evaluate('document.querySelector(".cache-counts").textContent'), /성공 0실패 0/);
  await close();
  slow = false;
  await evaluate('window.warmRequests = []');
  await start();
  await done();
  assert.equal(await evaluate('window.warmRequests.length'), 6, 'Duplicate URLs deduplicated, inactive questions included');
  const urls = await evaluate('window.warmRequests');
  assert.equal(urls.filter(url => url.includes('width=1900,format=auto')).length, 3);
  assert.equal(urls.filter(url => url.includes('width=300,format=webp')).length, 3);
  assert.match(await evaluate('document.querySelector(".cache-counts").textContent'), /성공 4실패 2/);
  assert.match(await evaluate('document.querySelector(".cache-progress-label").textContent'), /6 \/ 6 요청100%/);
  await close();
  const previousRequests = requestCount;
  await start();
  await done();
  assert.ok(requestCount >= previousRequests + 6, 'Rerun contacts CDN again');
  await close();
  apiFails = true;
  await start();
  await waitFor(() => evaluate('document.querySelector("#cache-title")?.textContent === "목록 조회 실패"'));
  await close();
  apiFails = false;
  empty = true;
  await start();
  await done();
  assert.match(await evaluate('document.querySelector("#cache-description").textContent'), /이미지가 없습니다/);
  await close();
  assert.equal(await evaluate('document.body.style.overflow'), '');
  console.log('PASS: both variants, deduplication, inactive questions, partial failures, progress, cancellation, ESC/backdrop, rerun, API failure, empty list.');
  console.log('Screenshot:', join(profile, 'running.png'));
} finally {
  socket?.close();
  chrome.kill();
  vite.kill();
}
