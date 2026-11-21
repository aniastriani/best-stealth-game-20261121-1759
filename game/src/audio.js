// Every sound the game makes, synthesized with the Web Audio API — no
// audio files, no network. Footsteps tick as the courier walks, a chime
// marks a stolen scroll, a low sting marks a warden spotting you.
export function newAudio() {
  return { context: null, muted: false, stepFlip: false };
}

/** Create the audio context on the first user gesture; browsers require it. */
export function ensureAudio(audio) {
  if (audio.context) {
    if (audio.context.state === 'suspended') audio.context.resume();
    return;
  }
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return;
  audio.context = new Ctor();
}

/** One short tone: frequency, length, shape, and loudness. */
function tone(audio, freq, seconds, type, gainValue, when = 0) {
  if (!audio.context || audio.muted) return;
  const start = audio.context.currentTime + when;
  const osc = audio.context.createOscillator();
  const gain = audio.context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  osc.connect(gain);
  gain.connect(audio.context.destination);
  osc.start(start);
  osc.stop(start + seconds + 0.05);
}

export function playStep(audio, sneaking) {
  if (!audio.context || audio.muted) return;
  audio.stepFlip = !audio.stepFlip;
  tone(audio, audio.stepFlip ? 170 : 140, 0.05, 'sine', sneaking ? 0.015 : 0.05);
}

export function playPickup(audio) {
  tone(audio, 660, 0.12, 'sine', 0.09);
  tone(audio, 990, 0.18, 'sine', 0.09, 0.09);
}

export function playAlert(audio) {
  tone(audio, 220, 0.3, 'sawtooth', 0.08);
  tone(audio, 165, 0.35, 'sawtooth', 0.08, 0.12);
}

export function playPebble(audio) {
  tone(audio, 1200, 0.05, 'square', 0.04);
  tone(audio, 900, 0.06, 'square', 0.035, 0.05);
}

export function playCaught(audio) {
  tone(audio, 110, 0.5, 'sawtooth', 0.12);
  tone(audio, 82, 0.6, 'sawtooth', 0.1, 0.15);
}

export function playClear(audio) {
  tone(audio, 523, 0.14, 'sine', 0.09);
  tone(audio, 659, 0.14, 'sine', 0.09, 0.12);
  tone(audio, 784, 0.28, 'sine', 0.1, 0.24);
}
