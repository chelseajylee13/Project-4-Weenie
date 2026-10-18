import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, "..");
const sourceDirectory = resolve(projectDirectory, "assets", "audio", "source");
const outputPath = resolve(projectDirectory, "assets", "audio", "ambient-midnight.wav");

const sources = {
  wind: "464694__branndybottle__night_wind.wav",
  flicker: "232447__mmaruska__lights-flicker-on.wav",
  spectral: "533532__saltbearer__yolk-bangin-fft.wav",
};

const sampleRate = 44100;
const durationSeconds = 36;
const frameCount = sampleRate * durationSeconds;

function decodeWave(buffer) {
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("Expected a RIFF/WAVE audio file.");
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
    throw new Error("Only 16-bit or 24-bit PCM WAV files are supported.");
  }

  const bytesPerSample = format.bitsPerSample / 8;
  const sourceFrames = Math.floor(data.length / bytesPerSample / format.channels);
  const channels = Array.from({ length: format.channels }, () => new Float32Array(sourceFrames));

  for (let frame = 0; frame < sourceFrames; frame += 1) {
    for (let channel = 0; channel < format.channels; channel += 1) {
      const sampleOffset = (frame * format.channels + channel) * bytesPerSample;
      let sample;

      if (format.bitsPerSample === 16) {
        sample = data.readInt16LE(sampleOffset) / 32768;
      } else {
        sample = data.readIntLE(sampleOffset, 3) / 8388608;
      }

      channels[channel][frame] = sample;
    }
  }

  return { channels, sampleRate: format.sampleRate, frameCount: sourceFrames };
}

function resampleToStereo(source) {
  const outputFrames = Math.floor(source.frameCount * sampleRate / source.sampleRate);
  const left = new Float32Array(outputFrames);
  const right = new Float32Array(outputFrames);

  for (let frame = 0; frame < outputFrames; frame += 1) {
    const sourcePosition = frame * source.sampleRate / sampleRate;
    const first = Math.min(Math.floor(sourcePosition), source.frameCount - 1);
    const second = Math.min(first + 1, source.frameCount - 1);
    const blend = sourcePosition - first;

    const readChannel = (channelIndex) => {
      const channel = source.channels[Math.min(channelIndex, source.channels.length - 1)];
      return channel[first] + (channel[second] - channel[first]) * blend;
    };

    left[frame] = readChannel(0);
    right[frame] = source.channels.length > 1 ? readChannel(1) : left[frame];
  }

  return { left, right, frameCount: outputFrames };
}

function rmsGain(track, targetRms = 0.18) {
  let sumSquares = 0;
  const step = 16;
  for (let frame = 0; frame < track.frameCount; frame += step) {
    sumSquares += (track.left[frame] ** 2 + track.right[frame] ** 2) / 2;
  }
  const rms = Math.sqrt(sumSquares / Math.ceil(track.frameCount / step));
  return Math.min(targetRms / Math.max(rms, 0.00001), 4);
}

function addClipCircular(output, source, options) {
  const startFrame = Math.round(options.start * sampleRate);
  const sourceStart = Math.round((options.sourceStart ?? 0) * sampleRate);
  const availableFrames = source.frameCount - sourceStart;
  const clipFrames = Math.min(Math.round(options.duration * sampleRate), availableFrames);
  const fadeFrames = Math.min(Math.round(options.fade * sampleRate), Math.floor(clipFrames / 2));
  const normalization = rmsGain(source);

  for (let clipFrame = 0; clipFrame < clipFrames; clipFrame += 1) {
    let envelope = 1;
    if (clipFrame < fadeFrames) {
      envelope = Math.sin((clipFrame / fadeFrames) * Math.PI / 2) ** 2;
    } else if (clipFrame >= clipFrames - fadeFrames) {
      envelope = Math.sin(((clipFrames - 1 - clipFrame) / fadeFrames) * Math.PI / 2) ** 2;
    }

    const outputFrame = (startFrame + clipFrame + frameCount) % frameCount;
    const sourceFrame = sourceStart + clipFrame;
    const gain = options.gain * normalization * envelope;
    output.left[outputFrame] += source.left[sourceFrame] * gain;
    output.right[outputFrame] += source.right[sourceFrame] * gain;
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

const decoded = {};
for (const [name, filename] of Object.entries(sources)) {
  decoded[name] = resampleToStereo(decodeWave(await readFile(resolve(sourceDirectory, filename))));
}

const mix = {
  left: new Float32Array(frameCount),
  right: new Float32Array(frameCount),
};

// Overlapping, circular wind placements keep the foundation continuous at the loop boundary.
for (const start of [0, 12, 24]) {
  addClipCircular(mix, decoded.wind, {
    start,
    duration: decoded.wind.frameCount / sampleRate,
    fade: 3.2,
    gain: 0.36,
  });
}

// Brief excerpts from the switch-on portion create occasional, low-level lantern flickers.
addClipCircular(mix, decoded.flicker, { start: 5.5, sourceStart: 0.25, duration: 2.6, fade: 0.35, gain: 0.065 });
addClipCircular(mix, decoded.flicker, { start: 18, sourceStart: 0.75, duration: 2.25, fade: 0.35, gain: 0.05 });
addClipCircular(mix, decoded.flicker, { start: 29, sourceStart: 1.2, duration: 2.1, fade: 0.4, gain: 0.055 });

// The spectral color is deliberately quiet and slowly faded, leaving room for future story audio.
addClipCircular(mix, decoded.spectral, { start: 2, sourceStart: 2, duration: 32, fade: 5, gain: 0.04 });

const encoded = encodeWave(mix.left, mix.right);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, encoded.buffer);

console.log(`Created ${outputPath}`);
console.log(`Duration: ${durationSeconds}s; sample rate: ${sampleRate}Hz; channels: 2; peak: ${encoded.peak.toFixed(3)}`);
