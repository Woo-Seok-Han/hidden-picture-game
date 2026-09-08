// Run with: node tests/game-screen.mjs (Chrome must be installed).
// APIs are mocked: this verifies the real UI and submitted coordinates, not server grading.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const origin = 'http://127.0.0.1:5178';
const profile = await mkdtemp(join(tmpdir(), 'game-screen-'));
const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5178', '--strictPort'], { windowsHide: true, stdio: 'ignore' });
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=9238', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let socket;
try {
  async function waitFor(check) {
    for (let attempt = 0; attempt < 100; attempt++) {
      try { if (await check()) return; } catch { /* Wait for startup/render. */ }
      await delay(100);
    }
    throw new Error('Timed out waiting for browser or UI');
  }
  await waitFor(async () => (await fetch(origin)).ok);
  let target;
  await waitFor(async () => {
    target = (await (await fetch('http://127.0.0.1:9238/json')).json()).find(item => item.type === 'page');
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
      const request = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
    } else if (message.method === 'Fetch.requestPaused') {
      const url = new URL(message.params.request.url);
      const [width, height] = url.searchParams.get('size').split('x');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#cbd5e1"/><rect x="60%" y="20%" width="20%" height="30%" fill="#ef4444"/></svg>`;
      await send('Fetch.fulfillRequest', { requestId: message.params.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'image/svg+xml' }], body: Buffer.from(svg).toString('base64') });
    }
  });
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  await send('Page.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*test-image*' }] });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    const originalFetch = window.fetch;
    const size = new URL(location.href).searchParams.get('size');
    window.fetch = async (url, options) => {
      if (!String(url).includes('/api/')) return originalFetch(url, options);
      const question = { id: 'q1', questionNumber: 1, imageUrl: '${origin}/test-image?size=' + size, imageAlt: 'test', timeLimitSeconds: 120 };
      let data;
      if (String(url).endsWith('/start')) data = { sessionId: 'test', employeeNumber: 'test', startTime: new Date().toISOString() };
      else if (String(url).endsWith('/questions')) data = [question, { ...question, id: 'q2', questionNumber: 2 }];
      else if (String(url).endsWith('/submit')) {
        window.submission = JSON.parse(options.body);
        data = { sessionId: 'test', employeeNumber: 'test', correctAnswers: 1, totalQuestions: 2, accuracy: 0.5, totalTime: '00:01' };
      } else throw new Error('Unexpected API: ' + url);
      return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };
  ` });
  const scenarios = [
    [1440, 900, 4000, 3000],
    [1024, 768, 3000, 4000],
    [390, 844, 4000, 1000],
    [844, 390, 1000, 4000],
    [320, 568, 160, 90],
  ];
  for (const [width, height, imageWidth, imageHeight] of scenarios) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: origin + '?size=' + imageWidth + 'x' + imageHeight });
    await waitFor(() => evaluate('Boolean(document.querySelector("#employee-number"))'));
    await evaluate(`
      const input = document.querySelector('#employee-number');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'test');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    `);
    await evaluate('document.querySelector(".entry-card button").click()');
    await waitFor(() => evaluate('Boolean(document.querySelector(".has-image:not(:disabled)"))'));
    const readLayout = () => evaluate(`(() => {
      const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
      return { button: rect('.has-image'), image: rect('.has-image img'), stage: rect('.question-image-stage'), footer: rect('.game-action-bar'), scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight };
    })()`);
    let layout = await readLayout();
    const checkLayout = (value, viewportWidth, viewportHeight) => {
      assert.ok(Math.abs(value.image.width / value.image.height - imageWidth / imageHeight) < 0.01, 'Image preserves aspect ratio');
      assert.deepEqual(value.button, value.image, 'Click target matches visible image');
      assert.ok(value.image.width <= value.stage.width + 1 && value.image.height <= value.stage.height + 1, 'Entire image fits');
      assert.ok(value.footer.y + value.footer.height <= viewportHeight + 1, 'Footer fits viewport');
      assert.ok(value.scrollWidth <= viewportWidth && value.scrollHeight <= viewportHeight, 'No page scrolling');
    };
    checkLayout(layout, width, height);
    const blankX = layout.button.x > 1 ? 1 : width / 2;
    const blankY = layout.button.x > 1 ? layout.stage.y + layout.stage.height / 2 : layout.stage.y + 1;
    if (layout.button.x > 1 || layout.button.y > layout.stage.y + 1) {
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: blankX, y: blankY, button: 'left', clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: blankX, y: blankY, button: 'left', clickCount: 1 });
      await delay(300);
      assert.match(await evaluate('document.querySelector(".game-progress").textContent'), /1 \/ 2/, 'Letterbox click is ignored');
    }
    // Resize the active question before tapping its known answer region.
    await send('Emulation.setDeviceMetricsOverride', { width: height, height: width, deviceScaleFactor: 1, mobile: false });
    await delay(100);
    layout = await readLayout();
    checkLayout(layout, height, width);
    const x = layout.button.x + layout.button.width * 0.7;
    const y = layout.button.y + layout.button.height * 0.35;
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const marker = await evaluate(`(() => { const r = document.querySelector('.selected-point')?.getBoundingClientRect(); return r ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null; })()`);
    assert.ok(marker && Math.abs(marker.x - x) < 1 && Math.abs(marker.y - y) < 1, 'Marker follows tap');
    await waitFor(() => evaluate('document.querySelector(".game-progress")?.textContent.includes("2 / 2") && !document.querySelector(".has-image").disabled'));
    // Same image URL on the next question must still become clickable.
    await evaluate('document.querySelector(".no-error-button").click()');
    await waitFor(() => evaluate('Boolean(window.submission)'));
    const { answers } = await evaluate('window.submission');
    assert.equal(answers.length, 2);
    assert.equal(answers[0].hasError, true);
    // Browser touch-generated clicks round client coordinates to CSS pixels.
    assert.ok(Math.abs(answers[0].selectedPoint.x - 0.7) <= 1 / layout.button.width);
    assert.ok(Math.abs(answers[0].selectedPoint.y - 0.35) <= 1 / layout.button.height);
    assert.ok(answers[0].selectedPoint.x >= 0.6 && answers[0].selectedPoint.x <= 0.8);
    assert.ok(answers[0].selectedPoint.y >= 0.2 && answers[0].selectedPoint.y <= 0.5);
    assert.equal(answers[1].hasError, false);
    assert.equal(answers[1].selectedPoint, undefined);
    console.log('PASS', { width, height, imageWidth, imageHeight });
  }
} finally {
  socket?.close();
  chrome.kill();
  vite.kill();
}
