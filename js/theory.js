/* Aether Score — theory: scales, SATB voice-leading, first-species cells,
   partimento bass motions, instrument ranges. */
window.Aether = window.Aether || {};
(function (A) {
  "use strict";
  A.NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  A.SCALES = {
    major:      { steps: [0, 2, 4, 5, 7, 9, 11], label: "major" },
    minor:      { steps: [0, 2, 3, 5, 7, 8, 10], label: "natural minor" },
    harmonic:   { steps: [0, 2, 3, 5, 7, 8, 11], label: "harmonic minor" },
    Dorian:     { steps: [0, 2, 3, 5, 7, 9, 10], label: "Dorian" },
    Mixolydian: { steps: [0, 2, 4, 5, 7, 9, 10], label: "Mixolydian" },
    phrygian:   { steps: [0, 1, 3, 5, 7, 8, 10], label: "Phrygian" },
    lydian:     { steps: [0, 2, 4, 6, 7, 9, 11], label: "Lydian" },
    pentMajor:  { steps: [0, 2, 4, 7, 9],       label: "major pentatonic" },
    pentMinor:  { steps: [0, 3, 5, 7, 10],      label: "minor pentatonic" },
    blues:      { steps: [0, 3, 5, 6, 7, 10],   label: "blues" },
    hungarian:  { steps: [0, 2, 3, 6, 7, 8, 11], label: "Hungarian minor" },
    whole:      { steps: [0, 2, 4, 6, 8, 10],   label: "whole tone" }
  };

  /* MIDI ranges — orchestration desks (written sounding) */
  A.RANGES = {
    violin: [55, 96], viola: [48, 84], cello: [36, 72], contrabass: [28, 55],
    flute: [60, 96], horn: [41, 77], trumpet: [58, 84], trombone: [40, 72],
    tuba: [28, 55], piano: [21, 108], choir: [48, 81],
    soprano: [60, 81], alto: [55, 72], tenor: [48, 64], bass: [36, 55]
  };

  A.pc = (midi) => ((midi % 12) + 12) % 12;
  A.degreePc = (root, scale, deg) => {
    const st = scale.steps;
    const n = st.length;
    const o = Math.floor(deg / n);
    const i = ((deg % n) + n) % n;
    return (root + st[i] + 12 * o) % 12;
  };
  A.chordTones = (root, scale, deg, seventh) => {
    const st = scale.steps, n = st.length;
    const pcs = [0, 2, 4].map((k) => {
      const d = deg + k;
      return (root + st[((d % n) + n) % n] + 12 * Math.floor(d / n)) % 12;
    });
    if (seventh) {
      const d = deg + 6;
      pcs.push((root + st[((d % n) + n) % n]) % 12);
    }
    return pcs;
  };

  A.triadQuality = (root, scale, deg) => {
    const st = scale.steps, n = st.length;
    const a = st[((deg % n) + n) % n];
    const third = st[(((deg + 2) % n) + n) % n];
    const fifth = st[(((deg + 4) % n) + n) % n];
    const t = (third - a + 12) % 12, f = (fifth - a + 12) % 12;
    if (t === 3 && f === 6) return "dim";
    if (t === 4 && f === 8) return "aug";
    if (t === 3) return "m";
    return "";
  };

  A.roman = (root, scale, deg) => {
    const name = A.NOTE_NAMES[(root + scale.steps[((deg % scale.steps.length) + scale.steps.length) % scale.steps.length]) % 12];
    return name + A.triadQuality(root, scale, deg);
  };

  /* Nearest MIDI of pitch-class in [lo, hi] to prev */
  A.nearestPc = (pc, prev, lo, hi) => {
    let best = lo, bd = 99;
    for (let m = lo; m <= hi; m++) {
      if (A.pc(m) !== pc) continue;
      const d = prev == null ? Math.abs(m - (lo + hi) / 2) : Math.abs(m - prev);
      if (d < bd) { bd = d; best = m; }
    }
    return best;
  };

  /* SATB voice-leading: keep common tones, step the rest, forbid parallel 5/8. */
  A.voiceLead = (prevVoices, pcs, ranges) => {
    const order = ["bass", "tenor", "alto", "soprano"];
    const voices = {};
    const used = [];
    const pickPc = (i) => pcs[i % pcs.length];

    /* Assign bass first — prefer chord root (pcs[0]) */
    const bassPc = pcs[0];
    voices.bass = A.nearestPc(bassPc, prevVoices ? prevVoices.bass : null, ranges.bass[0], ranges.bass[1]);
    used.push(A.pc(voices.bass));

    const rest = ["tenor", "alto", "soprano"];
    rest.forEach((v, i) => {
      const prev = prevVoices ? prevVoices[v] : null;
      let cand = [];
      pcs.forEach((p) => {
        cand.push(A.nearestPc(p, prev, ranges[v][0], ranges[v][1]));
      });
      cand.sort((a, b) => {
        const da = prev == null ? 0 : Math.abs(a - prev);
        const db = prev == null ? 0 : Math.abs(b - prev);
        return da - db;
      });
      let chosen = cand[0];
      if (prevVoices) {
        for (let k = 0; k < cand.length; k++) {
          const m = cand[k];
          const par = parallel(prevVoices.bass, voices.bass, prevVoices[v], m);
          if (!par) { chosen = m; break; }
        }
      }
      voices[v] = chosen;
    });

    /* Keep soprano above alto above tenor above bass when possible */
    if (voices.tenor < voices.bass + 3) voices.tenor += 12;
    if (voices.alto < voices.tenor) voices.alto += 12;
    if (voices.soprano < voices.alto) voices.soprano += 12;
    voices.soprano = A.clamp(voices.soprano, ranges.soprano[0], ranges.soprano[1]);
    voices.alto = A.clamp(voices.alto, ranges.alto[0], ranges.alto[1]);
    voices.tenor = A.clamp(voices.tenor, ranges.tenor[0], ranges.tenor[1]);
    voices.bass = A.clamp(voices.bass, ranges.bass[0], ranges.bass[1]);
    return voices;
  };

  function parallel(b0, b1, v0, v1) {
    if (b0 == null || v0 == null) return false;
    const i0 = Math.abs(v0 - b0) % 12;
    const i1 = Math.abs(v1 - b1) % 12;
    const sameDir = (v1 - v0) * (b1 - b0) > 0 && (v1 - v0) !== 0;
    return sameDir && (i0 === 7 && i1 === 7 || i0 === 0 && i1 === 0);
  }

  A.countParallels = (chain) => {
    let n = 0;
    for (let i = 1; i < chain.length; i++) {
      const a = chain[i - 1], b = chain[i];
      ["tenor", "alto", "soprano"].forEach((v) => {
        if (parallel(a.bass, b.bass, a[v], b[v])) n++;
      });
    }
    return n;
  };

  A.motionSemitones = (chain) => {
    if (chain.length < 2) return 0;
    let s = 0, c = 0;
    for (let i = 1; i < chain.length; i++) {
      ["bass", "tenor", "alto", "soprano"].forEach((v) => {
        s += Math.abs(chain[i][v] - chain[i - 1][v]);
        c++;
      });
    }
    return c ? s / c : 0;
  };

  /* First-species cell: one chord-tone per beat, mostly steps, strong-beat chord tones. */
  A.firstSpeciesCell = (voicesPerBar, scaleNotes, rng) => {
    const notes = [];
    let idx = Math.floor(scaleNotes.length * 0.55);
    voicesPerBar.forEach((v) => {
      const chord = [v.soprano, v.alto, v.tenor, v.bass];
      for (let beat = 0; beat < 4; beat++) {
        const strong = beat % 2 === 0;
        const leap = rng() < (strong ? 0.08 : 0.18);
        idx += leap ? (rng() < 0.5 ? -3 : 3) : (rng() < 0.5 ? -1 : 1);
        idx = A.clamp(idx, 2, scaleNotes.length - 3);
        let midi = scaleNotes[idx];
        if (strong) {
          let best = midi, bd = 99;
          chord.forEach((c) => {
            scaleNotes.forEach((sn, i) => {
              if (A.pc(sn) === A.pc(c) && Math.abs(sn - midi) < bd) {
                bd = Math.abs(sn - midi); best = sn; idx = i;
              }
            });
          });
          midi = best;
        }
        notes.push({ beat, midi, idx });
      }
    });
    return notes;
  };

  /* Partimento-style bass motions over a degree sequence */
  A.bassMotion = (rootMidi, kind) => {
    if (kind === "drone") return [rootMidi];
    if (kind === "root5") return [rootMidi, rootMidi + 7];
    if (kind === "walk") return [rootMidi, rootMidi + 2, rootMidi + 4, rootMidi + 5, rootMidi + 7, rootMidi + 5, rootMidi + 4, rootMidi];
    return [rootMidi, rootMidi];
  };

  A.scaleNotes = (root, scale, from, octaves) => {
    const out = [];
    for (let o = 0; o < octaves; o++) scale.steps.forEach((s) => out.push(from + o * 12 + s));
    return out;
  };
})(window.Aether);
