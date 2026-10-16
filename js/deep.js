/* Deep Music — 17 professions from chrysotopdesigns/Deep-Music (3,060 skills parsed).
   Templated methodology; course map implemented here as decision rules. */
window.Aether = window.Aether || {};
(function (A) {
  "use strict";

  A.FIB = [1, 1, 2, 3, 5, 8, 13, 21, 34];

  /* Just ratios from tonic (Tuning System Archeologist). */
  A.JI_RATIOS = [1, 16 / 15, 9 / 8, 6 / 5, 5 / 4, 4 / 3, 45 / 32, 3 / 2, 8 / 5, 5 / 3, 9 / 5, 15 / 8];

  A.justHz = function (midi, tonicPc) {
    const tonic = 48 + (tonicPc % 12);
    const rel = midi - tonic;
    const oct = Math.floor(rel / 12);
    const pc = ((rel % 12) + 12) % 12;
    return A.freqFromMidi(tonic) * A.JI_RATIOS[pc] * Math.pow(2, oct);
  };

  A.silenceBar = function (bars) {
    return Math.max(2, A.goldenBar(bars) - 1);
  };

  /* Chromesthesia: hue from tonic, saturation from mode. */
  A.chromaColor = function (rootPc, scaleLabel) {
    const hue = (rootPc * 30 + 210) % 360;
    const sat = /minor|phrygian|harmonic|blues/.test(scaleLabel || "") ? 42 : 34;
    return "hsl(" + hue + " " + sat + "% 8%)";
  };

  A.DEEP_PROFESSIONS = [
    { id: "groove", name: "Beatmaker / Groove", does: "Ghost notes, swing, velocity language" },
    { id: "entrain", name: "Brainwave Entrainment", does: "Soft binaural detune on pads (not a medical claim)" },
    { id: "resonance", name: "Frequential Resonance", does: "A-weighted highs, sub warmth" },
    { id: "texture", name: "Generative Texturizer", does: "Living air / filtered noise bed" },
    { id: "micro", name: "Micro-Detail Programmer", does: "Seeded jitter, round-robin hats" },
    { id: "tension", name: "Tension & Release", does: "Silence before impact, pedal, swells" },
    { id: "microtonal", name: "Microtonal & Modal", does: "Just intonation option" },
    { id: "space", name: "Reverb & Space", does: "IR hall, pre-delay, shimmer" },
    { id: "spatial", name: "Spatial / Atmos-minded", does: "Desk panning, slow pad orbits" },
    { id: "silence", name: "Silent Space Curator", does: "Ma — rest as composition" },
    { id: "chrono", name: "Chrono-Deceptionist", does: "Nested dream-level clocks" },
    { id: "fractal", name: "Fractal Geometry", does: "Self-similar cell at 2× / ½×" },
    { id: "chaos", name: "Generative Chaos", does: "Constrained probability, never raw noise" },
    { id: "chroma", name: "Chromesthesic Mapmaker", does: "Key → background hue" },
    { id: "material", name: "Textural Materialist", does: "Weight in the low brass, air in the highs" },
    { id: "tuning", name: "Tuning Archeologist", does: "Pure 3/2 fifths when JI is on" },
    { id: "hybrid", name: "Timbral Hybridizer", does: "Piano+pad, brass+piano resonance" }
  ];

  A.defaultDeep = function (over) {
    return Object.assign({
      ji: true, nested: true, silence: true, texture: true, groove: true, fractal: true
    }, over || {});
  };

  A.attachJust = function (song) {
    const root = song.root;
    const hzOf = (m) => A.justHz(m, root);
    (song.melody || []).forEach((e) => { e.hz = hzOf(e.midi); });
    (song.bass || []).forEach((e) => { e.hz = hzOf(e.midi); });
    (song.ostinato || []).forEach((e) => { if (e.midi < 90) e.hz = hzOf(e.midi); });
    (song.chords || []).forEach((e) => { e.hzs = e.notes.map(hzOf); });
    (song.pads || []).forEach((e) => { e.hzs = e.notes.map(hzOf); });
    (song.brass || []).forEach((e) => { e.hzs = e.notes.map(hzOf); });
    song.tuning = "just";
  };

  /* Nested clocks: level-0 8ths already as ticks; add half-time and whole-time. */
  A.addNestedClocks = function (song) {
    const bars = song.bars, SPB = A.SPB;
    for (let b = 0; b < bars; b++) {
      const inten = A.catharsisCurve(b / Math.max(1, bars - 1));
      if (inten < 0.12) continue;
      song.ostinato.push({ bar: b, step: 0, midi: 36, len: 8, kind: "dreamTick", gain: 0.35 + 0.4 * inten, level: 1 });
      if (inten > 0.45) song.ostinato.push({ bar: b, step: 8, midi: 36, len: 8, kind: "dreamTick", gain: 0.25 + 0.3 * inten, level: 1 });
      if (inten > 0.62) song.ostinato.push({ bar: b, step: 0, midi: 28, len: SPB, kind: "levelTick", gain: 0.45 * inten, level: 2 });
    }
    song.nestedClocks = true;
  };

  /* Fractal diminution: same 4-note contour at double speed in the build. */
  A.addFractalCell = function (song) {
    const piano = (song.melody || []).filter((e) => e.layer === "piano" && e.bar < 8);
    if (piano.length < 8) return;
    const start = Math.floor(song.bars * 0.45);
    const end = Math.floor(song.bars * 0.82);
    for (let b = start; b < end; b++) {
      const src = piano.filter((e) => e.bar === (b % 8));
      src.forEach((n, i) => {
        song.melody.push({
          bar: b, step: n.step, midi: n.midi + 12, len: Math.max(1, n.len / 2),
          layer: "fractal", hz: n.hz ? n.hz * 2 : undefined
        });
      });
    }
    song.fractal = true;
  };

  /* Silence before impact (Tension Architect + Silent Space Curator). */
  A.applySilenceBeforeImpact = function (song) {
    const bar = A.silenceBar(song.bars);
    song.silenceBar = bar;
    const mute = (arr, pred) => {
      song[arr] = (song[arr] || []).filter((e) => !(e.bar === bar && e.step >= 8 && pred(e)));
    };
    mute("drums", () => true);
    mute("ostinato", (e) => e.kind === "tick" || e.kind === "dreamTick");
    mute("melody", (e) => e.layer !== "piano" || e.step >= 8);
    mute("brass", () => true);
    /* One empty beat of Ma on the downbeat of the next bar is already the BRAAAM entry. */
    song.ma = true;
  };

  A.addGhosts = function (song, rng) {
    const SPB = A.SPB;
    for (let b = 0; b < song.bars; b++) {
      if (song.silenceBar === b) continue;
      for (let s = 1; s < SPB; s += 2) {
        if (rng() < 0.55) song.drums.push({ bar: b, step: s, type: "hat", vel: 0.1 + rng() * 0.08, ghost: true });
      }
    }
    song.grooveGhosts = true;
  };

  A.addTexture = function (song) {
    song.texture = true;
  };

  A.applyDeep = function (song, deep, rng) {
    deep = A.defaultDeep(deep);
    song.deep = deep;
    song.swing = deep.groove ? (song.engine === "groove" ? 0.18 : 0.06) : 0;
    if (deep.nested && song.engine === "cathartic") A.addNestedClocks(song);
    if (deep.fractal && song.engine === "cathartic") A.addFractalCell(song);
    if (deep.silence && song.engine === "cathartic" && song.bars >= 16) A.applySilenceBeforeImpact(song);
    if (deep.groove && (song.drums || []).length) A.addGhosts(song, rng);
    if (deep.texture) A.addTexture(song);
    if (deep.ji) A.attachJust(song);
    else song.tuning = "12-TET";
    song.chroma = A.chromaColor(song.root, song.scaleLabel);
    song.deepActive = A.DEEP_PROFESSIONS.map((p) => p.name);
    return song;
  };
})(window.Aether);
