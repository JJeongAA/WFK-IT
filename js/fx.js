/* =========================================================
 * fx.js — 몰입감 엔진: 합성 효과음(Web Audio) + 햅틱 + 화면 흔들림
 *   외부 오디오 파일 없이 실시간 합성 → 오프라인·경량 유지
 * ======================================================= */
window.FX = (function () {
  "use strict";
  let ctx = null, enabled = true, noiseBuf = null;

  function AC() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function setEnabled(v) { enabled = v; if (!v) sizzleStop(); }

  function noise() {
    if (noiseBuf) return noiseBuf;
    const c = AC();
    const b = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    noiseBuf = b;
    return b;
  }

  function tone(freq, dur, type, vol) {
    if (!enabled) return;
    try {
      const c = AC(), t = c.currentTime;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type || "sine"; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.18, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(c.destination);
      o.start(t); o.stop(t + dur + 0.02);
    } catch (e) {}
  }

  // 칼질: 슥(고역 노이즈) + 텅(도마에 닿는 저음 타격)
  function chop() {
    if (!enabled) return;
    try {
      const c = AC(), t = c.currentTime;
      const src = c.createBufferSource(); src.buffer = noise();
      const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2600;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.5, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
      src.connect(hp).connect(g).connect(c.destination);
      src.start(t); src.stop(t + 0.13);
      const o = c.createOscillator(); o.type = "sine";
      o.frequency.setValueAtTime(170, t);
      o.frequency.exponentialRampToValueAtTime(60, t + 0.09);
      const g2 = c.createGain();
      g2.gain.setValueAtTime(0.45, t);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      o.connect(g2).connect(c.destination);
      o.start(t); o.stop(t + 0.16);
    } catch (e) {}
  }

  // 지글지글(볶음/구이) — 세기 조절 가능한 연속 노이즈
  let sizzle = null;
  function sizzleStart() {
    if (!enabled || sizzle) return;
    try {
      const c = AC();
      const src = c.createBufferSource(); src.buffer = noise(); src.loop = true;
      const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 5200; bp.Q.value = 0.6;
      const g = c.createGain(); g.gain.value = 0.0;
      src.connect(bp).connect(g).connect(c.destination);
      src.start();
      sizzle = { src, g, bp };
    } catch (e) {}
  }
  function sizzleLevel(v) {
    if (!sizzle) return;
    try { sizzle.g.gain.setTargetAtTime(0.13 * Math.max(0, Math.min(1.4, v)), AC().currentTime, 0.06); } catch (e) {}
  }
  function sizzleStop() {
    if (!sizzle) return;
    try {
      sizzle.g.gain.setTargetAtTime(0, AC().currentTime, 0.05);
      const s = sizzle.src; setTimeout(() => { try { s.stop(); } catch (e) {} }, 220);
    } catch (e) {}
    sizzle = null;
  }

  // 보글보글(끓임) 물방울
  function bubble() { tone(180 + Math.random() * 160, 0.1, "sine", 0.12); }
  // 물/양념 붓기
  function pour() {
    if (!enabled) return;
    try {
      const c = AC(), t = c.currentTime;
      const src = c.createBufferSource(); src.buffer = noise();
      const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 900; bp.Q.value = 1.2;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.22, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      src.connect(bp).connect(g).connect(c.destination);
      src.start(t); src.stop(t + 0.4);
    } catch (e) {}
  }
  function ding(f) { tone(f || 880, 0.14, "sine", 0.2); }
  function success() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.32, "sine", 0.18), i * 95));
  }
  function fail() { tone(200, 0.25, "square", 0.2); setTimeout(() => tone(150, 0.3, "square", 0.18), 120); }

  // 진동(모바일 햅틱)
  function vibrate(p) { if (enabled && navigator.vibrate) { try { navigator.vibrate(p); } catch (e) {} } }

  // 화면 흔들림
  function shake(el, intensity) {
    if (!el) return;
    el.style.setProperty("--shk", (intensity || 1));
    el.classList.remove("fx-shake"); void el.offsetWidth; el.classList.add("fx-shake");
    setTimeout(() => el.classList.remove("fx-shake"), 380);
  }

  return {
    setEnabled, tone, chop, sizzleStart, sizzleLevel, sizzleStop,
    bubble, pour, ding, success, fail, vibrate, shake,
  };
})();
