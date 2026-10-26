import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, normalize, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const projectRoot = resolve(import.meta.dirname, "..");
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const viewportWidth = Number(process.env.P4_VIEWPORT_WIDTH ?? 744);
const viewportHeight = Number(process.env.P4_VIEWPORT_HEIGHT ?? 475);
const prefersReducedMotion = process.env.P4_REDUCED_MOTION !== "false";
const runFullLifecycle = process.env.P4_FULL_LIFECYCLE === "true";
const verbose = process.env.P4_VERBOSE === "true";
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
// Use an isolated port so an interrupted earlier diagnostic cannot capture this run.
const debugPort = 12000 + Math.floor(Math.random() * 20000);
const profilePath = await mkdtemp(join(tmpdir(), "project-4-chrome-"));
const chrome = spawn(chromePath, [
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
  throw new Error("Chrome remote-debugging target did not become available.");
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
    const timeout = setTimeout(() => {
      pending.delete(id);
      rejectCommand(new Error(`${method} did not respond within 5 seconds.`));
    }, 5000);
    pending.set(id, {
      resolveCommand: (value) => {
        clearTimeout(timeout);
        resolveCommand(value);
      },
      rejectCommand: (error) => {
        clearTimeout(timeout);
        rejectCommand(error);
      },
    });
  });
}

async function evaluate(expression) {
  const result = await command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function navigate(url) {
  await command("Page.navigate", { url });
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const readyState = await evaluate("document.readyState").catch(() => "loading");
    if (readyState === "complete") break;
    await delay(100);
  }
  await delay(250);
}

async function clickSelector(selector) {
  const point = await evaluate(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    const box = element.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const receiver = document.elementFromPoint(x, y);
    return {
      x,
      y,
      viewport: { width: innerWidth, height: innerHeight },
      targetBox: { left: box.left, top: box.top, right: box.right, bottom: box.bottom },
      targetPointerEvents: getComputedStyle(element).pointerEvents,
      receiverTag: receiver?.tagName ?? "",
      receiverId: receiver?.id ?? "",
      receiverClass: receiver?.getAttribute?.("class") ?? "",
      receiverParentId: receiver?.parentElement?.id ?? "",
      receiverPointerEvents: receiver ? getComputedStyle(receiver).pointerEvents : "",
    };
  })()`);
  await command("Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button: "left", clickCount: 1 });
  await command("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x, y: point.y, button: "left", clickCount: 1 });
  await delay(120);
  return point;
}

async function dragSelectorToSelector(sourceSelector, destinationSelector) {
  const points = await evaluate(`(() => {
    const source = document.querySelector(${JSON.stringify(sourceSelector)}).getBoundingClientRect();
    const destination = document.querySelector(${JSON.stringify(destinationSelector)}).getBoundingClientRect();
    return {
      start: { x: source.left + source.width / 2, y: source.top + source.height / 2 },
      end: { x: destination.left + destination.width / 2, y: destination.top + destination.height / 2 }
    };
  })()`);
  await command("Input.dispatchMouseEvent", { type: "mouseMoved", ...points.start });
  await command("Input.dispatchMouseEvent", { type: "mousePressed", ...points.start, button: "left", buttons: 1, clickCount: 1 });
  for (let step = 1; step <= 10; step += 1) {
    const progress = step / 10;
    await command("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: points.start.x + (points.end.x - points.start.x) * progress,
      y: points.start.y + (points.end.y - points.start.y) * progress,
      button: "left",
      buttons: 1,
    });
    await delay(20);
  }
  await command("Input.dispatchMouseEvent", { type: "mouseReleased", ...points.end, button: "left", buttons: 0, clickCount: 1 });
  await delay(120);
  return points;
}

async function waitForExploring(timeout = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const state = await evaluate(`({
      activeState: document.body.dataset.activeState,
      paused: document.body.dataset.paused,
      busy: document.querySelector("#experience").getAttribute("aria-busy")
    })`);
    if (state.activeState === "exploring" && state.paused === "false" && state.busy !== "true") return state;
    await delay(100);
  }
  throw new Error("Story did not reset to active exploration within 10 seconds.");
}

async function pauseAndResumeStory() {
  await clickSelector("#play-pause-button");
  const paused = await evaluate(`({
    state: document.body.dataset.state,
    activeState: document.body.dataset.activeState,
    paused: document.body.dataset.paused
  })`);
  await delay(250);
  await clickSelector("#play-pause-button");
  const resumed = await evaluate(`({
    state: document.body.dataset.state,
    activeState: document.body.dataset.activeState,
    paused: document.body.dataset.paused
  })`);
  return { paused, resumed };
}

async function commonState() {
  return evaluate(`({
    reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
    rootMode: document.documentElement.dataset.reducedMotion,
    state: document.body.dataset.state,
    activeState: document.body.dataset.activeState,
    paused: document.body.dataset.paused,
    inert: document.querySelector("#experience").hasAttribute("inert"),
    torchEnabled: document.querySelector("#torch-trigger").dataset.enabled,
    doorEnabled: document.querySelector("#cottage-door-trigger").dataset.enabled,
    windowEnabled: document.querySelector("#cottage-window-trigger").dataset.enabled,
    viewport: { width: innerWidth, height: innerHeight },
    visualBoxes: Object.fromEntries(Object.entries({
      scene: ".scene-art",
      torch: ".torch-art",
      cottage: "#cottage-layer",
      doorRing: ".cottage-door-ring",
      lantern: "#lantern-trigger"
    }).map(([name, selector]) => {
      const box = document.querySelector(selector).getBoundingClientRect();
      return [name, { left: box.left, top: box.top, right: box.right, bottom: box.bottom }];
    }))
  })`);
}

async function exercise(url, label) {
  console.error(`${label}: loading`);
  await navigate(url);
  console.error(`${label}: entering`);
  const beforeEnter = await commonState();
  const enterReceiver = await clickSelector("#enter-button");
  const exploring = await commonState();

  console.error(`${label}: testing Story 1 fallback`);
  const torchReceiver = await clickSelector("#torch-trigger .torch-hit-area");
  const afterTorch = await evaluate(`({
    selected: document.querySelector("#torch-trigger").dataset.selected,
    lanternEnabled: document.querySelector("#lantern-trigger").dataset.enabled,
    torchStatus: document.querySelector("#torch-interaction-status").textContent
  })`);
  const lanternReceiver = await clickSelector("#lantern-trigger .lantern-hit-area");
  const storyOne = await evaluate(`({
    state: document.body.dataset.state,
    activeState: document.body.dataset.activeState,
    busy: document.querySelector("#experience").getAttribute("aria-busy"),
    status: document.querySelector("#playback-status").textContent
  })`);

  let lifecycle = null;
  if (runFullLifecycle && label === "HTTP") {
    console.error(`${label}: testing Story 1 pause, reset, drag/drop, and replay`);
    const storyOnePauseResume = await pauseAndResumeStory();
    const storyOneReset = await waitForExploring();
    const storyOneDrag = await dragSelectorToSelector("#torch-trigger .torch-hit-area", "#lantern-trigger .lantern-hit-area");
    const storyOneDragState = await evaluate(`({
      activeState: document.body.dataset.activeState,
      busy: document.querySelector("#experience").getAttribute("aria-busy"),
      status: document.querySelector("#playback-status").textContent
    })`);
    const storyOneReplayReset = await waitForExploring();
    lifecycle = { storyOnePauseResume, storyOneReset, storyOneDrag, storyOneDragState, storyOneReplayReset };
  }

  console.error(`${label}: reloading for Story 2`);
  await navigate(url);
  await clickSelector("#enter-button");
  console.error(`${label}: testing Story 2 cottage path`);
  const doorReceiver = await clickSelector("#cottage-door-trigger .cottage-hit-area");
  const afterDoor = await evaluate(`({
    ready: document.body.dataset.cottageReady,
    doorEnabled: document.querySelector("#cottage-door-trigger").dataset.enabled,
    windowEnabled: document.querySelector("#cottage-window-trigger").dataset.enabled,
    cottageStatus: document.querySelector("#cottage-interaction-status").textContent
  })`);
  const windowReceiver = await clickSelector("#cottage-window-trigger .cottage-hit-area");
  const storyTwo = await evaluate(`({
    state: document.body.dataset.state,
    activeState: document.body.dataset.activeState,
    busy: document.querySelector("#experience").getAttribute("aria-busy"),
    status: document.querySelector("#playback-status").textContent,
    media: [...document.querySelectorAll("audio")].map((audio) => ({
      id: audio.id,
      networkState: audio.networkState,
      errorCode: audio.error?.code ?? null
    }))
  })`);

  if (runFullLifecycle && label === "HTTP") {
    console.error(`${label}: testing Story 2 pause, reset, and replay`);
    const storyTwoPauseResume = await pauseAndResumeStory();
    const storyTwoReset = await waitForExploring();
    await clickSelector("#cottage-door-trigger .cottage-hit-area");
    await clickSelector("#cottage-window-trigger .cottage-hit-area");
    const storyTwoReplayState = await evaluate(`({
      activeState: document.body.dataset.activeState,
      busy: document.querySelector("#experience").getAttribute("aria-busy"),
      status: document.querySelector("#playback-status").textContent
    })`);
    const storyTwoReplayReset = await waitForExploring();
    Object.assign(lifecycle, { storyTwoPauseResume, storyTwoReset, storyTwoReplayState, storyTwoReplayReset });
  }

  let storyThree = null;
  if (label === "HTTP") {
    console.error(`${label}: testing Story 3 completion gate and bell-rope path`);
    await navigate(url);
    await clickSelector("#enter-button");
    const testButtonState = await evaluate(`({
      visible: getComputedStyle(document.querySelector("#test-story-three-button")).display !== "none",
      disabled: document.querySelector("#test-story-three-button").disabled
    })`);
    const initiallyLocked = await evaluate(`({
      unlocked: document.body.dataset.storyThreeUnlocked,
      enabled: document.querySelector("#bell-rope-trigger").dataset.enabled,
      hidden: document.querySelector("#bell-rope-trigger").getAttribute("aria-hidden"),
      tabIndex: document.querySelector("#bell-rope-trigger").getAttribute("tabindex"),
      visible: getComputedStyle(document.querySelector("#bell-rope-trigger")).visibility,
      hintTexts: [...document.querySelectorAll("#scene-hint")].map((node) => node.textContent)
    })`);
    let afterStoryOne = null;
    let afterUnlock = null;
    let bellReceiver = null;
    if (runFullLifecycle) {
      await clickSelector("#torch-trigger .torch-hit-area");
      await clickSelector("#lantern-trigger .lantern-hit-area");
      await waitForExploring();
      afterStoryOne = await evaluate(`({
        unlocked: document.body.dataset.storyThreeUnlocked,
        enabled: document.querySelector("#bell-rope-trigger").dataset.enabled,
        hidden: document.querySelector("#bell-rope-trigger").getAttribute("aria-hidden")
      })`);
      await clickSelector("#cottage-door-trigger .cottage-hit-area");
      await clickSelector("#cottage-window-trigger .cottage-hit-area");
      await waitForExploring();
      afterUnlock = await evaluate(`({
        unlocked: document.body.dataset.storyThreeUnlocked,
        enabled: document.querySelector("#bell-rope-trigger").dataset.enabled,
        hidden: document.querySelector("#bell-rope-trigger").getAttribute("aria-hidden"),
        tabIndex: document.querySelector("#bell-rope-trigger").getAttribute("tabindex"),
        status: document.querySelector("#story-three-interaction-status").textContent
      })`);
      bellReceiver = await clickSelector("#bell-rope-trigger .bell-rope-hit-area");
    }
    const started = await evaluate(`({
      activeState: document.body.dataset.activeState,
      busy: document.querySelector("#experience").getAttribute("aria-busy"),
      status: document.querySelector("#playback-status").textContent
    })`);
    storyThree = { testButtonState, initiallyLocked, afterStoryOne, afterUnlock, bellReceiver, started };
    if (runFullLifecycle) {
      const pauseResume = await pauseAndResumeStory();
      await delay(5600);
      const carnivalSample = await evaluate(`(() => {
        const carnival = document.querySelector(".story-three-carnival");
        const box = carnival.getBoundingClientRect();
        return {
          opacity: Number(getComputedStyle(carnival).opacity),
          box: { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height }
        };
      })()`);
      await delay(2200);
      const invitationSample = await evaluate(`(() => {
        const invitation = document.querySelector(".story-three-invitation");
        const text = document.querySelector(".story-three-invitation-text");
        const box = invitation.getBoundingClientRect();
        return {
          opacity: Number(getComputedStyle(invitation).opacity),
          text: text.textContent.replace(/\\s+/g, " ").trim(),
          box: { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height },
          fontSize: getComputedStyle(text).fontSize
        };
      })()`);
      const reset = await waitForExploring();
      await clickSelector("#bell-rope-trigger .bell-rope-hit-area");
      const replay = await evaluate(`({
        activeState: document.body.dataset.activeState,
        busy: document.querySelector("#experience").getAttribute("aria-busy"),
        status: document.querySelector("#playback-status").textContent
      })`);
      const replayReset = await waitForExploring();
      Object.assign(storyThree, { pauseResume, carnivalSample, invitationSample, reset, replay, replayReset });
    }
  }

  const result = {
    label,
    url,
    beforeEnter,
    enterReceiver,
    exploring,
    torchReceiver,
    afterTorch,
    lanternReceiver,
    storyOne,
    doorReceiver,
    afterDoor,
    windowReceiver,
    storyTwo,
    storyThree,
    lifecycle,
  };

  if (verbose) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(JSON.stringify({
      label,
      viewport: `${viewportWidth}x${viewportHeight}`,
      motion: prefersReducedMotion ? "reduce" : "no-preference",
      exploring,
      receivers: {
        torch: torchReceiver.receiverClass,
        lantern: lanternReceiver.receiverClass,
        door: doorReceiver.receiverClass,
        window: windowReceiver.receiverClass,
      },
      targetBoxes: {
        torch: torchReceiver.targetBox,
        lantern: lanternReceiver.targetBox,
        door: doorReceiver.targetBox,
        window: windowReceiver.targetBox,
      },
      stories: { one: storyOne.activeState, two: storyTwo.activeState },
      storyThree: storyThree ? storyThree.started.activeState : "localhost only",
      lifecycle: lifecycle ? "passed" : "not requested",
    }));
  }

  return result;
}

function failures(result) {
  const problems = [];
  const { label, beforeEnter, exploring, afterTorch, storyOne, afterDoor, storyTwo } = result;
  if (beforeEnter.reduced !== prefersReducedMotion || beforeEnter.rootMode !== String(prefersReducedMotion)) problems.push(`${label}: requested motion preference was not detected.`);
  if (exploring.state !== "exploring" || exploring.paused !== "false" || exploring.inert) problems.push(`${label}: page did not enter active exploration.`);
  if (exploring.torchEnabled !== "true" || exploring.doorEnabled !== "true" || exploring.windowEnabled !== "true") problems.push(`${label}: exploration targets were disabled.`);
  if (viewportHeight <= 600) {
    for (const [name, box] of Object.entries(exploring.visualBoxes)) {
      if (box.left < -0.5 || box.top < -0.5 || box.right > exploring.viewport.width + 0.5 || box.bottom > exploring.viewport.height + 0.5) {
        problems.push(`${label}: ${name} is clipped in the short viewport.`);
      }
    }
  }
  if (afterTorch.selected !== "true" || afterTorch.lanternEnabled !== "true") problems.push(`${label}: torch fallback did not select the torch.`);
  if (storyOne.activeState !== "story" || storyOne.busy !== "true") problems.push(`${label}: lantern fallback did not start Story 1.`);
  if (afterDoor.ready !== "true" || afterDoor.windowEnabled !== "true") problems.push(`${label}: door did not ready the cottage window.`);
  if (storyTwo.activeState !== "story" || storyTwo.busy !== "true") problems.push(`${label}: ready window did not start Story 2.`);
  if (result.storyThree) {
    if (result.storyThree.testButtonState.visible) problems.push(`${label}: Story 3 development control leaked into normal exploration.`);
    if (result.storyThree.initiallyLocked.unlocked !== "false" || result.storyThree.initiallyLocked.enabled !== "false" || result.storyThree.initiallyLocked.hidden !== "true" || result.storyThree.initiallyLocked.tabIndex !== "-1" || result.storyThree.initiallyLocked.visible !== "hidden") problems.push(`${label}: Story 3 was not fully locked at session start.`);
    if (result.storyThree.afterStoryOne?.unlocked !== "false" || result.storyThree.afterStoryOne?.enabled !== "false" || result.storyThree.afterStoryOne?.hidden !== "true") problems.push(`${label}: Story 1 alone unlocked Story 3.`);
    if (result.storyThree.afterUnlock && (result.storyThree.afterUnlock.unlocked !== "true" || result.storyThree.afterUnlock.enabled !== "true" || result.storyThree.afterUnlock.hidden !== "false" || result.storyThree.afterUnlock.tabIndex !== "0")) problems.push(`${label}: Story 3 did not unlock after both prerequisite completions.`);
    if (result.storyThree.bellReceiver && !result.storyThree.bellReceiver.matches) problems.push(`${label}: Story 3 bell-rope hit target did not receive the pointer input.`);
    if (result.storyThree.afterUnlock && (result.storyThree.started.activeState !== "story" || result.storyThree.started.busy !== "true")) problems.push(`${label}: Story 3 bell-rope path did not start.`);
    if (result.storyThree.pauseResume) {
      if (result.storyThree.pauseResume.paused.paused !== "true" || result.storyThree.pauseResume.resumed.paused !== "false") problems.push(`${label}: Story 3 Pause/Resume failed.`);
      if (result.storyThree.replay.activeState !== "story" || result.storyThree.replay.busy !== "true") problems.push(`${label}: Story 3 replay failed.`);
      if (result.storyThree.invitationSample.opacity < 0.9) problems.push(`${label}: Story 3 invitation was not solid during its hold.`);
      if (result.storyThree.invitationSample.text !== "Welcome to Weenie World") problems.push(`${label}: Story 3 invitation text was missing or incorrect.`);
      if (result.storyThree.invitationSample.box.width < 120 || result.storyThree.invitationSample.box.left < 0 || result.storyThree.invitationSample.box.right > viewportWidth) problems.push(`${label}: Story 3 invitation was not readable within the portrait viewport.`);
      if (result.storyThree.carnivalSample.opacity < 0.9 || result.storyThree.carnivalSample.box.bottom > 650 || result.storyThree.carnivalSample.box.left < 0 || result.storyThree.carnivalSample.box.right > viewportWidth) problems.push(`${label}: Story 3 carnival was not clearly framed in the lower-middle viewport.`);
      const invitationCenterX = (result.storyThree.invitationSample.box.left + result.storyThree.invitationSample.box.right) / 2;
      if (result.storyThree.invitationSample.box.bottom > 650 || invitationCenterX > viewportWidth * 0.7) problems.push(`${label}: Story 3 invitation remained too low or too far into the corner.`);
    }
  }
  if (result.lifecycle) {
    const {
      storyOnePauseResume,
      storyOneDragState,
      storyTwoPauseResume,
      storyTwoReplayState,
    } = result.lifecycle;
    if (storyOnePauseResume.paused.paused !== "true" || storyOnePauseResume.paused.activeState !== "story") problems.push(`${label}: Story 1 did not pause.`);
    if (storyOnePauseResume.resumed.paused !== "false" || storyOnePauseResume.resumed.activeState !== "story") problems.push(`${label}: Story 1 did not resume.`);
    if (storyOneDragState.activeState !== "story" || storyOneDragState.busy !== "true") problems.push(`${label}: Story 1 drag/drop replay did not start.`);
    if (storyTwoPauseResume.paused.paused !== "true" || storyTwoPauseResume.paused.activeState !== "story") problems.push(`${label}: Story 2 did not pause.`);
    if (storyTwoPauseResume.resumed.paused !== "false" || storyTwoPauseResume.resumed.activeState !== "story") problems.push(`${label}: Story 2 did not resume.`);
    if (storyTwoReplayState.activeState !== "story" || storyTwoReplayState.busy !== "true") problems.push(`${label}: Story 2 replay did not start.`);
  }
  return problems;
}

try {
  await command("Page.enable");
  await command("Runtime.enable");
  await command("Emulation.setDeviceMetricsOverride", {
    width: viewportWidth,
    height: viewportHeight,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await command("Emulation.setEmulatedMedia", {
    media: "screen",
    features: [{ name: "prefers-reduced-motion", value: prefersReducedMotion ? "reduce" : "no-preference" }],
  });

  const httpResult = await exercise(`http://127.0.0.1:${appPort}/`, "HTTP");
  const fileResult = await exercise(pathToFileURL(join(projectRoot, "index.html")).href, "file URL");
  const problems = [...failures(httpResult), ...failures(fileResult)];
  console.log(JSON.stringify({ problems }, null, 2));
  if (problems.length > 0) throw new Error(problems.join("\n"));
} finally {
  socket.close();
  const chromeExited = new Promise((resolveExit) => chrome.once("exit", resolveExit));
  chrome.kill();
  await Promise.race([chromeExited, delay(2000)]);
  server.close();
  await rm(profilePath, { recursive: true, force: true }).catch(() => {});
}
