/* Aether Score — composition + critic.
   Cathartic ostinato (Inception-level architecture, original material):
   fixed 8-bar harmonic capsule, first-species piano cell, additive desks,
   logistic/φ intensity, SATB voice-leading. Other styles reuse the same desks. */
window.Aether = window.Aether || {};
(function (A) {
  "use strict";

  function hashSeed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  A.hashSeed = hashSeed;
  A.mulberry32 = mulberry32;

  const ADJ = ["Midnight","Velvet","Iron","Golden","Hollow","Crimson","Silent","Obsidian","Silver","Amber","Glass","Quiet","Wandering","Neon","Broken","Astral","Hidden","Solar"];
  const NOUN = ["Cathedral","Horizon","Oath","Cipher","Empire","Tide","Spire","Harbour","Compass","Machine","Meadow","Signal","Mirror","River","Garden","Theorem","Orbit","Lattice"];

  /* Dual-tonic plagal capsules — TECHNIQUE of Time, not its copyrighted cell.
     Degrees in natural/harmonic minor: 0=i 2=III 3=iv 4=v 5=VI 6=VII */
  const CATHARTIC_PALETTES = [
    [0, 4, 6, 3, 0, 2, 6, 3],
    [0, 5, 2, 6, 0, 3, 5, 4],
    [3, 0, 2, 6, 3, 5, 2, 6],
    [0, 6, 5, 4, 0, 5, 2, 6],
    [0, 3, 4, 0, 0, 5, 3, 4]
  ];

  A.STYLES = {
    catharsis:   { label: "Catharsis — Inception architecture", engine: "cathartic", scales: ["minor", "harmonic", "Dorian"], tempo: [58, 72], roots: [9, 2, 4], weird: 0.08, lead: "piano", drums: "taiko", ost: "tick", pad: "strings", brass: "braam", bass: "drone", dens: 0.34, form: true },
    zInception:  { label: "Dream Heist", engine: "cathartic", scales: ["harmonic", "minor"], tempo: [64, 84], roots: [9, 2, 4], weird: 0.12, lead: "piano", drums: "taiko", ost: "tick", pad: "strings", brass: "braam", bass: "drone", dens: 0.3, form: true },
    zTime:       { label: "Building Time", engine: "cathartic", scales: ["minor", "Dorian"], tempo: [58, 72], roots: [9, 2], weird: 0.06, lead: "piano", drums: "taiko", ost: "motifPulse", pad: "strings", brass: "horn", bass: "drone", dens: 0.38, form: true },
    zInterstellar:{label: "Docking", engine: "cathartic", scales: ["lydian", "major", "Dorian"], tempo: [46, 68], roots: [0, 5, 9], weird: 0.1, lead: "piano", drums: "sparse", ost: "organPulse", pad: "organ", brass: "horn", bass: "drone", dens: 0.26, form: true },
    zPirates:    { label: "Adventure", engine: "cathartic", scales: ["Dorian", "minor"], tempo: [108, 136], roots: [2, 9, 7], weird: 0.2, lead: "strings", drums: "taiko", ost: "stringRun", pad: "strings", brass: "fanfare", bass: "root5", dens: 0.58, form: true },
    zGladiator:  { label: "Arena", engine: "cathartic", scales: ["minor", "phrygian"], tempo: [78, 108], roots: [9, 4], weird: 0.18, lead: "horn", drums: "taiko", ost: "twoNote", pad: "choir", brass: "fanfare", bass: "drone", dens: 0.42, form: true },
    zDarkKnight: { label: "Two-Note", engine: "cathartic", scales: ["minor", "phrygian"], tempo: [70, 96], roots: [9, 4, 1], weird: 0.22, lead: "cello", drums: "industrial", ost: "twoNote", pad: "pad", brass: "braam", bass: "reese", dens: 0.2, form: true },
    zDunkirk:    { label: "Tension", engine: "cathartic", scales: ["minor", "phrygian"], tempo: [90, 118], roots: [9, 2], weird: 0.25, lead: "strings", drums: "tickKit", ost: "shepard", pad: "pad", brass: "horn", bass: "drone", dens: 0.16, form: true },
    epicTrailer: { label: "Epic Trailer", engine: "cathartic", scales: ["harmonic", "hungarian"], tempo: [80, 108], roots: [9, 2, 4], weird: 0.2, lead: "choir", drums: "trailer", ost: "tick", pad: "choir", brass: "braam", bass: "drone", dens: 0.28, form: true },
    orchestral:  { label: "Orchestral", engine: "cathartic", scales: ["major", "minor", "lydian"], tempo: [72, 112], roots: [0, 7, 9], weird: 0.16, lead: "strings", drums: "taiko", ost: "stringRun", pad: "strings", brass: "fanfare", bass: "root5", dens: 0.5, form: true },
    synthwave:   { label: "Synthwave", engine: "groove", scales: ["minor", "Dorian"], tempo: [96, 118], roots: [9, 2, 4], weird: 0.18, lead: "synth", drums: "house", ost: "arp", pad: "pad", brass: "none", bass: "reese", dens: 0.52, form: false, prog: [[0, 5, 3, 4], [0, 6, 3, 4]] },
    house:       { label: "House / EDM", engine: "groove", scales: ["minor", "Dorian"], tempo: [118, 128], roots: [9, 0, 5], weird: 0.12, lead: "synth", drums: "house", ost: "arp", pad: "pad", brass: "none", bass: "pump", dens: 0.5, form: false, prog: [[0, 5, 3, 4]] },
    pop:         { label: "Pop anthem", engine: "groove", scales: ["major", "pentMajor"], tempo: [96, 122], roots: [0, 5, 7], weird: 0.1, lead: "piano", drums: "pop", ost: "none", pad: "pad", brass: "none", bass: "root5", dens: 0.6, form: false, prog: [[0, 4, 5, 3], [0, 5, 3, 4]] },
    trap:        { label: "Trap", engine: "groove", scales: ["pentMinor", "minor"], tempo: [68, 84], roots: [9, 2], weird: 0.2, lead: "synth", drums: "trap", ost: "none", pad: "pad", brass: "none", bass: "eight", dens: 0.4, form: false, prog: [[0, 0, 5, 5]] },
    dnb:         { label: "Drum & Bass", engine: "groove", scales: ["minor", "Dorian"], tempo: [168, 176], roots: [9, 2], weird: 0.25, lead: "synth", drums: "dnb", ost: "arp", pad: "pad", brass: "none", bass: "reese", dens: 0.52, form: false, prog: [[0, 5, 3, 4]] },
    lofi:        { label: "Lo-fi", engine: "groove", scales: ["Dorian", "major"], tempo: [72, 90], roots: [2, 0, 9], weird: 0.26, lead: "piano", drums: "lofi", ost: "none", pad: "pad", brass: "none", bass: "root5", dens: 0.46, form: false, prog: [[0, 4, 5, 3]] },
    jazz:        { label: "Jazz", engine: "groove", scales: ["Dorian", "Mixolydian"], tempo: [92, 148], roots: [2, 7, 9], weird: 0.4, lead: "piano", drums: "jazz", ost: "none", pad: "none", brass: "horn", bass: "walk", dens: 0.68, form: false, prog: [[1, 4, 0, 0], [1, 4, 5, 0]] },
    rock:        { label: "Rock", engine: "groove", scales: ["minor", "pentMinor", "blues"], tempo: [108, 148], roots: [9, 7, 0], weird: 0.18, lead: "guitar", drums: "rock", ost: "none", pad: "none", brass: "none", bass: "root5", dens: 0.56, form: false, prog: [[0, 5, 3, 4]] },
    cyberpunk:   { label: "Cyberpunk", engine: "groove", scales: ["phrygian", "harmonic"], tempo: [100, 128], roots: [9, 4, 1], weird: 0.38, lead: "square", drums: "industrial", ost: "arp", pad: "pad", brass: "none", bass: "reese", dens: 0.5, form: false, prog: [[0, 1, 3, 4]] },
    ambient:     { label: "Ambient", engine: "cathartic", scales: ["lydian", "major", "Dorian"], tempo: [48, 70], roots: [0, 5, 9], weird: 0.28, lead: "pad", drums: "none", ost: "none", pad: "pad", brass: "none", bass: "drone", dens: 0.2, form: true },
    reggaeton:   { label: "Reggaeton", engine: "groove", scales: ["minor", "Dorian"], tempo: [88, 100], roots: [9, 2, 0], weird: 0.16, lead: "synth", drums: "dembow", ost: "none", pad: "pad", brass: "none", bass: "root5", dens: 0.5, form: false, prog: [[0, 5, 3, 4]] },
    afrobeat:    { label: "Afrobeat", engine: "groove", scales: ["major", "Mixolydian"], tempo: [104, 122], roots: [0, 7, 5], weird: 0.2, lead: "guitar", drums: "afro", ost: "none", pad: "none", brass: "horn", bass: "root5", dens: 0.58, form: false, prog: [[0, 4, 5, 0]] },
    rnb:         { label: "R&B", engine: "groove", scales: ["Dorian", "minor"], tempo: [78, 102], roots: [9, 2, 0], weird: 0.26, lead: "piano", drums: "rnb", ost: "none", pad: "pad", brass: "none", bass: "root5", dens: 0.5, form: false, prog: [[0, 5, 3, 4]] },
    folk:        { label: "Folk / Medieval", engine: "groove", scales: ["Dorian", "Mixolydian"], tempo: [84, 118], roots: [2, 7, 0], weird: 0.18, lead: "harp", drums: "folk", ost: "droneFifth", pad: "none", brass: "none", bass: "drone", dens: 0.52, form: false, prog: [[0, 6, 0, 4]] },
    blues:       { label: "Blues", engine: "groove", scales: ["blues", "pentMinor"], tempo: [72, 108], roots: [9, 4, 0], weird: 0.22, lead: "guitar", drums: "rock", ost: "none", pad: "none", brass: "horn", bass: "walk", dens: 0.55, form: false, prog: [[0, 0, 3, 0], [0, 3, 4, 0]] },
    happy:       { label: "Happy", engine: "groove", scales: ["major", "pentMajor"], tempo: [100, 128], roots: [0, 5, 7], weird: 0.14, lead: "piano", drums: "pop", ost: "none", pad: "pad", brass: "none", bass: "root5", dens: 0.58, form: false, prog: [[0, 4, 5, 3]] },
    dreamy:      { label: "Dreamy", engine: "cathartic", scales: ["major", "lydian", "Dorian"], tempo: [60, 86], roots: [0, 5, 9], weird: 0.22, lead: "bell", drums: "sparse", ost: "none", pad: "pad", brass: "none", bass: "drone", dens: 0.36, form: true },
    melancholy:  { label: "Melancholy", engine: "cathartic", scales: ["minor", "Dorian"], tempo: [64, 90], roots: [9, 4, 2], weird: 0.16, lead: "cello", drums: "sparse", ost: "none", pad: "strings", brass: "horn", bass: "drone", dens: 0.4, form: true },
    chill:       { label: "Chill", engine: "groove", scales: ["Dorian", "pentMinor"], tempo: [64, 88], roots: [2, 9, 5], weird: 0.26, lead: "pluck", drums: "lofi", ost: "none", pad: "pad", brass: "none", bass: "root5", dens: 0.44, form: false, prog: [[0, 4, 5, 3]] },
    spooky:      { label: "Spooky", engine: "cathartic", scales: ["harmonic", "phrygian", "hungarian"], tempo: [56, 86], roots: [9, 1, 4], weird: 0.5, lead: "organ", drums: "sparse", ost: "tick", pad: "choir", brass: "braam", bass: "drone", dens: 0.32, form: true },
    random:      { label: "Chaos", engine: "groove", scales: Object.keys(A.SCALES), tempo: [52, 176], roots: [0, 2, 4, 5, 7, 9], weird: 0.65, lead: "synth", drums: "house", ost: "arp", pad: "pad", brass: "braam", bass: "reese", dens: 0.52, form: false, prog: null }
  };

  const SPB = 16; /* 16th grid */
  A.SPB = SPB;

  function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
  function chance(rng, p) { return rng() < p; }

  function fillDrums(drums, kit, b, bars, inten, rng) {
    const add = (step, type, vel) => drums.push({ bar: b, step, type, vel: vel ?? 1 });
    if (kit === "none") return;
    if (kit === "house") {
      for (let s = 0; s < SPB; s += 4) add(s, "kick");
      add(4, "clap"); add(12, "clap");
      for (let s = 0; s < SPB; s += 2) add(s, "hat", s % 4 === 2 ? 0.85 : 0.4);
    } else if (kit === "trap") {
      add(0, "kick"); if (chance(rng, 0.55)) add(3, "kick"); add(8, "kick"); add(8, "snare");
      for (let s = 0; s < SPB; s++) if (s % 2) add(s, "hat", 0.3);
    } else if (kit === "dnb") {
      add(0, "kick"); add(10, "kick"); add(8, "snare");
      for (let s = 0; s < SPB; s++) add(s, "hat", 0.25);
    } else if (kit === "rock") {
      add(0, "kick"); add(8, "kick"); add(4, "snare"); add(12, "snare");
      for (let s = 0; s < SPB; s += 2) add(s, "hat", 0.5);
    } else if (kit === "pop") {
      add(0, "kick"); add(8, "kick"); add(4, "clap"); add(12, "clap");
      for (let s = 0; s < SPB; s += 2) add(s, "hat", 0.38);
    } else if (kit === "lofi") {
      add(0, "kick"); if (chance(rng, 0.5)) add(6, "kick", 0.65); add(8, "snare");
      for (let s = 0; s < SPB; s += 2) add(s, "hat", 0.26);
    } else if (kit === "jazz") {
      add(0, "kick", 0.45); add(8, "snare", 0.4);
      for (let s = 0; s < SPB; s += 2) add(s, "ride", 0.32);
    } else if (kit === "taiko") {
      if (inten < 0.25) { if (b % 2 === 0) add(0, "taiko", 0.45); }
      else { add(0, "taiko", 0.55 + 0.4 * inten); if (inten > 0.55) add(8, "taiko", 0.4); if (inten > 0.75) add(12, "taiko", 0.3); }
    } else if (kit === "trailer") {
      add(0, "boom", 0.4 + 0.5 * inten);
      if (inten > 0.4) { add(8, "snare", 0.4); }
      if (inten > 0.75) { add(0, "crash"); add(8, "boom", 0.6); }
    } else if (kit === "industrial") {
      add(0, "kick"); add(8, "snare"); if (chance(rng, 0.4)) add(4, "kick", 0.55);
      for (let s = 0; s < SPB; s++) if (chance(rng, 0.4)) add(s, "hat", 0.18);
    } else if (kit === "tickKit") {
      for (let s = 0; s < SPB; s++) add(s, "tick", 0.4 + 0.4 * (s % 4 === 0));
      if (inten > 0.7) add(0, "boom");
    } else if (kit === "dembow") {
      add(0, "kick"); add(6, "kick"); add(8, "snare"); add(12, "snare");
      for (let s = 0; s < SPB; s += 2) add(s, "hat", 0.32);
    } else if (kit === "afro") {
      add(0, "kick"); add(6, "kick"); add(10, "kick"); add(4, "snare", 0.45); add(12, "clap");
      for (let s = 0; s < SPB; s++) if (s % 2) add(s, "shaker", 0.35);
    } else if (kit === "rnb") {
      add(0, "kick"); add(7, "kick", 0.65); add(8, "snare");
      for (let s = 0; s < SPB; s += 2) add(s, "hat", 0.28);
    } else if (kit === "folk") {
      add(0, "kick", 0.45); add(8, "snare", 0.35);
    } else if (kit === "sparse") {
      if (b % 2 === 0) add(0, "kick", 0.4);
      if (chance(rng, 0.35)) add(8, "snare", 0.28);
    }
  }

  function composeCathartic(rng, p, st) {
    const scale = A.SCALES[(st.scales.includes("minor") && rng() < 0.72) ? "minor" : pick(rng, st.scales)];
    const root = pick(rng, st.roots) % 12;
    const bars = p.bars;
    const pal = CATHARTIC_PALETTES[Math.floor(rng() * CATHARTIC_PALETTES.length)].slice();
    const notes = A.scaleNotes(root, scale, 48 + root, 4);
    const ranges = A.RANGES;
    const chain = [];
    let prev = null;
    const progDegrees = [];
    for (let b = 0; b < bars; b++) {
      const deg = pal[b % pal.length];
      progDegrees.push(deg);
      const pcs = A.chordTones(root, scale, deg, true);
      const v = A.voiceLead(prev, pcs, ranges);
      chain.push(v);
      prev = v;
    }

    /* One 8-bar first-species module, then lock it (cathartic ostinato). */
    const moduleBars = Math.min(8, bars);
    const cell = A.firstSpeciesCell(chain.slice(0, moduleBars), notes, rng);
    const melody = [];
    const cello = [];
    for (let b = 0; b < bars; b++) {
      const x = b / Math.max(1, bars - 1);
      const inten = A.catharsisCurve(x);
      const srcBar = b % moduleBars;
      const slice = cell.slice(srcBar * 4, srcBar * 4 + 4);
      slice.forEach((n, i) => {
        /* Piano cell always speaks — Time starts on the first attack, not on silence. */
        melody.push({ bar: b, step: i * 4, midi: n.midi, len: 4, layer: "piano" });
      });
      /* cello theme: half notes on chord 3rd / 5th, enters mid-rise */
      if (inten > 0.28) {
        const v = chain[b];
        cello.push({ bar: b, step: 0, midi: v.tenor, len: 8, layer: "cello" });
        cello.push({ bar: b, step: 8, midi: v.alto, len: 8, layer: "cello" });
      }
    }

    const bass = [], chords = [], drums = [], ostinato = [], pads = [], brass = [];
    const layers = p.layers;
    for (let b = 0; b < bars; b++) {
      const x = b / Math.max(1, bars - 1);
      const inten = A.catharsisCurve(x) * p.intensity;
      const v = chain[b];
      const tones = [v.bass, v.tenor, v.alto, v.soprano];
      chords.push({ bar: b, step: 0, notes: tones, len: SPB, voicing: "pad" });

      if (layers.bass) {
        bass.push({ bar: b, step: 0, midi: v.bass - (v.bass > 48 ? 12 : 0), len: SPB, kind: st.bass === "reese" ? "reese" : "drone" });
      }
      if (layers.pads && inten > 0.12) {
        pads.push({ bar: b, step: 0, notes: [v.bass, v.tenor, v.alto], len: SPB, kind: st.pad, gain: 0.4 + 0.6 * inten });
      }
      if (layers.ostinato && st.ost !== "none") {
        if (st.ost === "tick" || st.ost === "tickKit") {
          for (let s = 0; s < SPB; s++) ostinato.push({ bar: b, step: s, midi: 96, len: 1, kind: "tick", gain: 0.25 + 0.6 * inten });
        } else if (st.ost === "organPulse") {
          for (let s = 0; s < SPB; s += 2) ostinato.push({ bar: b, step: s, midi: v.soprano, len: 2, kind: "organ", gain: inten });
        } else if (st.ost === "motifPulse") {
          slice4(cell, b % moduleBars).forEach((n, i) => ostinato.push({ bar: b, step: i * 4, midi: n.midi, len: 4, kind: "piano", gain: 0.7 }));
        } else if (st.ost === "stringRun") {
          const arp = [v.alto, v.alto + 4, v.soprano, v.alto + 7];
          for (let s = 0; s < SPB; s++) ostinato.push({ bar: b, step: s, midi: arp[s % 4], len: 1, kind: "strings", gain: inten });
        } else if (st.ost === "twoNote") {
          const a = v.bass, c2 = a + 3;
          for (let s = 0; s < SPB; s += 2) ostinato.push({ bar: b, step: s, midi: s % 4 === 0 ? a : c2, len: 2, kind: "cello", gain: 0.7 });
        } else if (st.ost === "shepard") {
          for (let s = 0; s < SPB; s++) ostinato.push({ bar: b, step: s, midi: 48 + ((s + b * 2) % 24), len: 1, kind: "rise", gain: 0.5 * inten });
        } else if (st.ost === "arp") {
          const arp = [v.bass + 12, v.tenor, v.alto, v.soprano];
          for (let s = 0; s < SPB; s++) ostinato.push({ bar: b, step: s, midi: arp[s % 4], len: 1, kind: "arp", gain: 0.6 });
        } else if (st.ost === "droneFifth") {
          ostinato.push({ bar: b, step: 0, midi: v.bass, len: SPB, kind: "drone", gain: 0.5 });
          ostinato.push({ bar: b, step: 0, midi: v.bass + 7, len: SPB, kind: "drone", gain: 0.4 });
        }
      }
      if (layers.brass && st.brass !== "none" && inten > 0.55) {
        if (st.brass === "braam" && (b % 4 === 0 || inten > 0.78)) {
          const r = v.bass - 12;
          brass.push({ bar: b, step: 0, notes: [r, r + 5, r + 10, r + 16], len: 10, kind: "braam", gain: inten });
        } else if (st.brass === "fanfare" && inten > 0.62) {
          brass.push({ bar: b, step: 0, notes: [v.alto, v.soprano, v.soprano + 5], len: 6, kind: "fanfare", gain: inten });
        } else if (st.brass === "horn" && inten > 0.45) {
          brass.push({ bar: b, step: 0, notes: [v.tenor, v.alto], len: 12, kind: "horn", gain: inten * 0.8 });
        }
      }
      if (layers.drums && st.drums !== "none" && inten > 0.18) fillDrums(drums, st.drums, b, bars, inten, rng);
    }

    /* Collapse after φ: drop brass/taiko, keep piano cell + a whisper of pad. */
    const cut = Math.floor(bars * 0.88);
    const melodyFinal = melody;
    const drumsFinal = drums.filter((e) => e.bar < cut);
    const brassFinal = brass.filter((e) => e.bar < cut);
    const ostFinal = ostinato.filter((e) => e.bar < cut || (e.kind === "tick" && e.bar < bars));
    const padsFinal = pads.map((e) => e.bar >= cut ? Object.assign({}, e, { gain: 0.18 }) : e);

    const tension = chain.map((v, b) => {
      const midis = [v.bass, v.tenor, v.alto, v.soprano];
      return A.chordRoughness(midis) * 0.4 + A.catharsisCurve(b / Math.max(1, bars - 1));
    });

    return {
      engine: "cathartic",
      scale, root, progDegrees, chain, tension,
      melody: melodyFinal.concat(cello),
      bass, chords, drums: drumsFinal, ostinato: ostFinal, pads: padsFinal, brass: brassFinal,
      palette: pal
    };
  }

  function slice4(cell, barInMod) {
    return cell.slice(barInMod * 4, barInMod * 4 + 4);
  }

  function composeGroove(rng, p, st) {
    const scale = A.SCALES[pick(rng, st.scales)];
    const root = pick(rng, st.roots) % 12;
    const bars = p.bars;
    const pal = (st.prog && st.prog.length) ? pick(rng, st.prog) : [0, 4, 5, 3];
    const notes = A.scaleNotes(root, scale, 48 + root, 4);
    const ranges = A.RANGES;
    const chain = [];
    let prev = null;
    const progDegrees = [];
    for (let b = 0; b < bars; b++) {
      let deg = pal[b % pal.length];
      if (chance(rng, p.weird * 0.3)) deg = (deg + pick(rng, [1, 2, 3, 5])) % scale.steps.length;
      progDegrees.push(deg);
      const v = A.voiceLead(prev, A.chordTones(root, scale, deg, chance(rng, 0.5)), ranges);
      chain.push(v); prev = v;
    }
    const melody = [];
    let idx = Math.floor(notes.length / 2);
    let motif = null;
    for (let b = 0; b < bars; b++) {
      if (b > 0 && motif && chance(rng, 0.42)) {
        motif.forEach((n) => melody.push({ bar: b, step: n.step, midi: notes[A.clamp(n.idx, 0, notes.length - 1)], len: n.len, layer: "lead" }));
        continue;
      }
      const phrase = [];
      for (let s = 0; s < SPB; s++) {
        const strong = s % 4 === 0;
        if (s % 2 && !chance(rng, p.density * 0.3)) continue;
        if (!strong && !chance(rng, p.density)) continue;
        idx += chance(rng, 0.14 + p.weird * 0.2) ? pick(rng, [-4, -3, 3, 4]) : pick(rng, [-2, -1, -1, 1, 1, 2]);
        idx = A.clamp(idx, 2, notes.length - 3);
        let midi = notes[idx];
        if (strong) {
          const v = chain[b];
          const chord = [v.bass, v.tenor, v.alto, v.soprano];
          let best = midi, bd = 99, bi = idx;
          chord.forEach((c) => notes.forEach((sn, i) => {
            if (A.pc(sn) === A.pc(c) && Math.abs(sn - midi) < bd) { bd = Math.abs(sn - midi); best = sn; bi = i; }
          }));
          midi = best; idx = bi;
        }
        const ev = { bar: b, step: s, midi, len: chance(rng, 0.2) ? 4 : 2, idx, layer: "lead" };
        melody.push(ev); phrase.push(ev);
      }
      if (phrase.length >= 3) motif = phrase;
    }
    const bass = [], chords = [], drums = [], ostinato = [], pads = [], brass = [];
    for (let b = 0; b < bars; b++) {
      const v = chain[b];
      const tones = [v.bass, v.tenor, v.alto, v.soprano];
      chords.push({ bar: b, step: 0, notes: tones, len: SPB, voicing: "pad" });
      if (p.layers.bass) {
        if (st.bass === "walk") {
          A.bassMotion(v.bass, "walk").forEach((m, i) => bass.push({ bar: b, step: i * 2, midi: m, len: 2, kind: "walk" }));
        } else if (st.bass === "eight") {
          for (let s = 0; s < SPB; s += 2) if (s === 0 || s === 6 || s === 10 || chance(rng, 0.3)) bass.push({ bar: b, step: s, midi: v.bass - 12, len: 2, kind: "808" });
        } else if (st.bass === "reese") {
          bass.push({ bar: b, step: 0, midi: v.bass - 12, len: SPB, kind: "reese" });
        } else if (st.bass === "pump") {
          for (let s = 0; s < SPB; s += 4) bass.push({ bar: b, step: s, midi: v.bass - 12, len: 3, kind: "pump" });
        } else {
          bass.push({ bar: b, step: 0, midi: v.bass - (v.bass > 48 ? 12 : 0), len: 8, kind: "root" });
          bass.push({ bar: b, step: 8, midi: v.bass + 7 - 12, len: 8, kind: "root" });
        }
      }
      if (p.layers.pads && st.pad !== "none") pads.push({ bar: b, step: 0, notes: [v.bass, v.tenor, v.alto], len: SPB, kind: st.pad, gain: 0.7 });
      if (p.layers.ostinato && st.ost === "arp") {
        const arp = [v.bass + 12, v.tenor, v.alto, v.soprano];
        for (let s = 0; s < SPB; s++) ostinato.push({ bar: b, step: s, midi: arp[s % 4], len: 1, kind: "arp", gain: 0.55 });
      }
      if (p.layers.brass && st.brass === "horn" && b % 4 === 2) brass.push({ bar: b, step: 0, notes: [v.alto, v.soprano], len: 8, kind: "horn", gain: 0.6 });
      if (p.layers.drums && st.drums !== "none") fillDrums(drums, st.drums, b, bars, 0.5 + 0.5 * (b / bars), rng);
    }
    const tension = chain.map((v, b) => A.chordRoughness([v.bass, v.tenor, v.alto, v.soprano]) + 0.3 * (b / bars));
    return { engine: "groove", scale, root, progDegrees, chain, tension, melody, bass, chords, drums, ostinato, pads, brass, palette: pal };
  }

  A.critic = function (song) {
    const issues = [];
    const m = {};
    const bars = song.bars;
    m.parallels = A.countParallels(song.chain || []);
    m.motion = A.motionSemitones(song.chain || []);
    const dens = new Array(bars).fill(0);
    (song.melody || []).forEach((e) => { dens[e.bar] = (dens[e.bar] || 0) + 1; });
    (song.brass || []).forEach((e) => { dens[e.bar] += 2; });
    m.density = dens;
    const ideal = dens.map((_, i) => A.catharsisCurve(i / Math.max(1, bars - 1)));
    m.formCorr = A.corr(dens.map((d) => d / (Math.max(...dens) || 1)), ideal);
    const strongHits = (song.melody || []).filter((e) => e.step % 4 === 0);
    let chordTone = 0;
    strongHits.forEach((e) => {
      const v = song.chain[e.bar];
      if (!v) return;
      const pcs = [v.bass, v.tenor, v.alto, v.soprano].map(A.pc);
      if (pcs.includes(A.pc(e.midi))) chordTone++;
    });
    m.chordToneRate = strongHits.length ? chordTone / strongHits.length : 0;
    const uniqueMel = new Set((song.melody || []).map((e) => (e.midi % 12) + ":" + e.step));
    m.motifLock = song.engine === "cathartic" ? 1 : A.clamp(1 - uniqueMel.size / Math.max(1, (song.melody || []).length), 0, 1);

    let score = 100;
    if (m.parallels > 6) { score -= 8; issues.push("Parallel 5ths/8ves in inner voices (" + m.parallels + ")"); }
    if (m.motion > 6) { score -= 10; issues.push("Voice-leading leaps too wide (mean " + m.motion.toFixed(1) + " st)"); }
    else if (m.motion < 0.4) { score -= 4; issues.push("Voices static"); }
    if (song.engine === "cathartic" && m.formCorr < 0.25) { score -= 12; issues.push("Form curve does not bloom then collapse"); }
    if (m.chordToneRate < 0.55) { score -= 10; issues.push("Strong beats miss chord tones (" + Math.round(m.chordToneRate * 100) + "%)"); }
    if ((song.melody || []).length < bars) { score -= 8; issues.push("Melody too sparse"); }
    if ((song.chain || []).length !== bars) { score -= 20; issues.push("Incomplete harmonic chain"); }
    const last = dens.slice(Math.floor(bars * 0.9)).reduce((a, b) => a + b, 0);
    const mid = dens.slice(Math.floor(bars * 0.5), Math.floor(bars * 0.75)).reduce((a, b) => a + b, 0);
    const head = dens.slice(0, Math.min(4, bars)).reduce((a, b) => a + b, 0);
    if (head < 8) { score -= 14; issues.push("Opening is empty — a cathartic cue must state the cell at once"); }
    if (song.engine === "cathartic" && last > mid * 0.95 && bars >= 16) { score -= 8; issues.push("No collapse after the apex"); }
    if (song.engine === "cathartic") {
      const piano = (song.melody || []).filter((e) => e.layer === "piano");
      const skipI = song.silenceBar != null ? song.silenceBar % 8 : -1;
      const sig = (mod) => [0, 1, 2, 3, 4, 5, 6, 7]
        .filter((i) => i !== skipI)
        .map((i) => piano.filter((e) => e.bar === mod * 8 + i).map((e) => e.step + ":" + e.midi).join("-"))
        .join("|");
      const a = sig(0), b = sig(1);
      if (a && b && a !== b) { score -= 10; issues.push("8-bar cell is not locked — ostinato broke"); }
      if (song.deep && song.deep.silence && song.bars >= 16 && song.silenceBar == null) {
        score -= 8; issues.push("No silence before impact");
      }
      if (song.deep && song.deep.nested && !song.nestedClocks) {
        score -= 6; issues.push("Missing nested dream-clocks");
      }
    }
    if (!issues.length) issues.push("Voice-leading, form, motif, and Deep Music gates hold.");
    const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : "D";
    return { score: A.clamp(Math.round(score), 0, 100), grade, issues, metrics: m };
  };

  A.compose = function (params) {
    const p = Object.assign({
      seed: "arena-42", mood: "catharsis", bars: 24, tempo: 66,
      density: 0.4, weird: 0.1, intensity: 0.78, timbre: "auto",
      layers: { drums: true, ostinato: true, pads: true, brass: true, bass: true },
      deep: { ji: true, nested: true, silence: true, texture: true, groove: true, fractal: true }
    }, params || {});
    p.deep = A.defaultDeep(p.deep);
    const rng = mulberry32(hashSeed(String(p.seed)));
    const st = A.STYLES[p.mood] || A.STYLES.catharsis;
    const body = st.engine === "cathartic" ? composeCathartic(rng, p, st) : composeGroove(rng, p, st);
    let timbre = p.timbre;
    if (!timbre || timbre === "auto") timbre = st.lead;
    const song = {
      name: pick(rng, ADJ) + " " + pick(rng, NOUN),
      seedStr: String(p.seed),
      moodKey: p.mood,
      styleLabel: st.label,
      scaleKey: Object.keys(A.SCALES).find((k) => A.SCALES[k] === body.scale) || "minor",
      scaleLabel: body.scale.label,
      rootName: A.NOTE_NAMES[body.root],
      root: body.root,
      scale: body.scale,
      bars: p.bars,
      stepsPerBar: SPB,
      tempo: p.tempo,
      timbre,
      intensity: p.intensity,
      form: st.form,
      progDegrees: body.progDegrees,
      chain: body.chain,
      tension: body.tension,
      palette: body.palette,
      engine: body.engine,
      melody: body.melody,
      bass: body.bass,
      chords: body.chords,
      drums: body.drums,
      ostinato: body.ostinato,
      pads: body.pads,
      brass: body.brass
    };
    if (typeof A.applyDeep === "function") A.applyDeep(song, p.deep, rng);
    song.critic = A.critic(song);
    return song;
  };
})(window.Aether);
