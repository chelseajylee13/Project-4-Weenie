import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SAMPLE_RATE = 44100;
const CHANNELS = 2;
const BIT_DEPTH = 16;
const outputDirectory = fileURLToPath(new URL("../assets/audio/", import.meta.url));

const cues = [
  { name: "lantern-step-1.wav", duration: 0.42, fundamental: 293.66, overtone: 440, seed: 17 },
  { name: "lantern-step-2.wav", duration: 0.46, fundamental: 349.23, overtone: 523.25, seed: 29 },
  { name: "lantern-step-3.wav", duration: 0.52, fundamental: 440, overtone: 659.25, seed: 43 },
];

function writeAscii(buffer, offset, text) {
  buffer.write(text, offset, "ascii");
}

function seededNoise(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return (state / 0xffffffff) * 2 - 1;
  };
}

function buildCue({ duration, fundamental, overtone, seed }) {
  const frameCount = Math.round(duration * SAMPLE_RATE);
  const dataSize = frameCount * CHANNELS * 2;
  const wav = Buffer.alloc(44 + dataSize);
  const noise = seededNoise(seed);

  writeAscii(wav, 0, "RIFF");
  wav.writeUInt32LE(36 + dataSize, 4);
  writeAscii(wav, 8, "WAVE");
  writeAscii(wav, 12, "fmt ");
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(CHANNELS, 22);
  wav.writeUInt32LE(SAMPLE_RATE, 24);
  wav.writeUInt32LE(SAMPLE_RATE * CHANNELS * 2, 28);
  wav.writeUInt16LE(CHANNELS * 2, 32);
  wav.writeUInt16LE(BIT_DEPTH, 34);
  writeAscii(wav, 36, "data");
  wav.writeUInt32LE(dataSize, 40);

  let peak = 0;
  for (let frame = 0; frame < frameCount; frame += 1) {
    const time = frame / SAMPLE_RATE;
    const fadeIn = Math.min(1, time / 0.008);
    const fadeOut = Math.min(1, (duration - time) / 0.04);
    const body = Math.exp(-time * 8.5);
    const woodenMode = Math.sin(2 * Math.PI * fundamental * time) * 0.12;
    const upperMode = Math.sin(2 * Math.PI * overtone * time + 0.35) * 0.055;
    const paperyClick = noise() * 0.045 * Math.exp(-time * 34);
    const sample = (woodenMode + upperMode + paperyClick) * body * fadeIn * fadeOut;
    peak = Math.max(peak, Math.abs(sample));
    const pcm = Math.round(Math.max(-1, Math.min(1, sample)) * 32767);

    for (let channel = 0; channel < CHANNELS; channel += 1) {
      wav.writeInt16LE(pcm, 44 + (frame * CHANNELS + channel) * 2);
    }
  }

  return { wav, peak, duration: frameCount / SAMPLE_RATE };
}

await mkdir(outputDirectory, { recursive: true });
for (const cue of cues) {
  const built = buildCue(cue);
  await writeFile(path.join(outputDirectory, cue.name), built.wav);
  console.log(`${cue.name}: ${built.duration.toFixed(3)}s, stereo ${SAMPLE_RATE}Hz, peak ${built.peak.toFixed(4)}`);
}
