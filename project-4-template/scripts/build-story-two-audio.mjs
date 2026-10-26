import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, "..");
const audioDirectory = resolve(projectDirectory, "assets", "audio");
const sampleRate = 44100;

function createTrack(duration) {
  const frameCount = Math.round(duration * sampleRate);
  return {
    duration,
    frameCount,
    left: new Float32Array(frameCount),
    right: new Float32Array(frameCount),
  };
}

function panGains(pan) {
  return {
    left: Math.cos((pan + 1) * Math.PI / 4),
    right: Math.sin((pan + 1) * Math.PI / 4),
  };
}

function addTone(track, {
  start,
  duration,
  frequency,
  gain,
  pan = 0,
  attack = 0.012,
  release = 0.18,
  overtone = 0.18,
  tremolo = 0,
}) {
  const startFrame = Math.round(start * sampleRate);
  const toneFrames = Math.round(duration * sampleRate);
  const stereo = panGains(pan);

  for (let frame = 0; frame < toneFrames && startFrame + frame < track.frameCount; frame += 1) {
    const time = frame / sampleRate;
    const remaining = duration - time;
    const envelope = Math.min(1, time / attack, remaining / release);
    const movement = tremolo ? 0.78 + 0.22 * Math.sin(2 * Math.PI * tremolo * time) : 1;
    const fundamental = Math.sin(2 * Math.PI * frequency * time);
    const upper = Math.sin(2 * Math.PI * frequency * 2.01 * time + 0.38) * overtone;
    const sample = (fundamental + upper) * gain * envelope * movement;
    track.left[startFrame + frame] += sample * stereo.left;
    track.right[startFrame + frame] += sample * stereo.right;
  }
}

function addNoise(track, {
  start,
  duration,
  gain,
  pan = 0,
  seed = 1,
  roughness = 0.72,
  attack = 0.004,
  release = 0.12,
}) {
  const startFrame = Math.round(start * sampleRate);
  const noiseFrames = Math.round(duration * sampleRate);
  const stereo = panGains(pan);
  let state = seed >>> 0;
  let smoothed = 0;

  for (let frame = 0; frame < noiseFrames && startFrame + frame < track.frameCount; frame += 1) {
    state = (1664525 * state + 1013904223) >>> 0;
    const white = state / 0xffffffff * 2 - 1;
    smoothed += (white - smoothed) * roughness;
    const time = frame / sampleRate;
    const remaining = duration - time;
    const envelope = Math.min(1, time / attack, remaining / release);
    const sample = smoothed * gain * envelope;
    track.left[startFrame + frame] += sample * stereo.left;
    track.right[startFrame + frame] += sample * stereo.right;
  }
}

function addWoodenKnock(track, start, pan = 0) {
  addNoise(track, {
    start,
    duration: 0.13,
    gain: 0.17,
    pan,
    seed: 431 + Math.round(start * 100),
    roughness: 0.28,
    release: 0.11,
  });
  addTone(track, {
    start,
    duration: 0.34,
    frequency: 104,
    gain: 0.16,
    pan,
    attack: 0.002,
    release: 0.32,
    overtone: 0.3,
  });
  addTone(track, {
    start: start + 0.006,
    duration: 0.22,
    frequency: 157,
    gain: 0.07,
    pan,
    attack: 0.002,
    release: 0.2,
    overtone: 0.12,
  });
}

function addPaperStep(track, start, pan, seed) {
  addNoise(track, {
    start,
    duration: 0.18,
    gain: 0.08,
    pan,
    seed,
    roughness: 0.82,
    release: 0.15,
  });
  addTone(track, {
    start,
    duration: 0.2,
    frequency: 132,
    gain: 0.035,
    pan,
    attack: 0.004,
    release: 0.18,
    overtone: 0.08,
  });
}

function addChime(track, start, gain = 0.045) {
  [293.66, 440, 587.33].forEach((frequency, index) => {
    addTone(track, {
      start: start + index * 0.055,
      duration: 0.9 - index * 0.08,
      frequency,
      gain: gain * (1 - index * 0.16),
      pan: (index - 1) * 0.18,
      attack: 0.008,
      release: 0.68,
      overtone: 0.3,
      tremolo: 2.2,
    });
  });
}

function encodeWave(track) {
  let peak = 0;
  for (let frame = 0; frame < track.frameCount; frame += 1) {
    peak = Math.max(peak, Math.abs(track.left[frame]), Math.abs(track.right[frame]));
  }
  const masterGain = peak > 0.84 ? 0.84 / peak : 1;
  const dataSize = track.frameCount * 4;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(2, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 4, 28);
  buffer.writeUInt16LE(4, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let frame = 0; frame < track.frameCount; frame += 1) {
    const offset = 44 + frame * 4;
    const left = Math.max(-1, Math.min(1, track.left[frame] * masterGain));
    const right = Math.max(-1, Math.min(1, track.right[frame] * masterGain));
    buffer.writeInt16LE(Math.round(left * 32767), offset);
    buffer.writeInt16LE(Math.round(right * 32767), offset + 2);
  }

  return { buffer, peak: peak * masterGain };
}

async function saveTrack(filename, track) {
  const encoded = encodeWave(track);
  const outputPath = resolve(audioDirectory, filename);
  await writeFile(outputPath, encoded.buffer);
  console.log(`Created ${outputPath}`);
  console.log(`Duration: ${track.duration}s; sample rate: ${sampleRate}Hz; channels: 2; peak: ${encoded.peak.toFixed(3)}`);
}

await mkdir(audioDirectory, { recursive: true });

const knock = createTrack(0.72);
addWoodenKnock(knock, 0.04, -0.08);
await saveTrack("cottage-knock.wav", knock);

const response = createTrack(1.35);
addNoise(response, {
  start: 0.03,
  duration: 0.48,
  gain: 0.055,
  pan: -0.2,
  seed: 2206,
  roughness: 0.62,
  release: 0.3,
});
addTone(response, {
  start: 0.12,
  duration: 0.95,
  frequency: 349.23,
  gain: 0.038,
  pan: -0.18,
  release: 0.64,
  overtone: 0.24,
  tremolo: 2.7,
});
addTone(response, {
  start: 0.25,
  duration: 0.86,
  frequency: 523.25,
  gain: 0.025,
  pan: 0.1,
  release: 0.58,
  overtone: 0.2,
});
await saveTrack("cottage-window-response.wav", response);

const story = createTrack(8);

// 0–2 seconds: a papery slip from the cottage window.
addNoise(story, {
  start: 0.18,
  duration: 1.25,
  gain: 0.046,
  pan: -0.42,
  seed: 8021,
  roughness: 0.48,
  attack: 0.08,
  release: 0.38,
});
addTone(story, {
  start: 0.3,
  duration: 1.2,
  frequency: 196,
  gain: 0.026,
  pan: -0.38,
  release: 0.45,
  overtone: 0.16,
  tremolo: 3.1,
});

// 2–4.5 seconds: exactly two readable paper-footstep bounds and a small glance-back rustle.
addPaperStep(story, 2.32, -0.26, 1281);
addPaperStep(story, 3.62, 0.24, 3499);
addNoise(story, {
  start: 4.08,
  duration: 0.24,
  gain: 0.028,
  pan: 0.18,
  seed: 4127,
  roughness: 0.58,
  release: 0.2,
});

// 4.5–6 seconds: the window calls first, followed by a short surprised paper snap.
addTone(story, {
  start: 4.5,
  duration: 1.35,
  frequency: 392,
  gain: 0.042,
  pan: -0.38,
  release: 0.52,
  overtone: 0.24,
  tremolo: 2.4,
});
addTone(story, {
  start: 4.72,
  duration: 1.18,
  frequency: 523.25,
  gain: 0.031,
  pan: -0.22,
  release: 0.5,
  overtone: 0.2,
});
addNoise(story, {
  start: 4.68,
  duration: 0.18,
  gain: 0.055,
  pan: 0.3,
  seed: 4681,
  roughness: 0.86,
  release: 0.14,
});

// 6–8 seconds: a deliberate paper fold, returning ribbon, and quiet resolution.
addNoise(story, {
  start: 5.96,
  duration: 0.78,
  gain: 0.06,
  pan: 0.28,
  seed: 6503,
  roughness: 0.74,
  attack: 0.015,
  release: 0.42,
});
addNoise(story, {
  start: 6.28,
  duration: 0.9,
  gain: 0.035,
  pan: -0.28,
  seed: 6719,
  roughness: 0.42,
  attack: 0.06,
  release: 0.42,
});
addChime(story, 7.18, 0.038);
await saveTrack("story-two-shadow.wav", story);
