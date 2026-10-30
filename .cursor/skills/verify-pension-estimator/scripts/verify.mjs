import { spawn } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(skillRoot, "../../..");
const runDir = path.join(skillRoot, "run");
const statePath = path.join(runDir, "state.json");
const evidenceRoot = path.join(skillRoot, "evidence");
const chromeBin = "/usr/bin/google-chrome";

const command = process.argv[2];
const feature = process.argv[3];

function fail(message) {
  console.error(message);
  process.exit(1);
}

async function readState() {
  try {
    return JSON.parse(await readFile(statePath, "utf8"));
  } catch (error) {
    if (error && error.code === "ENOENT") return null;
    throw error;
  }
}

function alive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function killPid(pid) {
  if (!alive(pid)) return;
  process.kill(pid, "SIGTERM");
}

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") fail("Could not reserve a local port.");
  const { port } = address;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

function waitForText(child, pattern, timeoutMs) {
  return new Promise((resolve, reject) => {
    let text = "";
    const timer = setTimeout(() => {
      reject(new Error(`Timed out waiting for ${pattern}.\n${text}`));
    }, timeoutMs);
    const onData = (chunk) => {
      text += chunk.toString();
      if (text.includes(pattern)) {
        clearTimeout(timer);
        child.stdout.off("data", onData);
        child.stderr.off("data", onData);
        resolve(text);
      }
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Vite exited ${code} before it was ready.\n${text}`));
    });
  });
}

async function launch() {
  const existing = await readState();
  if (existing && alive(existing.vitePid)) {
    fail(`A verification server is already running at ${existing.url}. Run cleanup before launch.`);
  }
  await mkdir(runDir, { recursive: true });
  const port = await freePort();
  const child = spawn(
    process.execPath,
    [path.join(repoRoot, "node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
    { cwd: repoRoot, stdio: ["ignore", "pipe", "pipe"] },
  );
  const ready = await waitForText(child, `http://127.0.0.1:${port}/`, 20000);
  const state = {
    vitePid: child.pid,
    port,
    url: `http://127.0.0.1:${port}/`,
    chromePid: null,
    userDataDir: null,
    log: ready,
  };
  await writeFile(statePath, JSON.stringify(state, null, 2));
  child.stdout.resume();
  child.stderr.resume();
  child.stdout.unref();
  child.stderr.unref();
  child.unref();
  console.log(state.url);
}

async function doctor() {
  const state = await readState();
  if (!state) fail("No verification server is recorded. Run launch first.");
  if (!alive(state.vitePid)) fail(`Recorded Vite pid ${state.vitePid} is not running.`);
  const response = await fetch(state.url);
  const body = await response.text();
  if (response.status !== 200) fail(`GET ${state.url} returned ${response.status}.`);
  if (!body.includes("职工基本养老金估算")) fail("The page title text is missing.");
  if (!body.includes("/src/main.ts")) fail("The page is not the Vite dev entry.");
  console.log(JSON.stringify({ url: state.url, vitePid: state.vitePid, status: response.status, title: "职工基本养老金估算" }));
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  const pending = new Map();
  let nextId = 0;
  const opened = new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", () => reject(new Error(`Chrome DevTools socket failed: ${wsUrl}`)));
  });
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const waiter = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) waiter.reject(new Error(JSON.stringify(message.error)));
    else waiter.resolve(message.result);
  });
  return {
    ready: opened,
    send(method, params = {}, sessionId) {
      const id = ++nextId;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        const payload = { id, method, params };
        if (sessionId) payload.sessionId = sessionId;
        ws.send(JSON.stringify(payload));
      });
    },
    close() {
      ws.close();
    },
  };
}

async function startChrome(state) {
  const userDataDir = path.join(runDir, `chrome-${Date.now()}`);
  await mkdir(userDataDir, { recursive: true });
  const child = spawn(
    chromeBin,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--no-first-run",
      "--no-default-browser-check",
      `--user-data-dir=${userDataDir}`,
      "--remote-debugging-port=0",
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  state.chromePid = child.pid;
  state.userDataDir = userDataDir;
  await writeFile(statePath, JSON.stringify(state, null, 2));
  const portFile = path.join(userDataDir, "DevToolsActivePort");
  let debugPort = "";
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      debugPort = (await readFile(portFile, "utf8")).split("\n")[0];
      if (debugPort) break;
    } catch {
      // Chrome creates the port file after startup.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!debugPort) fail("Chrome did not write DevToolsActivePort.");
  const version = await fetch(`http://127.0.0.1:${debugPort}/json/version`).then((response) => response.json());
  const browser = connect(version.webSocketDebuggerUrl);
  await browser.ready;
  const { targetId } = await browser.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await browser.send("Target.attachToTarget", { targetId, flatten: true });
  await browser.send("Page.enable", {}, sessionId);
  await browser.send("Runtime.enable", {}, sessionId);
  await browser.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
  return {
    browser,
    sessionId,
    async stop() {
      browser.close();
      killPid(child.pid);
      state.chromePid = null;
      await writeFile(statePath, JSON.stringify(state, null, 2));
    },
  };
}

async function openApp(page, url) {
  await page.browser.send("Page.navigate", { url }, page.sessionId);
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const value = await evalJson(page, "document.readyState === 'complete' && !!document.querySelector('#cityId')");
    if (value === true) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  fail("The estimator did not render #cityId.");
}

async function evalJson(page, expression) {
  const result = await page.browser.send(
    "Runtime.evaluate",
    { expression: `JSON.stringify(${expression})`, returnByValue: true },
    page.sessionId,
  );
  if (result.exceptionDetails) fail(JSON.stringify(result.exceptionDetails));
  return JSON.parse(result.result.value);
}

async function box(page, selector) {
  const found = await evalJson(
    page,
    `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    })()`,
  );
  if (!found) fail(`No element matches ${selector}.`);
  return found;
}

async function click(page, selector) {
  const point = await box(page, selector);
  await page.browser.send("Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button: "left", clickCount: 1 }, page.sessionId);
  await page.browser.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x, y: point.y, button: "left", clickCount: 1 }, page.sessionId);
}

async function insertText(page, text) {
  await page.browser.send("Input.insertText", { text }, page.sessionId);
}

async function screenshot(page, file) {
  const shot = await page.browser.send("Page.captureScreenshot", { format: "png" }, page.sessionId);
  await writeFile(file, Buffer.from(shot.data, "base64"));
}

async function saveText(file, value) {
  await writeFile(file, value.endsWith("\n") ? value : `${value}\n`);
}

function evidenceDir(name) {
  return path.join(evidenceRoot, name);
}

async function readEstimate(page) {
  return evalJson(
    page,
    `(() => {
      const lead = document.querySelector(".lead");
      const pause = document.querySelector(".pause");
      const city = document.querySelector("#cityId");
      const account = document.getElementById("个人账户余额");
      const reference = document.getElementById("缴费指数基准");
      const base = document.getElementById("养老金计发基数");
      const note = [...document.querySelectorAll("p.hint")].find((item) => item.textContent.startsWith("1 表示"));
      const details = [...document.querySelectorAll("details")].find((item) => item.querySelector("summary")?.textContent === "利率和已缴费指数");
      return {
        lead: lead ? lead.textContent.trim() : null,
        pause: pause ? pause.textContent.trim() : null,
        pauseRole: pause ? pause.getAttribute("role") : null,
        city: city ? city.value : null,
        descendant: city ? city.getAttribute("aria-activedescendant") : null,
        account: account ? account.value : null,
        reference: reference ? reference.value : null,
        pensionBase: base ? base.value : null,
        pastIndexNote: note ? note.textContent.trim() : null,
        pastIndexInsideFold: !!(note && details && details.contains(note)),
        assumptionsOpen: details ? details.open : null,
        policyCount: document.querySelectorAll(".policies a").length,
        policyHref: document.querySelector('a[href="https://si.12333.gov.cn/"]') ? "https://si.12333.gov.cn/" : null
      };
    })()`,
  );
}

async function driveLive(page, dir) {
  const state = await readEstimate(page);
  if (!state.lead || !state.lead.includes("元")) fail(`Expected a monthly amount, saw ${JSON.stringify(state.lead)}.`);
  await saveText(path.join(dir, "estimate.txt"), JSON.stringify(state, null, 2));
  await screenshot(page, path.join(dir, "estimate.png"));
  console.log(JSON.stringify({ feature: "live-estimate", lead: state.lead, city: state.city }));
}

async function driveCity(page, dir) {
  const before = await readEstimate(page);
  await saveText(path.join(dir, "before.txt"), JSON.stringify(before, null, 2));
  await click(page, "#cityId");
  await new Promise((resolve) => setTimeout(resolve, 150));
  await insertText(page, "深");
  let options = [];
  for (let attempt = 0; attempt < 20; attempt += 1) {
    options = await evalJson(
      page,
      `[...document.querySelectorAll("#city-list [role=option]")].map((item) => ({ id: item.id, name: item.textContent.trim(), selected: item.getAttribute("aria-selected") }))`,
    );
    if (options.length === 1 && options[0].name === "深圳") break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  if (options.length !== 1 || options[0].name !== "深圳") fail(`City query 深 did not leave only 深圳. Saw ${JSON.stringify(options)}.`);
  await saveText(path.join(dir, "matches.txt"), JSON.stringify(options, null, 2));
  await click(page, "#city-option-shenzhen");
  const after = await readEstimate(page);
  await saveText(path.join(dir, "after.txt"), JSON.stringify(after, null, 2));
  await screenshot(page, path.join(dir, "after.png"));
  if (after.city !== "深圳") fail(`City input is ${after.city}, expected 深圳.`);
  if (after.account !== "80000") fail(`Account balance changed to ${after.account}.`);
  if (after.reference !== "9201") fail(`缴费指数基准 is ${after.reference}, expected 9201.`);
  if (after.pensionBase !== "11293") fail(`养老金计发基数 is ${after.pensionBase}, expected 11293.`);
  if (after.lead === before.lead) fail("Monthly amount did not change after switching to 深圳.");
  console.log(JSON.stringify({ feature: "city-search", before: before.lead, after: after.lead, account: after.account }));
}

async function drivePastIndex(page, dir) {
  const state = await readEstimate(page);
  if (state.assumptionsOpen !== false) fail("利率和已缴费指数 was open. The note must be visible while it is closed.");
  if (state.pastIndexInsideFold) fail("The past-index note is inside the closed fold.");
  if (state.pastIndexNote !== "1 表示以前按当地平均缴费基数缴。高于 1 是高于平均，低于 1 是低于平均。要改，打开下面的利率和已缴费指数。") {
    fail(`Unexpected past-index note: ${state.pastIndexNote}`);
  }
  await saveText(path.join(dir, "note.txt"), JSON.stringify(state, null, 2));
  await screenshot(page, path.join(dir, "note.png"));
  console.log(JSON.stringify({ feature: "past-index-note", visible: true, assumptionsOpen: false }));
}

async function replaceField(page, selector, text) {
  await click(page, selector);
  await page.browser.send(
    "Input.dispatchKeyEvent",
    { type: "keyDown", modifiers: 2, key: "a", code: "KeyA", windowsVirtualKeyCode: 65 },
    page.sessionId,
  );
  await page.browser.send(
    "Input.dispatchKeyEvent",
    { type: "keyUp", modifiers: 2, key: "a", code: "KeyA", windowsVirtualKeyCode: 65 },
    page.sessionId,
  );
  await insertText(page, text);
  await new Promise((resolve) => setTimeout(resolve, 100));
}

async function driveInvalid(page, dir) {
  const before = await readEstimate(page);
  await replaceField(page, "#个人账户余额", "-1");
  const paused = await readEstimate(page);
  await saveText(path.join(dir, "paused.txt"), JSON.stringify(paused, null, 2));
  await screenshot(page, path.join(dir, "paused.png"));
  if (paused.lead !== null) fail("The monthly amount stayed visible for an invalid balance.");
  if (paused.pauseRole !== "status") fail(`Pause role is ${paused.pauseRole}, expected status.`);
  if (!paused.pause || !paused.pause.includes("结果先停着")) fail(`Pause text was ${paused.pause}.`);
  await replaceField(page, "#个人账户余额", "80000");
  const restored = await readEstimate(page);
  await saveText(path.join(dir, "restored.txt"), JSON.stringify(restored, null, 2));
  if (restored.lead !== before.lead) fail(`Restoring 80000 produced ${restored.lead}, started from ${before.lead}.`);
  console.log(JSON.stringify({ feature: "invalid-input", paused: paused.pause, restored: restored.lead }));
}

async function drivePolicies(page, dir) {
  const links = await evalJson(
    page,
    `[...document.querySelectorAll(".policies a")].map((item) => ({ title: item.querySelector(".policy-title")?.textContent ?? "", href: item.href, target: item.target, rel: item.rel }))`,
  );
  await saveText(path.join(dir, "links.txt"), JSON.stringify(links, null, 2));
  await screenshot(page, path.join(dir, "policies.png"));
  if (links.length !== 6) fail(`Expected 6 policy links, saw ${links.length}.`);
  const official = links.find((item) => item.href === "https://si.12333.gov.cn/");
  if (!official) fail("The national social insurance service link is missing.");
  if (official.target !== "_blank") fail("Policy links do not open in a new window.");
  console.log(JSON.stringify({ feature: "policies", count: links.length, official: official.href }));
}

async function driveMonth(page, dir) {
  await click(page, "#退休年月");
  let before = "";
  for (let attempt = 0; attempt < 20; attempt += 1) {
    before = await evalJson(page, `document.querySelector(".month-year-value")?.value ?? ""`);
    if (before) break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  if (!before) fail("The retirement month panel did not open.");
  const decadeButtons = await evalJson(page, `document.querySelectorAll('[aria-label="上十年"], [aria-label="下十年"]').length`);
  if (decadeButtons !== 0) fail("Decade year buttons are still on the month panel.");
  await replaceField(page, ".month-year-value", "2060");
  const typed = await evalJson(page, `document.querySelector(".month-year-value")?.value ?? ""`);
  await saveText(path.join(dir, "years.txt"), JSON.stringify({ before, typed }, null, 2));
  await screenshot(page, path.join(dir, "typed.png"));
  if (typed !== "2060") fail(`Typing a year left ${typed}.`);
  console.log(JSON.stringify({ feature: "month-jump", before, typed }));
}

const drives = {
  "live-estimate": driveLive,
  "city-search": driveCity,
  "past-index-note": drivePastIndex,
  "invalid-input": driveInvalid,
  policies: drivePolicies,
  "month-jump": driveMonth,
};

async function drive() {
  if (!drives[feature]) fail(`Unknown feature ${feature}. Known features: ${Object.keys(drives).join(", ")}.`);
  const state = await readState();
  if (!state || !alive(state.vitePid)) fail("Verification server is not running. Run launch, then doctor.");
  const dir = evidenceDir(feature);
  await mkdir(dir, { recursive: true });
  const page = await startChrome(state);
  try {
    await openApp(page, state.url);
    await drives[feature](page, dir);
  } finally {
    await page.stop();
  }
}

async function cleanup() {
  const state = await readState();
  if (state) {
    killPid(state.chromePid);
    killPid(state.vitePid);
    if (state.userDataDir) await rm(state.userDataDir, { recursive: true, force: true });
  }
  await rm(runDir, { recursive: true, force: true });
  console.log(`Removed ${runDir}. Evidence remains in ${evidenceRoot}.`);
}

const actions = { launch, doctor, drive, cleanup };
if (!actions[command]) fail("Usage: node .cursor/skills/verify-pension-estimator/scripts/verify.mjs <launch|doctor|drive|cleanup> [feature]");
await actions[command]();
