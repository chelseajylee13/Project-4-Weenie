import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, "..");
const sourcePath = resolve(
  projectDirectory,
  "assets",
  "audio",
  "source",
  "95262__department64__tree_creak_04.wav",
);
const outputPath = resolve(projectDirectory, "assets", "audio", "story-one-crown.wav");
const sampleRate = 44100;
const durationSeconds = 8;
const frameCount = sampleRate * durationSeconds;

function decodeWave(buffer) {
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("Expected the approved tree-creak asset to be a RIFF/WAVE file.");
  }

  let offset = 12;
  let format;
  let data;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;

    if (chunkId === "fmt ") {
      format = {
        audioFormat: buffer.readUInt16LE(chunkStart),
        channels: buffer.readUInt16LE(chunkStart + 2),
        sampleRate: buffer.readUInt32LE(chunkStart + 4),
        bitsPerSample: buffer.readUInt16LE(chunkStart + 14),
      };
    } else if (chunkId === "data") {
      data = buffer.subarray(chunkStart, chunkStart + chunkSize);
    }

    offset = chunkStart + chunkSize + (chunkSize % 2);
  }

  if (!format || !data || format.audioFormat !== 1 || ![16, 24].includes(format.bitsPerSample)) {
    throw new Error("The approved tree-creak WAV must contain 16-bit or 24-bit PCM audio.");
  }

  const bytesPerSample = format.bitsPerSample / 8;
  const sourceFrames = Math.floor(data.length / bytesPerSample / format.channels);
  const channels = Array.from({ length: format.channels }, () => new Float32Array(sourceFrames));

  for (let frame = 0; frame < sourceFrames; frame += 1) {
    for (let channel = 0; channel < format.channels; channel += 1) {
      const sampleOffset = (frame * format.channels + channel) * bytesPerSample;
      const divisor = format.bitsPerSample === 16 ? 32768 : 8388608;
      channels[channel][frame] = data.readIntLE(sampleOffset, bytesPerSample) / divisor;
    }
  }

  return { channels, sampleRate: format.sampleRate, frameCount: sourceFrames };
}

function resampleToStereo(source) {
  const outputFrames = Math.floor(source.frameCount * sampleRate / source.sampleRate);
  const left = new Float32Array(outputFrames);
  const right = new Float32Array(outputFrames);

  for (let frame = 0; frame < outputFrames; frame += 1) {
    const position = frame * source.sampleRate / sampleRate;
    const first = Math.min(Math.floor(position), source.frameCount - 1);
    const second = Math.min(first + 1, source.frameCount - 1);
    const blend = position - first;
    const read = (channelIndex) => {
      const channel = source.channels[Math.min(channelIndex, source.channels.length - 1)];
      return channel[first] + (channel[second] - channel[first]) * blend;
    };

    left[frame] = read(0);
    right[frame] = source.channels.length > 1 ? read(1) : left[frame];
  }

  return { left, right, frameCount: outputFrames };
}

function rmsGain(track, targetRms = 0.16) {
  let sumSquares = 0;
  let count = 0;
  for (let frame = 0; frame < track.frameCount; frame += 16) {
    sumSquares += (track.left[frame] ** 2 + track.right[frame] ** 2) / 2;
    count += 1;
  }
  return Math.min(targetRms / Math.max(Math.sqrt(sumSquares / count), 0.00001), 5);
}

function addCreak(output, source) {
  const startFrame = Math.round(0.18 * sampleRate);
  const sourceStart = Math.round(1 * sampleRate);
  const clipFrames = Math.min(Math.round(2.35 * sampleRate), source.frameCount - sourceStart);
  const fadeFrames = Math.round(0.18 * sampleRate);
  const normalization = rmsGain(source);

  for (let frame = 0; frame < clipFrames; frame += 1) {
    const fadeIn = Math.min(1, frame / fadeFrames);
    const fadeOut = Math.min(1, (clipFrames - 1 - frame) / fadeFrames);
    const envelope = Math.sin(Math.min(fadeIn, fadeOut) * Math.PI / 2) ** 2;
    const gain = 0.31 * normalization * envelope;
    output.left[startFrame + frame] += source.left[sourceStart + frame] * gain;
    output.right[startFrame + frame] += source.right[sourceStart + frame] * gain;
  }
}

function addTone(output, { start, duration, frequency, gain, pan = 0, pulse = 0 }) {
  const startFrame = Math.round(start * sampleRate);
  const toneFrames = Math.round(duration * sampleRate);
  const attack = Math.min(0.22, duration * 0.24);
  const release = Math.min(0.5, duration * 0.36);
  const leftGain = Math.cos((pan + 1) * Math.PI / 4);
  const rightGain = Math.sin((pan + 1) * Math.PI / 4);

  for (let frame = 0; frame < toneFrames && startFrame + frame < frameCount; frame += 1) {
    const time = frame / sampleRate;
    const remaining = duration - time;
    const envelope = Math.min(1, time / attack, remaining / release);
    const tremolo = pulse ? 0.76 + 0.24 * Math.sin(2 * Math.PI * pulse * time) : 1;
    const fundamental = Math.sin(2 * Math.PI * frequency * time);
    const paperyOvertone = 0.22 * Math.sin(2 * Math.PI * frequency * 2.01 * time + 0.4);
    const bellOvertone = 0.08 * Math.sin(2 * Math.PI * frequency * 3.98 * time + 1.1);
    const sample = (fundamental + paperyOvertone + bellOvertone) * gain * envelope * tremolo;
    output.left[startFrame + frame] += sample * leftGain;
    output.right[startFrame + frame] += sample * rightGain;
  }
}

function encodeWave(left, right) {
  let peak = 0;
  for (let frame = 0; frame < left.length; frame += 1) {
    peak = Math.max(peak, Math.abs(left[frame]), Math.abs(right[frame]));
  }
  const masterGain = peak > 0.82 ? 0.82 / peak : 1;
  const dataSize = left.length * 4;
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

  for (let frame = 0; frame < left.length; frame += 1) {
    const sampleOffset = 44 + frame * 4;
    buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, left[frame] * masterGain)) * 32767), sampleOffset);
    buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, right[frame] * masterGain)) * 32767), sampleOffset + 2);
  }

  return { buffer, peak: peak * masterGain };
}

const creak = resampleToStereo(decodeWave(await readFile(sourcePath)));
const mix = {
  left: new Float32Array(frameCount),
  right: new Float32Array(frameCount),
};

addCreak(mix, creak);

// An original ascending D-minor color: restrained pulses rise, then resolve into the bow.
addTone(mix, { start: 1.85, duration: 1.35, frequency: 146.83, gain: 0.035, pan: -0.22, pulse: 3 });
addTone(mix, { start: 2.65, duration: 1.45, frequency: 174.61, gain: 0.038, pan: 0.18, pulse: 3.2 });
addTone(mix, { start: 3.45, duration: 1.55, frequency: 220, gain: 0.04, pan: -0.1, pulse: 3.4 });
addTone(mix, { start: 4.25, duration: 1.7, frequency: 261.63, gain: 0.043, pan: 0.15, pulse: 3.6 });
addTone(mix, { start: 5.25, duration: 2.25, frequency: 293.66, gain: 0.047, pan: 0, pulse: 2.2 });
addTone(mix, { start: 5.65, duration: 1.85, frequency: 220, gain: 0.024, pan: -0.25 });
addTone(mix, { start: 5.65, duration: 1.85, frequency: 369.99, gain: 0.018, pan: 0.28 });

const encoded = encodeWave(mix.left, mix.right);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, encoded.buffer);

console.log(`Created ${outputPath}`);
console.log(`Duration: ${durationSeconds}s; sample rate: ${sampleRate}Hz; channels: 2; peak: ${encoded.peak.toFixed(3)}`);
