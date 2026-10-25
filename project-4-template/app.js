const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const root = document.documentElement;
const startScreen = document.querySelector("#start-screen");
const enterButton = document.querySelector("#enter-button");
const experience = document.querySelector("#experience");
const sceneTitle = document.querySelector("#scene-title");
const preferenceNote = document.querySelector("#preference-note");
const motionStatus = document.querySelector("#motion-status");
const playPauseButton = document.querySelector("#play-pause-button");
const testStoryButton = document.querySelector("#test-story-button");
const playbackStatus = document.querySelector("#playback-status");
const torchInteractionStatus = document.querySelector("#torch-interaction-status");
const sceneHint = document.querySelector("#scene-hint");
const sceneSvg = document.querySelector(".scene-art");
const ambientAudio = document.querySelector("#ambient-audio");
const storyAudio = document.querySelector("#story-one-audio");
const lanternFeedbackAudio = document.querySelector("#lantern-feedback-audio");
const lanternIgnitionAudio = document.querySelector("#lantern-ignition-audio");
const lanternTrigger = document.querySelector("#lantern-trigger");
const lanternGlow = document.querySelector(".lantern-glow");
const lanternGlass = document.querySelector(".lantern-glass");
const torchTrigger = document.querySelector("#torch-trigger");
const kingSilhouetteBase = document.querySelector(".king-silhouette-base");
const kingEyes = document.querySelector(".king-eyes");
const kingFaceDetails = document.querySelector(".king-face-details");
const storyLayer = document.querySelector("#story-one-layer");
const leftBranch = document.querySelector("#branch-left-main");
const topBranch = document.querySelector("#branch-top-main");
const rightBranch = document.querySelector("#branch-right-main");
const storyVignette = document.querySelector(".story-vignette");
const storyLanternFlare = document.querySelector(".story-lantern-flare");
const storyBacklight = document.querySelector(".story-royal-backlight");
const storyCrown = document.querySelector(".story-tree-crown");
const crownLeftPiece = document.querySelector(".crown-left-piece");
const crownCenterPiece = document.querySelector(".crown-center-piece");
const crownRightPiece = document.querySelector(".crown-right-piece");
const storyKing = document.querySelector(".story-king-presence");
const storyLeaves = document.querySelector(".story-crown-leaves");

const STORY_DURATION = 8000;
const FULL_AMBIENT_VOLUME = 1;
const DUCKED_AMBIENT_VOLUME = 0.58;
const IGNITION_VOLUME = 0.42;
const HINTS = [
  { at: 12000, text: "A little flame waits among the roots..." },
  { at: 24000, text: "Perhaps the flame belongs somewhere else." },
  { at: 36000, text: "The lantern above is waiting to be lit." },
];
const LANTERN_FEEDBACK_SOURCES = [
  "assets/audio/lantern-step-1.wav",
  "assets/audio/lantern-step-2.wav",
  "assets/audio/lantern-step-3.wav",
];
const TORCH_FLAME_ORIGIN = { x: 97.4, y: 610.5 };
const LANTERN_DROP_CENTER = { x: 247, y: 407 };
const LANTERN_DROP_RADIUS = { x: 76, y: 88 };

let hasEntered = false;
let isPaused = true;
let appState = "intro";
let resumeState = "intro";
let audioUnavailable = false;
let storyAudioUnavailable = false;
let ignitionAudioUnavailable = false;
let ignitionAudioActive = false;
let storyAnimations = [];
let pausedAmbientAnimations = [];
let storyMasterAnimation = null;
let storyRunId = 0;
let audioMixFrame = null;
let lanternFeedbackUnavailable = false;
let storyStartedFrom = "development";
let torchMode = "idle";
let torchOffset = { x: 0, y: 0 };
let torchDrag = null;
let torchReturnAnimation = null;
let lastTorchInputWasKeyboard = false;
let storyStartPending = false;
let hintElapsed = 0;
let hintStartedAt = null;
let hintTimer = null;
let nextHintIndex = 0;

const developmentToolsEnabled =
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  && new URLSearchParams(window.location.search).get("storyTest") === "1";
document.body.dataset.developmentTools = String(developmentToolsEnabled);

function activeState() {
  return appState === "paused" ? resumeState : appState;
}

function updateStateAttributes() {
  document.body.dataset.state = appState;
  document.body.dataset.activeState = activeState();
  document.body.dataset.paused = String(isPaused);
  document.body.dataset.torchNear = String(torchMode === "near-lantern");

  const storyIsActive = activeState() === "story";
  const torchEnabled = hasEntered
    && appState === "exploring"
    && !isPaused
    && !storyStartPending
    && torchMode !== "returning";
  const torchSelected = torchMode === "selected";
  const torchDragging = torchMode === "dragging" || torchMode === "near-lantern";
  const lanternEnabled = torchEnabled && torchSelected;
  testStoryButton.disabled = isPaused || appState !== "exploring" || storyStartPending || torchDragging;
  torchTrigger.dataset.enabled = String(torchEnabled);
  torchTrigger.dataset.selected = String(torchSelected);
  torchTrigger.dataset.dragging = String(torchDragging);
  torchTrigger.setAttribute("aria-disabled", String(!torchEnabled));
  torchTrigger.setAttribute("aria-pressed", String(torchSelected));
  torchTrigger.setAttribute("tabindex", torchEnabled ? "0" : "-1");
  torchTrigger.setAttribute(
    "aria-label",
    torchSelected
      ? "Burning torch selected. Activate again or press Escape to return it. Activate the hanging lantern to light it."
      : "Burning torch. Select it to carry its flame to the hanging lantern.",
  );
  lanternTrigger.dataset.enabled = String(lanternEnabled);
  lanternTrigger.setAttribute("aria-disabled", String(!lanternEnabled));
  lanternTrigger.setAttribute("tabindex", lanternEnabled ? "0" : "-1");
  lanternTrigger.setAttribute(
    "aria-label",
    torchSelected
      ? "Hanging lantern. Activate to light it with the selected torch and awaken the King."
      : "Hanging lantern. Select the burning torch first.",
  );
  playPauseButton.setAttribute("aria-pressed", String(isPaused));
  playPauseButton.setAttribute(
    "aria-label",
    isPaused
      ? storyIsActive ? "Resume Story 1" : "Resume ambient scene"
      : storyIsActive ? "Pause Story 1" : "Pause ambient scene",
  );
}

function setAppState(nextState) {
  appState = nextState;
  updateStateAttributes();
}

function applyMotionPreference(prefersReducedMotion) {
  root.dataset.reducedMotion = String(prefersReducedMotion);
  preferenceNote.textContent = prefersReducedMotion
    ? "Reduced motion preference detected."
    : "Your motion preference will be respected.";
  motionStatus.textContent = prefersReducedMotion ? "Reduced motion" : "Standard motion";
}

function enterExperience() {
  startScreen.hidden = true;
  experience.removeAttribute("inert");
  experience.setAttribute("aria-hidden", "false");
  document.body.dataset.entered = "true";
  hasEntered = true;
  resumeState = "exploring";
  setAppState("paused");
  setPaused(false, false);
  resetHintClock();
  sceneTitle.focus({ preventScroll: true });
}

function reportAudioFailure(message) {
  playbackStatus.textContent = message;
}

function playAudio(audio, onFailure) {
  const playRequest = audio.play();
  if (playRequest !== undefined) playRequest.catch(onFailure);
}

function hideHint() {
  sceneHint.textContent = "";
  sceneHint.dataset.visible = "false";
}

function pauseHintClock() {
  if (hintStartedAt !== null) {
    hintElapsed += performance.now() - hintStartedAt;
    hintStartedAt = null;
  }
  if (hintTimer !== null) clearTimeout(hintTimer);
  hintTimer = null;
}

function startHintClock() {
  if (
    !hasEntered
    || isPaused
    || appState !== "exploring"
    || storyStartPending
    || torchMode === "dragging"
    || torchMode === "near-lantern"
    || torchMode === "returning"
    || nextHintIndex >= HINTS.length
    || hintTimer !== null
  ) return;

  const delay = Math.max(0, HINTS[nextHintIndex].at - hintElapsed);
  hintStartedAt = performance.now();
  hintTimer = window.setTimeout(() => {
    hintElapsed += performance.now() - hintStartedAt;
    hintStartedAt = null;
    hintTimer = null;

    if (isPaused || appState !== "exploring" || storyStartPending) return;
    sceneHint.textContent = HINTS[nextHintIndex].text;
    sceneHint.dataset.visible = "true";
    nextHintIndex += 1;
    startHintClock();
  }, delay);
}

function resetHintClock() {
  pauseHintClock();
  hintElapsed = 0;
  nextHintIndex = 0;
  hideHint();
  startHintClock();
}

function syncInteractionFeedbackAudio() {
  if (!lanternFeedbackAudio.getAttribute("src") || lanternFeedbackUnavailable || lanternFeedbackAudio.ended) return;
  if (isPaused) {
    lanternFeedbackAudio.pause();
    return;
  }
  playAudio(lanternFeedbackAudio, () => {
    lanternFeedbackUnavailable = true;
    reportAudioFailure("The torch and lantern still respond visually, but their feedback sound is unavailable.");
  });
}

function playInteractionFeedbackAudio(step) {
  lanternFeedbackAudio.pause();
  lanternFeedbackAudio.src = LANTERN_FEEDBACK_SOURCES[step - 1];
  lanternFeedbackAudio.currentTime = 0;
  lanternFeedbackUnavailable = false;
  syncInteractionFeedbackAudio();
}

function syncIgnitionAudio() {
  if (!ignitionAudioActive || ignitionAudioUnavailable || lanternIgnitionAudio.ended) return;
  if (isPaused || activeState() !== "story") {
    lanternIgnitionAudio.pause();
    return;
  }
  playAudio(lanternIgnitionAudio, () => {
    ignitionAudioUnavailable = true;
    reportAudioFailure("The lantern still lights visually, but its ignition sound is unavailable.");
  });
}

function playIgnitionAudio() {
  lanternIgnitionAudio.pause();
  lanternIgnitionAudio.currentTime = 0;
  lanternIgnitionAudio.volume = IGNITION_VOLUME;
  ignitionAudioUnavailable = false;
  ignitionAudioActive = true;
}

function clientToScenePoint(event) {
  const matrix = sceneSvg.getScreenCTM();
  if (!matrix) return null;
  const point = sceneSvg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  return point.matrixTransform(matrix.inverse());
}

function setTorchOffset(x, y) {
  torchOffset = { x, y };
  torchTrigger.style.transform = `translate(${x}px, ${y}px)`;
}

function flameIsNearLantern(offset = torchOffset) {
  const xDistance = (TORCH_FLAME_ORIGIN.x + offset.x - LANTERN_DROP_CENTER.x) / LANTERN_DROP_RADIUS.x;
  const yDistance = (TORCH_FLAME_ORIGIN.y + offset.y - LANTERN_DROP_CENTER.y) / LANTERN_DROP_RADIUS.y;
  return xDistance * xDistance + yDistance * yDistance <= 1;
}

function cancelTorchReturn() {
  if (!torchReturnAnimation) return;
  const animation = torchReturnAnimation;
  torchReturnAnimation = null;
  animation.cancel();
}

function finishTorchReturn(animation) {
  if (torchReturnAnimation !== animation) return;
  torchReturnAnimation = null;
  animation.cancel();
  setTorchOffset(0, 0);
  torchMode = "idle";
  updateStateAttributes();
  startHintClock();
}

function returnTorchToOrigin(announce = true) {
  const from = { ...torchOffset };
  torchDrag = null;
  if (announce) {
    torchInteractionStatus.textContent = "The flame did not reach the lantern. The torch returned to the roots.";
    playInteractionFeedbackAudio(2);
  }

  if (reducedMotionQuery.matches || Math.hypot(from.x, from.y) < 2) {
    setTorchOffset(0, 0);
    torchMode = "idle";
    updateStateAttributes();
    startHintClock();
    return;
  }

  torchMode = "returning";
  updateStateAttributes();
  const animation = torchTrigger.animate(
    [
      { transform: `translate(${from.x}px, ${from.y}px)` },
      { transform: "translate(0px, 0px)" },
    ],
    { duration: 320, easing: "cubic-bezier(.3,.7,.35,1)", fill: "both" },
  );
  torchReturnAnimation = animation;
  animation.finished.then(() => finishTorchReturn(animation)).catch(() => {});
}

function releaseTorchPointer() {
  if (!torchDrag) return;
  const pointerId = torchDrag.pointerId;
  torchDrag = null;
  if (torchTrigger.hasPointerCapture?.(pointerId)) torchTrigger.releasePointerCapture(pointerId);
}

function selectTorch(inputWasKeyboard) {
  if (!hasEntered || isPaused || appState !== "exploring" || storyStartPending) return;
  cancelTorchReturn();
  setTorchOffset(0, 0);
  torchMode = "selected";
  lastTorchInputWasKeyboard = inputWasKeyboard;
  resetHintClock();
  torchInteractionStatus.textContent = "Torch selected. Carry its flame to the hanging lantern, or activate the lantern now.";
  playInteractionFeedbackAudio(1);
  updateStateAttributes();
  if (inputWasKeyboard) lanternTrigger.focus({ preventScroll: true });
}

function cancelTorchSelection(returnFocus = false) {
  if (torchMode !== "selected") return;
  torchMode = "idle";
  torchInteractionStatus.textContent = "Torch selection cancelled. It rests among the roots again.";
  playInteractionFeedbackAudio(2);
  updateStateAttributes();
  startHintClock();
  if (returnFocus) torchTrigger.focus({ preventScroll: true });
}

function igniteLantern(inputWasKeyboard) {
  if (
    !hasEntered
    || isPaused
    || appState !== "exploring"
    || storyStartPending
    || !["selected", "dragging", "near-lantern"].includes(torchMode)
  ) return;

  releaseTorchPointer();
  storyStartPending = true;
  torchMode = "igniting";
  lastTorchInputWasKeyboard = inputWasKeyboard;
  pauseHintClock();
  hideHint();
  torchInteractionStatus.textContent = "The torch lights the hanging lantern. The warm glow awakens the King.";
  updateStateAttributes();
  playIgnitionAudio();
  startStory("torch");
  syncIgnitionAudio();
  storyStartPending = false;
}

function beginTorchDrag(event) {
  if (!hasEntered || isPaused || appState !== "exploring" || storyStartPending) return;
  if (torchMode === "selected") {
    event.preventDefault();
    cancelTorchSelection(false);
    return;
  }
  if (torchMode !== "idle") return;

  const point = clientToScenePoint(event);
  if (!point) return;
  event.preventDefault();
  cancelTorchReturn();
  torchDrag = {
    pointerId: event.pointerId,
    start: point,
    origin: { ...torchOffset },
    moved: false,
  };
  torchMode = "dragging";
  lastTorchInputWasKeyboard = false;
  torchTrigger.setPointerCapture(event.pointerId);
  resetHintClock();
  torchInteractionStatus.textContent = "Torch picked up. Move its flame toward the hanging lantern.";
  playInteractionFeedbackAudio(1);
  updateStateAttributes();
}

function moveTorch(event) {
  if (!torchDrag || event.pointerId !== torchDrag.pointerId) return;
  const point = clientToScenePoint(event);
  if (!point) return;
  event.preventDefault();
  const x = torchDrag.origin.x + point.x - torchDrag.start.x;
  const y = torchDrag.origin.y + point.y - torchDrag.start.y;
  const clampedX = Math.max(-42, Math.min(278, x));
  const clampedY = Math.max(-590, Math.min(96, y));
  if (Math.hypot(clampedX - torchDrag.origin.x, clampedY - torchDrag.origin.y) > 5) {
    torchDrag.moved = true;
  }
  if (!torchDrag.moved) return;
  setTorchOffset(clampedX, clampedY);
  const nearLantern = flameIsNearLantern();
  if (nearLantern && torchMode !== "near-lantern") {
    torchInteractionStatus.textContent = "The flame is close enough. Release it to light the lantern.";
  }
  torchMode = nearLantern ? "near-lantern" : "dragging";
  updateStateAttributes();
}

function endTorchDrag(event) {
  if (!torchDrag || event.pointerId !== torchDrag.pointerId) return;
  event.preventDefault();
  const moved = torchDrag.moved;
  const successfulDrop = moved && flameIsNearLantern();
  releaseTorchPointer();
  if (successfulDrop) {
    igniteLantern(false);
  } else if (moved) {
    returnTorchToOrigin();
  } else {
    selectTorch(false);
  }
}

function cancelPhysicalDrag(announce = true) {
  if (!torchDrag) return;
  releaseTorchPointer();
  if (announce) {
    torchInteractionStatus.textContent = "Torch movement cancelled. It returned to the roots.";
  }
  setTorchOffset(0, 0);
  torchMode = "idle";
  updateStateAttributes();
}

function resetTorchInteraction() {
  releaseTorchPointer();
  cancelTorchReturn();
  lanternFeedbackAudio.pause();
  if (Number.isFinite(lanternFeedbackAudio.duration)) lanternFeedbackAudio.currentTime = 0;
  storyStartPending = false;
  setTorchOffset(0, 0);
  torchMode = "idle";
  torchInteractionStatus.textContent = "The torch rests among the roots. Select it, then light the hanging lantern.";
  resetHintClock();
  updateStateAttributes();
}

function syncAmbientAudio() {
  if (!hasEntered) return;

  if (isPaused) {
    ambientAudio.pause();
    return;
  }

  playAudio(ambientAudio, () => {
    audioUnavailable = true;
    reportAudioFailure("Ambient visuals are active, but ambient audio could not start.");
  });
}

function storyTimeSeconds() {
  return Number(storyMasterAnimation?.currentTime ?? 0) / 1000;
}

function syncStoryAudioToTimeline() {
  if (activeState() !== "story" || storyAudioUnavailable) return;
  const targetTime = Math.min(storyTimeSeconds(), STORY_DURATION / 1000);
  if (Math.abs(storyAudio.currentTime - targetTime) > 0.045) storyAudio.currentTime = targetTime;
}

function syncStoryAudio() {
  if (activeState() !== "story") return;

  if (isPaused) {
    storyAudio.pause();
    return;
  }

  syncStoryAudioToTimeline();
  playAudio(storyAudio, () => {
    storyAudioUnavailable = true;
    reportAudioFailure("Story 1 continues visually, but its sound could not start.");
  });
}

function ambientVolumeAt(storyTime) {
  if (storyTime < 0.8) {
    return FULL_AMBIENT_VOLUME
      + (DUCKED_AMBIENT_VOLUME - FULL_AMBIENT_VOLUME) * (storyTime / 0.8);
  }
  if (storyTime < 7.1) return DUCKED_AMBIENT_VOLUME;
  return DUCKED_AMBIENT_VOLUME
    + (FULL_AMBIENT_VOLUME - DUCKED_AMBIENT_VOLUME) * Math.min(1, (storyTime - 7.1) / 0.9);
}

function updateStoryAudioMix() {
  audioMixFrame = null;
  if (activeState() !== "story") return;
  ambientAudio.volume = ambientVolumeAt(storyTimeSeconds());
  if (!isPaused) audioMixFrame = requestAnimationFrame(updateStoryAudioMix);
}

function startStoryAudioMix() {
  if (audioMixFrame !== null) cancelAnimationFrame(audioMixFrame);
  audioMixFrame = requestAnimationFrame(updateStoryAudioMix);
}

function stopStoryAudioMix() {
  if (audioMixFrame !== null) cancelAnimationFrame(audioMixFrame);
  audioMixFrame = null;
  ambientAudio.volume = FULL_AMBIENT_VOLUME;
}

function setPaused(nextPaused, announce = true) {
  if (nextPaused === isPaused && hasEntered) return;

  if (nextPaused) {
    if (torchMode === "dragging" || torchMode === "near-lantern") cancelPhysicalDrag(false);
    resumeState = activeState();
    isPaused = true;
    setAppState("paused");
    for (const animation of experience.getAnimations({ subtree: true })) animation.pause();
    ambientAudio.pause();
    storyAudio.pause();
    lanternFeedbackAudio.pause();
    lanternIgnitionAudio.pause();
    pauseHintClock();
    if (audioMixFrame !== null) cancelAnimationFrame(audioMixFrame);
    audioMixFrame = null;
  } else {
    isPaused = false;
    setAppState(resumeState);

    for (const animation of experience.getAnimations({ subtree: true })) {
      if (appState === "story" && !storyAnimations.includes(animation)) animation.pause();
      else animation.play();
    }

    syncAmbientAudio();
    if (appState === "story") {
      syncStoryAudio();
      syncIgnitionAudio();
      startStoryAudioMix();
    } else if (appState === "exploring") {
      syncInteractionFeedbackAudio();
      startHintClock();
    }
  }

  updateStateAttributes();

  if (announce && hasEntered) {
    const storyIsActive = activeState() === "story";
    playbackStatus.textContent = isPaused
      ? storyIsActive ? "Story 1 paused." : "Ambient scene paused."
      : storyIsActive ? "Story 1 resumed." : "Ambient scene resumed.";
  }
}

function makeStoryAnimation(element, keyframes, options = {}) {
  const animation = element.animate(keyframes, {
    duration: STORY_DURATION,
    fill: "both",
    easing: "linear",
    ...options,
  });
  animation.pause();
  animation.currentTime = 0;
  storyAnimations.push(animation);
  return animation;
}

function buildStoryAnimations(prefersReducedMotion) {
  storyAnimations = [];
  const ignitionScale = prefersReducedMotion ? 1 : 1.16;

  makeStoryAnimation(lanternGlow, [
    { opacity: 0, transform: prefersReducedMotion ? "scale(1)" : "scale(.82)", offset: 0 },
    { opacity: 1, transform: `scale(${ignitionScale})`, offset: 0.1, easing: "ease-out" },
    { opacity: 0.76, transform: "scale(1)", offset: 0.24 },
    { opacity: 0.7, transform: "scale(1)", offset: 0.86 },
    { opacity: 0, transform: "scale(.92)", offset: 0.98, easing: "ease-in" },
    { opacity: 0, transform: "scale(.92)", offset: 1 },
  ]);

  makeStoryAnimation(lanternGlass, [
    { opacity: 0.24, filter: "grayscale(1) brightness(.26)", offset: 0 },
    { opacity: 1, filter: "saturate(1) brightness(1.16)", offset: 0.1, easing: "ease-out" },
    { opacity: 0.82, filter: "saturate(.9) brightness(1)", offset: 0.24 },
    { opacity: 0.76, filter: "saturate(.85) brightness(.94)", offset: 0.86 },
    { opacity: 0.24, filter: "grayscale(1) brightness(.26)", offset: 0.98, easing: "ease-in" },
    { opacity: 0.24, filter: "grayscale(1) brightness(.26)", offset: 1 },
  ]);

  makeStoryAnimation(storyVignette, [
    { opacity: 0, offset: 0 },
    { opacity: 0.34, offset: 0.2, easing: "ease-out" },
    { opacity: 0.34, offset: 0.84 },
    { opacity: 0, offset: 1, easing: "ease-in" },
  ]);

  makeStoryAnimation(storyLanternFlare, [
    { opacity: 0, transform: "scale(0.82)", offset: 0 },
    { opacity: 0.92, transform: "scale(1.16)", offset: 0.1, easing: "ease-out" },
    { opacity: 0.32, transform: "scale(0.98)", offset: 0.24 },
    { opacity: 0.28, transform: "scale(1)", offset: 0.68 },
    { opacity: 0, transform: "scale(0.9)", offset: 0.94 },
    { opacity: 0, transform: "scale(0.9)", offset: 1 },
  ]);

  const leftTurn = prefersReducedMotion ? 2.4 : 9;
  const topTurn = prefersReducedMotion ? -1.8 : -6.5;
  const rightTurn = prefersReducedMotion ? -2.4 : -9;
  const branchFrames = (degrees) => [
    { transform: "rotate(0deg)", offset: 0 },
    { transform: "rotate(0deg)", offset: 0.03 },
    { transform: `rotate(${degrees * 0.35}deg)`, offset: 0.25, easing: "ease-out" },
    { transform: `rotate(${degrees * 0.58}deg)`, offset: 0.44 },
    { transform: `rotate(${degrees}deg)`, offset: 0.68, easing: "cubic-bezier(.18,.7,.26,1.08)" },
    { transform: `rotate(${degrees * 0.96}deg)`, offset: 0.81 },
    { transform: "rotate(0deg)", offset: 1, easing: "cubic-bezier(.55,0,.35,1)" },
  ];
  makeStoryAnimation(leftBranch, branchFrames(leftTurn));
  makeStoryAnimation(topBranch, branchFrames(topTurn));
  makeStoryAnimation(rightBranch, branchFrames(rightTurn));

  const crownTurn = prefersReducedMotion ? 5 : 17;
  const crownSettle = prefersReducedMotion ? 3 : 8;
  const crownCenterTurn = prefersReducedMotion ? 1 : 3;
  makeStoryAnimation(storyCrown, [
    { opacity: 0, transform: `translateY(${-crownSettle}px)`, offset: 0 },
    { opacity: 0, transform: `translateY(${-crownSettle}px)`, offset: 0.42 },
    { opacity: 0.34, transform: `translateY(${-crownSettle * 0.72}px)`, offset: 0.5, easing: "ease-out" },
    { opacity: 1, transform: "translateY(0)", offset: 0.68, easing: "cubic-bezier(.2,.72,.3,1.04)" },
    { opacity: 1, transform: "translateY(0)", offset: 0.81 },
    { opacity: 0, transform: "translateY(2px)", offset: 0.91, easing: "ease-in" },
    { opacity: 0, transform: "translateY(2px)", offset: 1 },
  ]);

  makeStoryAnimation(crownLeftPiece, [
    { transform: `rotate(${-crownTurn}deg)`, offset: 0 },
    { transform: `rotate(${-crownTurn}deg)`, offset: 0.42 },
    { transform: "rotate(0deg)", offset: 0.68, easing: "cubic-bezier(.2,.72,.3,1.08)" },
    { transform: "rotate(0deg)", offset: 0.81 },
    { transform: `rotate(${-crownTurn * 0.3}deg)`, offset: 1 },
  ]);
  makeStoryAnimation(crownCenterPiece, [
    { transform: `rotate(${-crownCenterTurn}deg)`, offset: 0 },
    { transform: `rotate(${-crownCenterTurn}deg)`, offset: 0.42 },
    { transform: "rotate(0deg)", offset: 0.68, easing: "cubic-bezier(.2,.72,.3,1.08)" },
    { transform: "rotate(0deg)", offset: 0.81 },
    { transform: `rotate(${crownCenterTurn * 0.3}deg)`, offset: 1 },
  ]);
  makeStoryAnimation(crownRightPiece, [
    { transform: `rotate(${crownTurn}deg)`, offset: 0 },
    { transform: `rotate(${crownTurn}deg)`, offset: 0.42 },
    { transform: "rotate(0deg)", offset: 0.68, easing: "cubic-bezier(.2,.72,.3,1.08)" },
    { transform: "rotate(0deg)", offset: 0.81 },
    { transform: `rotate(${crownTurn * 0.3}deg)`, offset: 1 },
  ]);

  const revealDistance = prefersReducedMotion ? 2 : 7;
  const nodAngle = prefersReducedMotion ? 1.25 : 3.5;
  makeStoryAnimation(storyKing, [
    { transform: `translateY(${revealDistance}px) rotate(0deg)`, offset: 0 },
    { transform: `translateY(${revealDistance}px) rotate(0deg)`, offset: 0.24 },
    { transform: "translateY(0) rotate(0deg)", offset: 0.43, easing: "ease-out" },
    { transform: "translateY(0) rotate(0deg)", offset: 0.69 },
    { transform: `translateY(1px) rotate(${nodAngle}deg)`, offset: 0.75, easing: "ease-in-out" },
    { transform: "translateY(0) rotate(0deg)", offset: 0.8, easing: "ease-in-out" },
    { transform: "translateY(0) rotate(0deg)", offset: 0.81 },
    { transform: `translateY(${revealDistance}px) rotate(0deg)`, offset: 0.97, easing: "ease-in" },
    { transform: `translateY(${revealDistance}px) rotate(0deg)`, offset: 1 },
  ]);

  makeStoryAnimation(kingSilhouetteBase, [
    { opacity: 0, offset: 0 },
    { opacity: 0, offset: 0.24 },
    { opacity: 0.88, offset: 0.43, easing: "ease-out" },
    { opacity: 0.88, offset: 0.81 },
    { opacity: 0, offset: 0.97, easing: "ease-in" },
    { opacity: 0, offset: 1 },
  ]);

  makeStoryAnimation(kingEyes, [
    { opacity: 0, offset: 0 },
    { opacity: 0, offset: 0.08, easing: "ease-out" },
    { opacity: 0, offset: 0.24 },
    { opacity: 0.86, offset: 0.43, easing: "ease-out" },
    { opacity: 0.86, offset: 0.81 },
    { opacity: 0, offset: 0.97, easing: "ease-in" },
    { opacity: 0, offset: 1 },
  ]);

  makeStoryAnimation(kingFaceDetails, [
    { opacity: 0, offset: 0 },
    { opacity: 0, offset: 0.24 },
    { opacity: 1, offset: 0.43, easing: "ease-out" },
    { opacity: 1, offset: 0.81 },
    { opacity: 0, offset: 0.97, easing: "ease-in" },
    { opacity: 0, offset: 1 },
  ]);

  makeStoryAnimation(storyBacklight, [
    { opacity: 0, transform: "scale(.8)", offset: 0 },
    { opacity: 0.24, transform: "scale(.86)", offset: 0.16, easing: "ease-out" },
    { opacity: 0.45, transform: "scale(.94)", offset: 0.3 },
    { opacity: 0.58, transform: "scale(1)", offset: 0.43, easing: "ease-out" },
    { opacity: 0.62, transform: "scale(1.03)", offset: 0.81 },
    { opacity: 0, transform: "scale(.92)", offset: 0.97, easing: "ease-in" },
    { opacity: 0, transform: "scale(.92)", offset: 1 },
  ]);

  makeStoryAnimation(storyLeaves, [
    { opacity: 0, transform: "scale(.72)", offset: 0 },
    { opacity: 0, transform: "scale(.72)", offset: 0.8 },
    { opacity: 0.94, transform: "scale(1)", offset: 0.86, easing: "ease-out" },
    { opacity: 0.72, transform: "scale(1.08)", offset: 0.9 },
    { opacity: 0, transform: "scale(1.12)", offset: 1, easing: "ease-in" },
  ]);

  const leafTravel = prefersReducedMotion ? 4 : 18;
  storyLeaves.querySelectorAll("path").forEach((leaf, index) => {
    const direction = index - 2;
    makeStoryAnimation(leaf, [
      { transform: "translate(0, 0) rotate(0deg)", offset: 0 },
      { transform: "translate(0, 0) rotate(0deg)", offset: 0.8 },
      {
        transform: `translate(${direction * leafTravel * 0.45}px, ${Math.abs(direction) * 2}px) rotate(${direction * 8}deg)`,
        offset: 1,
        easing: "ease-out",
      },
    ]);
  });

  storyMasterAnimation = makeStoryAnimation(storyLayer, [
    { opacity: 1 },
    { opacity: 1 },
  ]);
}

function finishStory(runId) {
  if (runId !== storyRunId || activeState() !== "story") return;

  stopStoryAudioMix();
  storyAudio.pause();
  storyAudio.currentTime = 0;
  lanternIgnitionAudio.pause();
  lanternIgnitionAudio.currentTime = 0;
  ignitionAudioActive = false;
  for (const animation of storyAnimations) animation.cancel();
  storyAnimations = [];
  storyMasterAnimation = null;
  experience.removeAttribute("aria-busy");
  setAppState("exploring");

  for (const animation of pausedAmbientAnimations) animation.play();
  pausedAmbientAnimations = [];
  resetTorchInteraction();
  playbackStatus.textContent = "Story 1 complete. The forest is ready to replay.";
  if (storyStartedFrom === "torch" && lastTorchInputWasKeyboard) {
    torchTrigger.focus({ preventScroll: true });
  } else if (storyStartedFrom === "development" && developmentToolsEnabled) {
    testStoryButton.focus({ preventScroll: true });
  }
}

function startStory(source = "development") {
  if (!hasEntered || isPaused || appState !== "exploring") return;

  const runId = ++storyRunId;
  storyStartedFrom = source;
  pauseHintClock();
  hideHint();
  lanternFeedbackAudio.pause();
  pausedAmbientAnimations = experience.getAnimations({ subtree: true });
  for (const animation of pausedAmbientAnimations) animation.pause();

  setAppState("story");
  experience.setAttribute("aria-busy", "true");
  storyAudioUnavailable = false;
  storyAudio.pause();
  storyAudio.currentTime = 0;

  buildStoryAnimations(reducedMotionQuery.matches);
  storyMasterAnimation.finished
    .then(() => finishStory(runId))
    .catch(() => {});

  for (const animation of storyAnimations) animation.play();
  syncStoryAudio();
  startStoryAudioMix();
  playbackStatus.textContent = "Story 1: The Crown in the Trees has begun.";
}

applyMotionPreference(reducedMotionQuery.matches);
if (typeof reducedMotionQuery.addEventListener === "function") {
  reducedMotionQuery.addEventListener("change", (event) => applyMotionPreference(event.matches));
} else {
  reducedMotionQuery.addListener((event) => applyMotionPreference(event.matches));
}

enterButton.addEventListener("click", enterExperience);
playPauseButton.addEventListener("click", () => setPaused(!isPaused));
testStoryButton.addEventListener("click", () => startStory("development"));
torchTrigger.addEventListener("pointerdown", beginTorchDrag);
torchTrigger.addEventListener("pointermove", moveTorch);
torchTrigger.addEventListener("pointerup", endTorchDrag);
torchTrigger.addEventListener("pointercancel", () => cancelPhysicalDrag(true));
torchTrigger.addEventListener("lostpointercapture", () => {
  if (torchDrag) cancelPhysicalDrag(true);
});
torchTrigger.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    cancelTorchSelection(true);
    return;
  }
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  if (torchMode === "selected") cancelTorchSelection(true);
  else selectTorch(true);
});
lanternTrigger.addEventListener("click", () => {
  igniteLantern(false);
});
lanternTrigger.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    cancelTorchSelection(true);
    return;
  }
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    igniteLantern(true);
  }
});

experience.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || torchMode !== "selected") return;
  event.preventDefault();
  cancelTorchSelection(true);
});

function recordExplorationActivity(event) {
  if (isPaused || appState !== "exploring" || storyStartPending) return;
  const target = event.target;
  if (target.closest?.("#torch-trigger, #lantern-trigger, #play-pause-button, #test-story-button")) return;
  resetHintClock();
}

experience.addEventListener("pointerdown", recordExplorationActivity);
experience.addEventListener("keydown", recordExplorationActivity);

ambientAudio.addEventListener("playing", () => {
  audioUnavailable = false;
});
ambientAudio.addEventListener("error", () => {
  audioUnavailable = true;
  if (hasEntered) reportAudioFailure("Ambient visuals are active, but ambient audio is unavailable.");
});
storyAudio.addEventListener("error", () => {
  storyAudioUnavailable = true;
  if (activeState() === "story") reportAudioFailure("Story 1 continues visually, but its sound is unavailable.");
});
lanternFeedbackAudio.addEventListener("playing", () => {
  lanternFeedbackUnavailable = false;
});
lanternFeedbackAudio.addEventListener("error", () => {
  lanternFeedbackUnavailable = true;
  if (hasEntered) {
    reportAudioFailure("The torch and lantern still respond visually, but their feedback sound is unavailable.");
  }
});
lanternIgnitionAudio.addEventListener("playing", () => {
  ignitionAudioUnavailable = false;
});
lanternIgnitionAudio.addEventListener("ended", () => {
  ignitionAudioActive = false;
});
lanternIgnitionAudio.addEventListener("error", () => {
  ignitionAudioUnavailable = true;
  if (activeState() === "story") {
    reportAudioFailure("The lantern still lights visually, but its ignition sound is unavailable.");
  }
});

updateStateAttributes();
