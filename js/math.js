/* Aether Score — physics, calculus, psychoacoustics
   Equal temperament, harmonic series, inharmonicity, Shepard envelopes,
   logistic tension, Sethares-style roughness, loudness, golden-ratio form. */
window.Aether = window.Aether || {};
(function (A) {
  "use strict";
  const TAU = Math.PI * 2;
  const PHI = (1 + Math.sqrt(5)) / 2;
  const LOG2 = Math.log(2);

  A.PHI = PHI;
  A.TAU = TAU;

  A.clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  A.lerp = (a, b, t) => a + (b - a) * t;
  A.smoothstep = (e0, e1, x) => {
    const t = A.clamp((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  };
  A.logistic = (x, k, x0) => 1 / (1 + Math.exp(-k * (x - x0)));

  /* f = 440 · 2^((m−69)/12)  — 12-TET, A4 = 440 Hz */
  A.freqFromMidi = (m) => 440 * Math.pow(2, (m - 69) / 12);
  A.midiFromFreq = (f) => 69 + 12 * Math.log(f / 440) / LOG2;

  /* Stretched piano partials: f_n = n f0 √(1 + B n²)  (Fletcher) */
  A.inharmonicPartial = (f0, n, B) => n * f0 * Math.sqrt(1 + (B || 0.00032) * n * n);

  /* Ideal harmonic series amplitudes ~ 1/n^p (p≈1 bowed, p≈1.5 struck) */
  A.harmonicAmp = (n, p) => 1 / Math.pow(n, p || 1.2);

  /* Shepard octave envelope: Gaussian in log-frequency
     A(f) = exp( −½ ((log2(f/fC))/σ)² ) */
  A.shepardAmp = (f, center, sigma) => {
    const x = Math.log(f / center) / LOG2;
    return Math.exp(-0.5 * (x / (sigma || 0.85)) * (x / (sigma || 0.85)));
  };

  /* Form position 0..1 → intensity 0..1
     Rise as a logistic centered near φ⁻¹, collapse after the golden cut. */
  A.catharsisCurve = (x) => {
    const rise = A.logistic(x, 10, 0.38);
    const fall = x < 0.82 ? 1 : Math.exp(-14 * (x - 0.82));
    const afterglow = x > 0.9 ? 0.22 * Math.exp(-8 * (x - 0.9)) : 0;
    return A.clamp(rise * fall + afterglow, 0.04, 1);
  };

  /* Golden-ratio climax index */
  A.goldenBar = (bars) => Math.max(1, Math.round(bars / PHI));

  /* Plomp–Levelt / Sethares roughness between two partials (simplified) */
  A.roughnessPair = (f1, a1, f2, a2) => {
    const fmin = Math.min(f1, f2), fmax = Math.max(f1, f2);
    const cb = 1.72 * Math.pow(fmin, 0.65); /* critical-band Hz, approx */
    const x = Math.abs(fmax - fmin) / Math.max(cb, 1);
    const s = Math.exp(-3.5 * x) - Math.exp(-5.7 * x);
    return a1 * a2 * Math.max(0, s);
  };

  A.chordRoughness = (midis) => {
    let s = 0, n = 0;
    const partials = [];
    midis.forEach((m) => {
      const f0 = A.freqFromMidi(m);
      for (let k = 1; k <= 6; k++) partials.push({ f: f0 * k, a: 1 / k });
    });
    for (let i = 0; i < partials.length; i++) {
      for (let j = i + 1; j < partials.length; j++) {
        s += A.roughnessPair(partials[i].f, partials[i].a, partials[j].f, partials[j].a);
        n++;
      }
    }
    return n ? s / n : 0;
  };

  /* A-weighting dB (IEC 61672) — used to duck piercing highs */
  A.aWeightDb = (f) => {
    const f2 = f * f;
    const num = 12194 ** 2 * f2 * f2;
    const den =
      (f2 + 20.6 ** 2) *
      Math.sqrt((f2 + 107.7 ** 2) * (f2 + 737.9 ** 2)) *
      (f2 + 12194 ** 2);
    return 20 * Math.log10(num / den) + 2.0;
  };

  /* Interval tension (register-weighted). Unison/5th/oct low; tritone/m2 high. */
  const IC_TENSION = { 0: 0.05, 1: 0.95, 2: 0.55, 3: 0.35, 4: 0.28, 5: 0.22, 6: 0.9 };
  A.intervalTension = (a, b) => {
    const ic = Math.min((a - b + 1200) % 12, (b - a + 1200) % 12);
    const reg = A.clamp((Math.min(a, b) - 40) / 40, 0, 1);
    return (IC_TENSION[ic] || 0.4) * (0.7 + 0.3 * (1 - reg));
  };

  A.mean = (arr) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0);
  A.corr = (a, b) => {
    const n = Math.min(a.length, b.length);
    if (n < 3) return 0;
    const ma = A.mean(a.slice(0, n)), mb = A.mean(b.slice(0, n));
    let num = 0, da = 0, db = 0;
    for (let i = 0; i < n; i++) {
      const x = a[i] - ma, y = b[i] - mb;
      num += x * y; da += x * x; db += y * y;
    }
    return da * db ? num / Math.sqrt(da * db) : 0;
  };
})(window.Aether);
