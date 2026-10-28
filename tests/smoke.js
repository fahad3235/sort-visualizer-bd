// Headless-Chrome smoke test via raw CDP (no puppeteer dependency).
// Usage: node tests/smoke.js — exits non-zero on any failure or page error.
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 9346;
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html');
let failures = 0;
const pageErrors = [];
function check(name, cond, extra) {
  console.log((cond ? 'ok - ' : 'FAIL - ') + name + (cond ? '' : ' :: ' + (extra || '')));
  if (!cond) failures++;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function poll(fn, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try { if (await fn()) return true; } catch (e) { /* retry */ }
    await wait(200);
  }
  return false;
}

(async () => {
  const chrome = spawn('/opt/meta-chromium/chrome', [
    '--headless=new', '--no-sandbox', '--disable-gpu',
    '--remote-debugging-port=' + PORT, '--user-data-dir=/tmp/sortviz-smoke-' + process.pid,
    'about:blank',
  ], { stdio: 'ignore' });
  let targets = [];
  for (let i = 0; i < 50 && targets.length === 0; i++) {
    await wait(200);
    try {
      targets = JSON.parse(await new Promise((res, rej) => {
        http.get('http://127.0.0.1:' + PORT + '/json/list', (r) => {
          let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(d));
        }).on('error', rej);
      }));
    } catch (e) { /* retry */ }
  }
  if (!targets.length) { console.log('FAIL - chrome did not start'); process.exit(2); }
  const wsUrl = targets[0].webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);
  await new Promise((res) => { ws.onopen = res; });
  let seq = 0; const pending = new Map();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      pageErrors.push(JSON.stringify(msg.params.args));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      pageErrors.push(JSON.stringify(msg.params.exceptionDetails).slice(0, 300));
    }
  };
  const send = (method, params) => new Promise((res) => {
    const id = ++seq; pending.set(id, res); ws.send(JSON.stringify({ id, method, params }));
  });
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result && r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300));
    return r.result ? r.result.result.value : undefined;
  };
  await send('Page.enable', {});
  await send('Runtime.enable', {});
  await send('Page.navigate', { url: FILE });
  await poll(async () => (await ev('document.querySelectorAll(".bar").length')) === 24, 10000);

  check('title contains Sort Visualizer', (await ev('document.title')).includes('Sort Visualizer'));
  check('24 bars render by default', (await ev('document.querySelectorAll(".bar").length')) === 24);
  check('ready status shows', (await ev('document.getElementById("status").textContent')).includes('Ready'));
  check('lang toggle switches title to Bengali', await (async () => {
    await ev('document.getElementById("langBtn").click()');
    await wait(300);
    return (await ev('document.getElementById("appTitle").textContent')).includes('সর্ট');
  })());
  check('lang toggle back to English + Bengali digits off', await (async () => {
    await ev('document.getElementById("langBtn").click()');
    await wait(300);
    return (await ev('document.getElementById("appTitle").textContent')) === 'Sort Visualizer BD';
  })());
  check('size slider to 12 regenerates 12 bars', await (async () => {
    await ev('(()=>{const s=document.getElementById("sizeRange");s.value="12";s.dispatchEvent(new Event("change",{bubbles:true}));})()');
    await wait(400);
    return (await ev('document.querySelectorAll(".bar").length')) === 12;
  })());
  check('skip to end sorts the array', await (async () => {
    await ev('document.getElementById("skipBtn").click()');
    await wait(300);
    const status = await ev('document.getElementById("status").textContent');
    const line = await ev('document.getElementById("arrayLine").textContent');
    const nums = line.split(',').map((x) => parseInt(x.trim(), 10));
    const sorted = nums.every((v, i) => i === 0 || nums[i - 1] <= v);
    return status.includes('Sorted') && sorted && nums.length === 12;
  })());
  check('invalid custom array shows inline error', await (async () => {
    await ev('(()=>{const i=document.getElementById("customInput");i.value="5, x, 3";document.getElementById("customBtn").click();})()');
    await wait(300);
    const hidden = await ev('document.getElementById("customErr").hidden');
    const txt = await ev('document.getElementById("customErr").textContent');
    return hidden === false && !!txt.trim();
  })());
  check('valid custom array loads 3 bars and sorts', await (async () => {
    await ev('(()=>{const i=document.getElementById("customInput");i.value="5, 2, 9";document.getElementById("customBtn").click();})()');
    await wait(300);
    const bars = await ev('document.querySelectorAll(".bar").length');
    await ev('document.getElementById("skipBtn").click()');
    await wait(300);
    const line = await ev('document.getElementById("arrayLine").textContent');
    return bars === 3 && line.trim() === '2, 5, 9';
  })());
  check('merge sort on custom array sorts too', await (async () => {
    await ev('(()=>{const s=document.getElementById("algoSel");s.value="merge";s.dispatchEvent(new Event("change",{bubbles:true}));})()');
    await wait(300);
    await ev('document.getElementById("skipBtn").click()');
    await wait(300);
    const line = await ev('document.getElementById("arrayLine").textContent');
    const status = await ev('document.getElementById("status").textContent');
    return line.trim() === '2, 5, 9' && status.includes('Sorted');
  })());
  check('390px mobile: no horizontal overflow', await (async () => {
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await send('Page.navigate', { url: FILE });
    await poll(async () => (await ev('document.querySelectorAll(".bar").length')) === 24, 10000);
    return (await ev('document.documentElement.scrollWidth <= window.innerWidth'));
  })());
  check('zero console/page errors', pageErrors.length === 0, pageErrors.join(' | ').slice(0, 500));

  ws.close();
  chrome.kill();
  console.log(failures ? ('\n' + failures + ' smoke checks FAILED') : '\nAll smoke checks passed.');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.log('FAIL - harness error: ' + e.message); process.exit(2); });
