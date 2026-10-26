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
  attack = 0.01,
  release = 0.2,
  overtone = 0.18,
  tremolo = 0,
}) {
  const startFrame = Math.round(start * sampleRate);
  const frameCount = Math.round(duration * sampleRate);
  const stereo = panGains(pan);

  for (let frame = 0; frame < frameCount && startFrame + frame < track.frameCount; frame += 1) {
    const time = frame / sampleRate;
    const remaining = duration - time;
    const envelope = Math.min(1, time / attack, remaining / release);
    const movement = tremolo ? 0.8 + 0.2 * Math.sin(2 * Math.PI * tremolo * time) : 1;
    const fundamental = Math.sin(2 * Math.PI * frequency * time);
    const upper = Math.sin(2 * Math.PI * frequency * 2.01 * time + 0.31) * overtone;
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
  seed,
  roughness = 0.66,
  attack = 0.01,
  release = 0.2,
}) {
  const startFrame = Math.round(start * sampleRate);
  const frameCount = Math.round(duration * sampleRate);
  const stereo = panGains(pan);
  let state = seed >>> 0;
  let smoothed = 0;

  for (let frame = 0; frame < frameCount && startFrame + frame < track.frameCount; frame += 1) {
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

function addBell(track, start) {
  [146.83, 293.66, 440, 698.46].forEach((frequency, index) => {
    addTone(track, {
      start: start + index * 0.006,
      duration: 1.75 - index * 0.12,
      frequency,
      gain: [0.12, 0.075, 0.042, 0.026][index],
      pan: -0.08 + index * 0.05,
      attack: 0.003,
      release: 1.35 - index * 0.1,
      overtone: index === 0 ? 0.08 : 0.24,
      tremolo: 1.4 + index * 0.25,
    });
  });
}

function addPaper(track, start, duration, pan, seed, gain = 0.04) {
  addNoise(track, {
    start,
    duration,
    gain,
    pan,
    seed,
    roughness: 0.55,
    attack: 0.035,
    release: Math.min(0.36, duration * 0.45),
  });
}

function addMusicBoxNote(track, start, frequency, pan) {
  addTone(track, {
    start,
    duration: 0.72,
    frequency,
    gain: 0.034,
    pan,
    attack: 0.004,
    release: 0.58,
    overtone: 0.42,
    tremolo: 2.1,
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

await mkdir(audioDirectory, { recursive: true });
const story = createTrack(9.5);

// 0–2 seconds: one magical midnight bell and a small answering tower shimmer.
addBell(story, 0.06);
addTone(story, {
  start: 0.58,
  duration: 1.15,
  frequency: 587.33,
  gain: 0.024,
  pan: 0.42,
  release: 0.86,
  overtone: 0.34,
  tremolo: 2.6,
});

// 2–4 seconds: three separate paper invitations unfurl from the crowned King.
addPaper(story, 2.02, 1.18, -0.24, 3109, 0.038);
addPaper(story, 2.32, 1.12, 0.04, 4313, 0.036);
addPaper(story, 2.62, 1.08, 0.3, 5927, 0.034);
addTone(story, {
  start: 2.05,
  duration: 1.7,
  frequency: 392,
  gain: 0.022,
  pan: 0,
  release: 0.72,
  overtone: 0.18,
  tremolo: 1.8,
});

// 4–6.5 seconds: a restrained, playful music-box carnival motif and tiny lights.
[
  [4.02, 523.25, -0.28],
  [4.36, 659.25, 0.18],
  [4.7, 783.99, 0.32],
  [5.08, 659.25, -0.12],
  [5.46, 587.33, 0.2],
  [5.84, 698.46, -0.2],
].forEach(([start, frequency, pan]) => addMusicBoxNote(story, start, frequency, pan));
addTone(story, {
  start: 5.48,
  duration: 0.86,
  frequency: 1046.5,
  gain: 0.018,
  pan: 0.32,
  release: 0.7,
  overtone: 0.28,
});

// 6.5–8 seconds: the carnival folds into parchment and resolves on the crown seal.
addPaper(story, 6.42, 0.88, 0.08, 7411, 0.055);
addPaper(story, 6.72, 0.62, -0.08, 8123, 0.038);
[392, 523.25, 659.25].forEach((frequency, index) => {
  addTone(story, {
    start: 7.02 + index * 0.07,
    duration: 0.86 - index * 0.06,
    frequency,
    gain: 0.026 - index * 0.003,
    pan: (index - 1) * 0.15,
    attack: 0.006,
    release: 0.66,
    overtone: 0.3,
    tremolo: 1.9,
  });
});

// Let the final invitation breathe while the card comes forward and fades.
[261.63, 392, 523.25].forEach((frequency, index) => {
  addTone(story, {
    start: 7.72 + index * 0.08,
    duration: 1.48 - index * 0.08,
    frequency,
    gain: 0.016 - index * 0.002,
    pan: (index - 1) * 0.12,
    attack: 0.12,
    release: 1.05,
    overtone: 0.2,
    tremolo: 1.2,
  });
});

const encoded = encodeWave(story);
const outputPath = resolve(audioDirectory, "story-three-invitation.wav");
await writeFile(outputPath, encoded.buffer);
console.log(`Created ${outputPath}`);
console.log(`Duration: ${story.duration}s; sample rate: ${sampleRate}Hz; channels: 2; peak: ${encoded.peak.toFixed(3)}`);

const unlock = createTrack(1.8);
addBell(unlock, 0.03);
addTone(unlock, {
  start: 0.52,
  duration: 1.12,
  frequency: 587.33,
  gain: 0.018,
  pan: 0.32,
  release: 0.86,
  overtone: 0.28,
  tremolo: 2.2,
});
const unlockEncoded = encodeWave(unlock);
const unlockPath = resolve(audioDirectory, "story-three-unlock.wav");
await writeFile(unlockPath, unlockEncoded.buffer);
console.log(`Created ${unlockPath}`);
console.log(`Duration: ${unlock.duration}s; sample rate: ${sampleRate}Hz; channels: 2; peak: ${unlockEncoded.peak.toFixed(3)}`);
