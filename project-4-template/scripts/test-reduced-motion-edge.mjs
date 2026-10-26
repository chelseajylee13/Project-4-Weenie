import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, normalize, resolve, sep } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".wav", "audio/wav"],
  [".mp3", "audio/mpeg"],
]);

const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, "http://127.0.0.1").pathname;
    const relativePath = pathname === "/" ? "index.html" : decodeURIComponent(pathname.slice(1));
    const filePath = normalize(resolve(projectRoot, relativePath));
    if (filePath !== projectRoot && !filePath.startsWith(`${projectRoot}${sep}`)) {
      response.writeHead(403).end();
      return;
    }
    const body = await readFile(filePath);
    response.writeHead(200, { "Content-Type": mimeTypes.get(extname(filePath)) ?? "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404).end();
  }
});

await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
const appPort = server.address().port;
const debugPort = 9327;
const profilePath = await mkdtemp(join(tmpdir(), "project-4-edge-"));
const edge = spawn(edgePath, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${profilePath}`,
  "about:blank",
], { stdio: "ignore", windowsHide: true });

const delay = (milliseconds) => new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));

async function findDebugTarget() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const targets = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then((response) => response.json());
      const target = targets.find((candidate) => candidate.type === "page");
      if (target) return target;
    } catch {}
    await delay(100);
  }
  throw new Error("Edge remote-debugging target did not become available.");
}

const target = await findDebugTarget();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolveOpen, rejectOpen) => {
  socket.addEventListener("open", resolveOpen, { once: true });
  socket.addEventListener("error", rejectOpen, { once: true });
});

let nextId = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolveCommand, rejectCommand } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) rejectCommand(new Error(message.error.message));
  else resolveCommand(message.result);
});

function command(method, params = {}) {
  const id = ++nextId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolveCommand, rejectCommand) => {
    pending.set(id, { resolveCommand, rejectCommand });
  });
}

async function evaluate(expression) {
  const result = await command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function clickSelector(selector) {
  const point = await evaluate(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    const box = element.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const receiver = document.elementFromPoint(x, y);
    return { x, y, receiverId: receiver?.id ?? "", receiverClass: receiver?.getAttribute?.("class") ?? "" };
  })()`);
  await command("Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button: "left", clickCount: 1 });
  await command("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x, y: point.y, button: "left", clickCount: 1 });
  await delay(120);
  return point;
}

try {
  await command("Page.enable");
  await command("Runtime.enable");
  await command("Emulation.setEmulatedMedia", {
    media: "screen",
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await command("Page.navigate", { url: `http://127.0.0.1:${appPort}/` });
  await delay(700);

  const beforeEnter = await evaluate(`({
    reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
    rootMode: document.documentElement.dataset.reducedMotion,
    inert: document.querySelector("#experience").hasAttribute("inert")
  })`);
  const enterReceiver = await clickSelector("#enter-button");
  const afterEnter = await evaluate(`({
    state: document.body.dataset.state,
    paused: document.body.dataset.paused,
    inert: document.querySelector("#experience").hasAttribute("inert"),
    doorEnabled: document.querySelector("#cottage-door-trigger").dataset.enabled,
    windowEnabled: document.querySelector("#cottage-window-trigger").dataset.enabled,
    doorTabIndex: document.querySelector("#cottage-door-trigger").getAttribute("tabindex")
  })`);
  const doorReceiver = await clickSelector("#cottage-door-trigger .cottage-hit-area");
  const afterDoor = await evaluate(`({
    ready: document.body.dataset.cottageReady,
    doorEnabled: document.querySelector("#cottage-door-trigger").dataset.enabled,
    windowEnabled: document.querySelector("#cottage-window-trigger").dataset.enabled,
    status: document.querySelector("#cottage-interaction-status").textContent
  })`);
  const windowReceiver = await clickSelector("#cottage-window-trigger .cottage-hit-area");
  const afterWindow = await evaluate(`({
    state: document.body.dataset.state,
    activeState: document.body.dataset.activeState,
    busy: document.querySelector("#experience").getAttribute("aria-busy"),
    status: document.querySelector("#playback-status").textContent
  })`);

  console.log(JSON.stringify({ beforeEnter, enterReceiver, afterEnter, doorReceiver, afterDoor, windowReceiver, afterWindow }, null, 2));

  if (!beforeEnter.reduced || beforeEnter.rootMode !== "true") throw new Error("Reduced-motion emulation was not detected.");
  if (afterEnter.state !== "exploring" || afterEnter.paused !== "false" || afterEnter.inert) throw new Error("Experience did not enter exploring state.");
  if (afterEnter.doorEnabled !== "true" || afterEnter.windowEnabled !== "true") throw new Error("Cottage targets were disabled after entry.");
  if (afterDoor.ready !== "true" || afterDoor.windowEnabled !== "true") throw new Error("Door activation did not ready the window.");
  if (afterWindow.activeState !== "story" || afterWindow.busy !== "true") throw new Error("Ready window did not start Story 2.");
} finally {
  socket.close();
  const edgeExited = new Promise((resolveExit) => edge.once("exit", resolveExit));
  edge.kill();
  await Promise.race([edgeExited, delay(2000)]);
  server.close();
  await rm(profilePath, { recursive: true, force: true }).catch(() => {});
}
