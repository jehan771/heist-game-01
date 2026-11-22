// The Copper Chip — WebAudio synth. No audio files: every sound is a
// small oscillator envelope. Mute toggles with M.
export function createAudio() {
  let ctx = null;
  let muted = false;
  function ensure() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        ctx = null;
      }
    }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type, vol, when = 0, slideTo = null) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }
  return {
    get muted() { return muted; },
    toggleMute() { muted = !muted; return muted; },
    unlock() { ensure(); },
    step() { tone(180, 0.06, "triangle", 0.03); },
    pickup() { tone(880, 0.12, "sine", 0.12); tone(1318, 0.18, "sine", 0.1, 0.07); },
    safeClick() { tone(1200, 0.05, "square", 0.06); },
    safeOpen() { tone(523, 0.15, "sine", 0.12); tone(659, 0.15, "sine", 0.12, 0.1); tone(784, 0.25, "sine", 0.12, 0.2); },
    hack() { tone(440, 0.1, "square", 0.07); tone(660, 0.1, "square", 0.07, 0.09); tone(880, 0.16, "square", 0.07, 0.18); },
    cameraBeep() { tone(1568, 0.08, "square", 0.05); },
    alarm() { tone(620, 0.5, "sawtooth", 0.09, 0, 930); },
    caught() { tone(220, 0.4, "sawtooth", 0.14, 0, 110); tone(110, 0.5, "sawtooth", 0.12, 0.15, 55); },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, "triangle", 0.12, i * 0.12));
    },
    target() { tone(1047, 0.2, "sine", 0.12); tone(1568, 0.35, "sine", 0.1, 0.12); },
  };
}
