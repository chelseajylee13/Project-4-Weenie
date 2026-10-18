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
const lanternProgressStatus = document.querySelector("#lantern-progress-status");
const sceneHint = document.querySelector("#scene-hint");
const ambientAudio = document.querySelector("#ambient-audio");
const storyAudio = document.querySelector("#story-one-audio");
const lanternFeedbackAudio = document.querySelector("#lantern-feedback-audio");
const lanternTrigger = document.querySelector("#lantern-trigger");
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
const HINTS = [
  { at: 12000, text: "Something in the branches is still awake..." },
  { at: 24000, text: "A warm light keeps watch over the hollow." },
  { at: 36000, text: "Perhaps the lantern has more than one secret to tell." },
];
const LANTERN_FEEDBACK_SOURCES = [
  "assets/audio/lantern-step-1.wav",
  "assets/audio/lantern-step-2.wav",
  "assets/audio/lantern-step-3.wav",
];

let hasEntered = false;
let isPaused = true;
let appState = "intro";
let resumeState = "intro";
let audioUnavailable = false;
let storyAudioUnavailable = false;
let storyAnimations = [];
let pausedAmbientAnimations = [];
let storyMasterAnimation = null;
let storyRunId = 0;
let audioMixFrame = null;
let lanternProgress = 0;
let lanternFeedbackBusy = false;
let lanternStoryPending = false;
let lanternFeedbackAnimation = null;
let lanternFeedbackUnavailable = false;
let storyStartedFrom = "development";
let lastLanternInputWasKeyboard = false;
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

  const storyIsActive = activeState() === "story";
  const lanternEnabled = hasEntered
    && appState === "exploring"
    && !isPaused
    && !lanternFeedbackBusy
    && !lanternStoryPending;
  testStoryButton.disabled = isPaused || appState !== "exploring" || lanternFeedbackBusy || lanternStoryPending;
  lanternTrigger.dataset.enabled = String(lanternEnabled);
  lanternTrigger.setAttribute("aria-disabled", String(!lanternEnabled));
  lanternTrigger.setAttribute("tabindex", lanternEnabled ? "0" : "-1");
  const awakeningLabels = [
    "The King silhouette, eyes, and crown are hidden. Activate to investigate.",
    "The King's shadowy silhouette is visible. One of three awakening steps is complete.",
    "The same silhouette remains and its amber eyes are glowing. Two of three awakening steps are complete.",
    "The King is awakening. Three of three steps are complete.",
  ];
  lanternTrigger.setAttribute("aria-label", `Hanging lantern. ${awakeningLabels[lanternProgress]}`);
  document.body.dataset.lanternProgress = String(lanternProgress);
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
    || lanternFeedbackBusy
    || lanternStoryPending
    || nextHintIndex >= HINTS.length
    || hintTimer !== null
  ) return;

  const delay = Math.max(0, HINTS[nextHintIndex].at - hintElapsed);
  hintStartedAt = performance.now();
  hintTimer = window.setTimeout(() => {
    hintElapsed += performance.now() - hintStartedAt;
    hintStartedAt = null;
    hintTimer = null;

    if (isPaused || appState !== "exploring" || lanternStoryPending) return;
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

function syncLanternFeedbackAudio() {
  if (!lanternFeedbackBusy || lanternFeedbackUnavailable || lanternFeedbackAudio.ended) return;
  if (isPaused) {
    lanternFeedbackAudio.pause();
    return;
  }
  playAudio(lanternFeedbackAudio, () => {
    lanternFeedbackUnavailable = true;
    reportAudioFailure("The lantern still responds visually, but its feedback sound is unavailable.");
  });
}

function setLanternProgress(nextProgress, animate = true) {
  const previousProgress = lanternProgress;
  lanternProgress = nextProgress;
  document.body.dataset.lanternProgress = String(lanternProgress);
  if (!animate || nextProgress === 0) return;

  const reduced = reducedMotionQuery.matches;
  const duration = reduced ? 360 : 520;
  const silhouetteLevels = [0, 0.68, 0.68, 0.68];
  kingSilhouetteBase.animate(
    nextProgress === 1
      ? [
          { opacity: 0 },
          { opacity: 0.76, offset: 0.72 },
          { opacity: silhouetteLevels[nextProgress] },
        ]
      : [
          { opacity: silhouetteLevels[previousProgress] },
          { opacity: 0.76, offset: 0.48 },
          { opacity: silhouetteLevels[nextProgress] },
        ],
    { duration, easing: "ease-in-out" },
  );

  if (nextProgress >= 2) {
    kingEyes.animate(
      [
        { opacity: previousProgress >= 2 ? 0.86 : 0 },
        { opacity: nextProgress === 3 ? 1 : 0.78, offset: 0.5 },
        { opacity: 0.86 },
      ],
      { duration, easing: "ease-in-out" },
    );
  }
}

function playLanternVisualFeedback(step) {
  const reduced = reducedMotionQuery.matches;
  const standardFrames = [
    [
      { transform: "scale(1)" },
      { transform: "scale(1.025)", offset: 0.46 },
      { transform: "scale(1)" },
    ],
    [
      { transform: "rotate(0deg)" },
      { transform: "rotate(-2deg)", offset: 0.32 },
      { transform: "rotate(1.2deg)", offset: 0.68 },
      { transform: "rotate(0deg)" },
    ],
    [
      { transform: "translateY(0) scale(1)" },
      { transform: "translateY(-1.5px) scale(1.04)", offset: 0.48 },
      { transform: "translateY(0) scale(1)" },
    ],
  ];
  const reducedFrames = [
    [{ opacity: 1 }, { opacity: 0.78, offset: 0.5 }, { opacity: 1 }],
    [{ opacity: 1 }, { opacity: 0.68, offset: 0.45 }, { opacity: 1 }],
    [{ opacity: 1 }, { opacity: 0.58, offset: 0.45 }, { opacity: 1 }],
  ];
  return lanternTrigger.animate(
    reduced ? reducedFrames[step - 1] : standardFrames[step - 1],
    { duration: reduced ? 360 : 520, easing: "ease-in-out" },
  );
}

function playLanternFeedbackAudio(step) {
  lanternFeedbackAudio.pause();
  lanternFeedbackAudio.src = LANTERN_FEEDBACK_SOURCES[step - 1];
  lanternFeedbackAudio.currentTime = 0;
  lanternFeedbackUnavailable = false;
  syncLanternFeedbackAudio();
}

function finishLanternFeedback(step) {
  lanternFeedbackBusy = false;
  lanternFeedbackAnimation = null;

  if (step === 3 && lanternStoryPending && activeState() === "exploring") {
    lanternStoryPending = false;
    updateStateAttributes();
    startStory("lantern");
    return;
  }

  updateStateAttributes();
  startHintClock();
}

function activateLantern(inputWasKeyboard) {
  if (
    !hasEntered
    || isPaused
    || appState !== "exploring"
    || lanternFeedbackBusy
    || lanternStoryPending
    || lanternProgress >= 3
  ) return;

  lastLanternInputWasKeyboard = inputWasKeyboard;
  const step = lanternProgress + 1;
  lanternFeedbackBusy = true;
  lanternStoryPending = step === 3;
  resetHintClock();
  setLanternProgress(step);
  updateStateAttributes();

  const accessibleResponses = [
    "First lantern response: the shadow appears. The King's dark head silhouette is now visible; its eyes and crown remain hidden.",
    "Second lantern response: the eyes awaken. Amber eyes now glow within the same silhouette; the crown remains hidden.",
    "Third lantern response: the King fully awakens. The existing silhouette and eyes continue into Story 1.",
  ];
  lanternProgressStatus.textContent = accessibleResponses[step - 1];

  lanternFeedbackAnimation = playLanternVisualFeedback(step);
  playLanternFeedbackAudio(step);
  lanternFeedbackAnimation.finished
    .then(() => finishLanternFeedback(step))
    .catch(() => finishLanternFeedback(step));
}

function resetLanternInteraction() {
  lanternFeedbackAudio.pause();
  if (Number.isFinite(lanternFeedbackAudio.duration)) lanternFeedbackAudio.currentTime = 0;
  lanternFeedbackBusy = false;
  lanternStoryPending = false;
  lanternFeedbackAnimation = null;
  setLanternProgress(0, false);
  lanternProgressStatus.textContent = "The King silhouette, eyes, and crown are hidden. No awakening steps are complete.";
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
    resumeState = activeState();
    isPaused = true;
    setAppState("paused");
    for (const animation of experience.getAnimations({ subtree: true })) animation.pause();
    ambientAudio.pause();
    storyAudio.pause();
    lanternFeedbackAudio.pause();
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
      startStoryAudioMix();
    } else if (appState === "exploring") {
      syncLanternFeedbackAudio();
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
  const continuesAwakening = storyStartedFrom === "lantern" && lanternProgress === 3;
  makeStoryAnimation(storyKing, [
    { transform: continuesAwakening ? "translateY(0) rotate(0deg)" : `translateY(${revealDistance}px) rotate(0deg)`, offset: 0 },
    { transform: continuesAwakening ? "translateY(0) rotate(0deg)" : `translateY(${revealDistance}px) rotate(0deg)`, offset: 0.24 },
    { transform: "translateY(0) rotate(0deg)", offset: 0.43, easing: "ease-out" },
    { transform: "translateY(0) rotate(0deg)", offset: 0.69 },
    { transform: `translateY(1px) rotate(${nodAngle}deg)`, offset: 0.75, easing: "ease-in-out" },
    { transform: "translateY(0) rotate(0deg)", offset: 0.8, easing: "ease-in-out" },
    { transform: "translateY(0) rotate(0deg)", offset: 0.81 },
    { transform: `translateY(${revealDistance}px) rotate(0deg)`, offset: 0.97, easing: "ease-in" },
    { transform: `translateY(${revealDistance}px) rotate(0deg)`, offset: 1 },
  ]);

  makeStoryAnimation(kingSilhouetteBase, [
    { opacity: continuesAwakening ? 0.68 : 0, offset: 0 },
    { opacity: continuesAwakening ? 0.68 : 0, offset: 0.24 },
    { opacity: 0.88, offset: 0.43, easing: "ease-out" },
    { opacity: 0.88, offset: 0.81 },
    { opacity: 0, offset: 0.97, easing: "ease-in" },
    { opacity: 0, offset: 1 },
  ]);

  makeStoryAnimation(kingEyes, [
    { opacity: continuesAwakening ? 0.86 : 0, offset: 0 },
    { opacity: continuesAwakening ? 1 : 0, offset: 0.08, easing: "ease-out" },
    { opacity: continuesAwakening ? 0.86 : 0, offset: 0.24 },
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
  for (const animation of storyAnimations) animation.cancel();
  storyAnimations = [];
  storyMasterAnimation = null;
  experience.removeAttribute("aria-busy");
  setAppState("exploring");

  for (const animation of pausedAmbientAnimations) animation.play();
  pausedAmbientAnimations = [];
  resetLanternInteraction();
  playbackStatus.textContent = "Story 1 complete. The forest is ready to replay.";
  if (storyStartedFrom === "lantern" && lastLanternInputWasKeyboard) {
    lanternTrigger.focus({ preventScroll: true });
  } else if (storyStartedFrom === "development" && developmentToolsEnabled) {
    testStoryButton.focus({ preventScroll: true });
  }
}

function startStory(source = "development") {
  if (!hasEntered || isPaused || appState !== "exploring") return;

  if (source === "development" && lanternProgress > 0) {
    setLanternProgress(0, false);
    lanternProgressStatus.textContent = "Development playback started without lantern progress.";
  }

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
lanternTrigger.addEventListener("click", () => activateLantern(false));
lanternTrigger.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  activateLantern(true);
});

function recordExplorationActivity(event) {
  if (isPaused || appState !== "exploring" || lanternFeedbackBusy || lanternStoryPending) return;
  const target = event.target;
  if (target.closest?.("#lantern-trigger, #play-pause-button, #test-story-button")) return;
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
    reportAudioFailure("The lantern still responds visually, but its feedback sound is unavailable.");
  }
});

updateStateAttributes();
