#!/usr/bin/env node
/**
 * Screenshot the /visualizer page with headless Chrome over the DevTools
 * Protocol (CDP) — no extra npm dependencies required.
 *
 * Useful for verifying the 3D scene renders correctly (e.g. checking the
 * default camera view is unobstructed) since the WebGL canvas only paints
 * after the scene loads, which plain `--screenshot` flags often miss.
 *
 * Prerequisites:
 *   - Chrome/Chromium installed (uses `google-chrome` by default).
 *   - The app already running, e.g. `npm run build && npx next start -p 3200`.
 *
 * Usage:
 *   node scripts/screenshot-visualizer.mjs [options]
 *
 * Options:
 *   --url <url>          Page to capture      (default http://localhost:3200/visualizer)
 *   --out <file>         Screenshot path      (default /tmp/visualizer.png)
 *   --wait <ms>          Wait before capture  (default 15000 — let the scene settle)
 *   --width <px>         Viewport width       (default 1600)
 *   --height <px>        Viewport height      (default 900)
 *   --theme <dark|light> Click the Theme toggle before capture
 *   --cdp-port <port>    CDP debugging port   (default 9223)
 *
 * Example:
 *   node scripts/screenshot-visualizer.mjs --url http://localhost:3000/visualizer \
 *        --out /tmp/vis-light.png --theme light --wait 20000
 */
import { spawn } from "node:child_process";
import fs from "node:fs";

const args = process.argv.slice(2);
const opts = {
  url: "http://localhost:3200/visualizer",
  out: "/tmp/visualizer.png",
  wait: 15000,
  width: 1600,
  height: 900,
  theme: null,
  cdpPort: 9223,
  chromeBin: process.env.CHROME_BIN || "google-chrome",
};
for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace(/^--/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const val = args[i + 1];
  opts[key] = ["wait", "width", "height", "cdpPort"].includes(key) ? Number(val) : val;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Launch headless Chrome with software WebGL (SwiftShader) so this works on
// machines without a GPU, e.g. CI runners.
const chrome = spawn(opts.chromeBin, [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
  `--window-size=${opts.width},${opts.height}`,
  `--remote-debugging-port=${opts.cdpPort}`,
  "about:blank",
], { stdio: "ignore" });

try {
  // Wait for the CDP endpoint
  let wsUrl = null;
  for (let i = 0; i < 30 && !wsUrl; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${opts.cdpPort}/json/version`);
      wsUrl = (await res.json()).webSocketDebuggerUrl;
    } catch {
      await sleep(500);
    }
  }
  if (!wsUrl) throw new Error("Chrome DevTools endpoint never came up");

  const ws = new WebSocket(wsUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
    }
  };
  const send = (method, params = {}, sessionId) =>
    new Promise((res) => {
      pending.set(++id, res);
      ws.send(JSON.stringify({ id, method, params, sessionId }));
    });

  const { result: { targetId } } = await send("Target.createTarget", { url: "about:blank" });
  const { result: { sessionId } } = await send("Target.attachToTarget", { targetId, flatten: true });
  await send("Page.enable", {}, sessionId);
  await send("Emulation.setDeviceMetricsOverride", {
    width: opts.width, height: opts.height, deviceScaleFactor: 1, mobile: false,
  }, sessionId);
  await send("Page.navigate", { url: opts.url }, sessionId);

  await sleep(opts.wait);

  if (opts.theme === "light") {
    await send("Runtime.evaluate", {
      expression: `[...document.querySelectorAll('button')].find(b => b.textContent.includes('Theme'))?.click()`,
    }, sessionId);
    await sleep(2500); // let the theme transition + IBL re-capture finish
  }

  const shot = await send("Page.captureScreenshot", { format: "png" }, sessionId);
  fs.writeFileSync(opts.out, Buffer.from(shot.result.data, "base64"));
  console.log(`Screenshot written to ${opts.out}`);
  ws.close();
} finally {
  chrome.kill("SIGKILL");
}
