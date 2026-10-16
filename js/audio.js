/* Aether Score — Web Audio: harmonic-series instruments, FM brass,
   Shepard risers, sympathetic-piano BRAAAM, MIDI byte writer. */
window.Aether = window.Aether || {};
(function (A) {
  "use strict";
  let audio = null, timers = [], raf = 0, playing = false, playhead = { t0: 0, total: 0 };

  A.isPlaying = () => playing;
  A.getAudio = () => audio;
  A.getPlayhead = () => playhead;

  A.makeAudio = function () {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain(); master.gain.value = 0.68;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.knee.value = 16; comp.ratio.value = 3.8;
    comp.attack.value = 0.012; comp.release.value = 0.22;
    const delay = ctx.createDelay(1.4); delay.delayTime.value = 0.34;
    const fb = ctx.createGain(); fb.gain.value = 0.27;
    const wet = ctx.createGain(); wet.gain.value = 0.15;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 4600;
    delay.connect(fb); fb.connect(delay); delay.connect(lp); lp.connect(wet); wet.connect(master);
    const d2 = ctx.createDelay(1.4); d2.delayTime.value = 0.51;
    const w2 = ctx.createGain(); w2.gain.value = 0.07;
    delay.connect(d2); d2.connect(w2); w2.connect(master);
    /* Exponential-noise IR hall (Reverb & Space Designer) */
    const irLen = Math.floor(ctx.sampleRate * 2.2);
    const ir = ctx.createBuffer(2, irLen, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < irLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 2.6);
    }
    const conv = ctx.createConvolver(); conv.buffer = ir;
    const pre = ctx.createDelay(0.2); pre.delayTime.value = 0.026;
    const convGain = ctx.createGain(); convGain.gain.value = 0.2;
    delay.connect(pre); pre.connect(conv); conv.connect(convGain); convGain.connect(master);
    master.connect(comp); comp.connect(ctx.destination);
    audio = { ctx, master, delay, wet, conv, convGain };
    return audio;
  };

  A.closeAudio = function () {
    timers.forEach(clearTimeout); timers = [];
    cancelAnimationFrame(raf); raf = 0;
    playing = false;
    if (audio) {
      try { audio.ctx.close(); } catch (e) {}
      audio = null;
    }
  };

  function panFor(kind) {
    const p = audio.ctx.createStereoPanner();
    const map = { piano: -0.15, strings: -0.35, cello: 0.1, brass: 0.05, pad: 0.2, ost: 0, drums: 0, bass: 0, choir: 0.12, tick: 0.4 };
    p.pan.value = map[kind] || 0;
    p.connect(audio.master);
    return p;
  }

  function env(g, t, peak, dur, a, rel) {
    const atk = Math.max(0.004, a || 0.012);
    const r = rel || Math.min(0.22, dur * 0.4);
    g.gain.setValueAtTime(0.00008, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + atk);
    const hold = Math.max(t + atk + 0.01, t + dur - r);
    g.gain.exponentialRampToValueAtTime(Math.max(peak * 0.72, 0.0002), hold);
    g.gain.exponentialRampToValueAtTime(0.00008, t + dur);
  }

  A.toneHz = function (t, hz, dur, type, vol, dest, extra) {
    extra = extra || {};
    if (!audio || dur <= 0.012) return;
    const ctx = audio.ctx;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(20, hz), t);
    if (extra.glide) {
      o.frequency.setValueAtTime(Math.max(20, extra.glide), t);
      o.frequency.exponentialRampToValueAtTime(Math.max(20, hz), t + Math.min(0.14, dur / 3));
    }
    if (extra.detune) o.detune.value = extra.detune;
    if (extra.vibrato) {
      const lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = extra.vibrato;
      lg.gain.value = extra.vibDepth || 6;
      lfo.connect(lg); lg.connect(o.detune);
      lfo.start(t); lfo.stop(t + dur + 0.05);
    }
    let node = o;
    if (extra.filter) {
      const f = ctx.createBiquadFilter();
      f.type = extra.filter; f.frequency.value = extra.ffreq || 1800; f.Q.value = extra.q || 0.7;
      if (extra.fsweep) {
        f.frequency.setValueAtTime(Math.max(40, extra.fsweep[0]), t);
        f.frequency.exponentialRampToValueAtTime(Math.max(40, extra.fsweep[1]), t + dur * 0.7);
      }
      o.connect(f); node = f;
    }
    env(g, t, vol, dur, extra.attack, extra.release);
    node.connect(g); g.connect(dest);
    if (extra.echo) g.connect(audio.delay);
    o.start(t); o.stop(t + dur + 0.05);
  };

  A.tone = function (t, midi, dur, type, vol, dest, extra) {
    A.toneHz(t, A.freqFromMidi(midi), dur, type, vol, dest, extra);
  };

  function noiseBurst(t, dur, vol, hp, dest) {
    const ctx = audio.ctx;
    const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = hp;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(dest); src.start(t);
  }

  /* Struck piano: inharmonic additive partials + hammer noise */
  function playPiano(t, midi, dur, dest, hz0) {
    const f0 = hz0 || A.freqFromMidi(midi);
    const B = 0.00028 + midi * 0.0000015;
    for (let n = 1; n <= 8; n++) {
      const fn = A.inharmonicPartial(f0, n, B);
      const amp = 0.16 * A.harmonicAmp(n, 1.25) * (midi < 50 ? 1.1 : 0.9);
      A.toneHz(t, fn, dur * (n === 1 ? 1 : 0.55 + 0.4 / n), "sine", amp, dest, { attack: 0.004, release: 0.28, echo: n < 3 });
    }
    noiseBurst(t, 0.018, 0.04, 1800, dest);
  }

  function playStrings(t, midi, dur, dest) {
    A.tone(t, midi, dur, "sawtooth", 0.07, dest, { attack: 0.14, detune: -7, filter: "lowpass", ffreq: 2100, vibrato: 5, vibDepth: 5, echo: true });
    A.tone(t, midi, dur, "sawtooth", 0.07, dest, { attack: 0.14, detune: 8, filter: "lowpass", ffreq: 2300 });
  }

  function playCello(t, midi, dur, dest) {
    A.tone(t, midi, dur, "sawtooth", 0.13, dest, { attack: 0.09, filter: "lowpass", ffreq: 880, vibrato: 4.4, vibDepth: 7, echo: true });
    A.tone(t, midi, dur, "sine", 0.1, dest, { attack: 0.09 });
  }

  /* FM brass (Chowning): carrier ← I(t)·sin(2π fm t) */
  function playFmBrass(t, midi, dur, dest, index0) {
    const ctx = audio.ctx;
    const car = ctx.createOscillator(), mod = ctx.createOscillator();
    const mg = ctx.createGain(), ag = ctx.createGain();
    const f = A.freqFromMidi(midi);
    car.type = "sine"; mod.type = "sine";
    car.frequency.value = f; mod.frequency.value = f;
    const I = (index0 || 3.2) * f;
    mg.gain.setValueAtTime(I, t);
    mg.gain.exponentialRampToValueAtTime(Math.max(20, I * 0.25), t + dur * 0.7);
    mod.connect(mg); mg.connect(car.frequency);
    env(ag, t, 0.11, dur, 0.12, 0.25);
    const ftr = ctx.createBiquadFilter(); ftr.type = "lowpass";
    ftr.frequency.setValueAtTime(280, t);
    ftr.frequency.exponentialRampToValueAtTime(1400, t + Math.min(0.4, dur * 0.4));
    car.connect(ftr); ftr.connect(ag); ag.connect(dest); ag.connect(audio.delay);
    car.start(t); mod.start(t); car.stop(t + dur + 0.05); mod.stop(t + dur + 0.05);
  }

  function playOrgan(t, midi, dur, dest) {
    const f0 = A.freqFromMidi(midi);
    [1, 2, 3, 4, 6].forEach((h, i) => A.toneHz(t, f0 * h, dur, "sine", 0.09 / (i + 1), dest, { attack: 0.03, echo: i < 2 }));
  }

  function playChoir(t, midi, dur, dest) {
    A.tone(t, midi, dur, "sine", 0.12, dest, { attack: 0.2, vibrato: 3.1, vibDepth: 9, echo: true });
    A.tone(t, midi + 7, dur, "triangle", 0.04, dest, { attack: 0.22, detune: 4 });
  }

  function playPad(t, midi, dur, dest) {
    A.tone(t, midi, dur, "sawtooth", 0.05, dest, { attack: 0.24, detune: -9, filter: "lowpass", ffreq: 1300, echo: true });
    A.tone(t, midi, dur, "sawtooth", 0.05, dest, { attack: 0.24, detune: 9, filter: "lowpass", ffreq: 1500 });
  }

  function playSynth(t, midi, dur, dest) {
    A.tone(t, midi, dur, "sawtooth", 0.1, dest, { detune: -6, filter: "lowpass", fsweep: [500, 2800], echo: true });
    A.tone(t, midi, dur, "sawtooth", 0.1, dest, { detune: 6, filter: "lowpass", ffreq: 2400 });
  }

  A.playLead = function (t, midi, dur, timbre, hz0) {
    const dest = audio.master;
    const T = timbre;
    if (hz0 && T !== "piano") {
      A.toneHz(t, hz0, dur, "triangle", 0.22, dest, { echo: true, attack: 0.02 });
    }
    if (T === "piano") playPiano(t, midi, dur, dest, hz0);
    else if (T === "strings") playStrings(t, midi, dur, dest);
    else if (T === "cello") playCello(t, midi, dur, dest);
    else if (T === "brass") playFmBrass(t, midi, dur, dest, 2.4);
    else if (T === "horn") { A.tone(t, midi, dur, "sine", 0.18, dest, { attack: 0.1, vibrato: 4.1, vibDepth: 7, echo: true }); playFmBrass(t, midi, dur, dest, 1.4); }
    else if (T === "organ") playOrgan(t, midi, dur, dest);
    else if (T === "choir") playChoir(t, midi, dur, dest);
    else if (T === "pad") playPad(t, midi, dur, dest);
    else if (T === "synth") playSynth(t, midi, dur, dest);
    else if (T === "pluck" || T === "harp") {
      A.tone(t, midi, dur, "triangle", 0.24, dest, { attack: 0.004, release: 0.32, echo: true });
      A.tone(t, midi + 12, dur * 0.35, "sine", 0.06, dest);
    } else if (T === "guitar") {
      A.tone(t, midi, dur * 0.9, "sawtooth", 0.08, dest, { attack: 0.006, filter: "lowpass", ffreq: 1700, echo: true });
      A.tone(t, midi, dur * 0.5, "triangle", 0.12, dest);
    } else if (T === "flute") {
      A.tone(t, midi, dur, "sine", 0.28, dest, { attack: 0.07, vibrato: 5, vibDepth: 5, echo: true });
    } else if (T === "bell") {
      A.tone(t, midi, dur * 1.4, "sine", 0.26, dest, { attack: 0.003, echo: true });
      A.tone(t, midi + 12, dur * 0.7, "sine", 0.08, dest);
    } else if (T === "square") {
      A.tone(t, midi, dur, "square", 0.08, dest, { detune: -4, filter: "lowpass", fsweep: [400, 2200], echo: true });
      A.tone(t, midi, dur, "square", 0.08, dest, { detune: 4 });
    } else playPiano(t, midi, dur, dest);
  };

  A.playBass = function (t, midi, dur, kind) {
    const m = audio.master;
    if (kind === "808" || kind === "pump") A.tone(t, midi, dur, "sine", 0.5, m, { attack: 0.006, glide: midi + 10, release: 0.22 });
    else if (kind === "reese") {
      A.tone(t, midi, dur, "sawtooth", 0.1, m, { attack: 0.03, detune: -11, filter: "lowpass", ffreq: 260 });
      A.tone(t, midi, dur, "sawtooth", 0.1, m, { attack: 0.03, detune: 11, filter: "lowpass", ffreq: 300 });
      A.tone(t, midi, dur, "sine", 0.2, m, { attack: 0.02 });
    } else if (kind === "drone") {
      A.tone(t, midi, dur, "sine", 0.24, m, { attack: 0.1 });
      A.tone(t, midi + 7, dur, "sine", 0.06, m, { attack: 0.12 });
    } else {
      A.tone(t, midi, dur, "sine", 0.32, m, { attack: 0.02 });
    }
  };

  A.playPadNotes = function (t, notes, dur, kind, gain) {
    const g = gain == null ? 1 : gain;
    notes.forEach((n, i) => {
      if (kind === "organ") playOrgan(t, n, dur, audio.master);
      else if (kind === "choir") playChoir(t, n, dur, audio.master);
      else playPad(t, n, dur, audio.master);
    });
  };

  A.playBrass = function (t, notes, dur, kind, gain) {
    const g = gain == null ? 1 : gain;
    if (kind === "braam") {
      notes.forEach((n) => playFmBrass(t, n, dur, audio.master, 4.2 * g));
      /* sympathetic piano resonance — Zimmer's church-piano trick, synthesized */
      notes.forEach((n) => {
        const f0 = A.freqFromMidi(n);
        for (let h = 1; h <= 5; h++) A.toneHz(t, f0 * h, dur * 1.1, "sine", 0.035 * g / h, audio.master, { attack: 0.18, echo: true });
      });
      noiseBurst(t, 0.2, 0.07 * g, 180, audio.master);
    } else if (kind === "fanfare") {
      notes.forEach((n) => playFmBrass(t, n, dur, audio.master, 2.2));
    } else {
      notes.forEach((n) => A.tone(t, n, dur, "sine", 0.1 * g, audio.master, { attack: 0.1, vibrato: 4, vibDepth: 6, echo: true }));
    }
  };

  A.playOst = function (t, midi, dur, kind, gain) {
    const g = (gain == null ? 1 : gain);
    const m = audio.master;
    if (kind === "tick") { noiseBurst(t, 0.022, 0.07 * g, 5200, m); A.tone(t, 98, 0.03, "sine", 0.03 * g, m); }
    else if (kind === "dreamTick") { noiseBurst(t, 0.04, 0.06 * g, 1800, m); A.tone(t, 42, 0.08, "sine", 0.08 * g, m); }
    else if (kind === "levelTick") { A.tone(t, 28, 0.18, "sine", 0.12 * g, m, { attack: 0.01 }); noiseBurst(t, 0.06, 0.05 * g, 400, m); }
    else if (kind === "organ") playOrgan(t, midi, dur, m);
    else if (kind === "piano") playPiano(t, midi, dur, m);
    else if (kind === "strings") playStrings(t, midi, dur, m);
    else if (kind === "cello") playCello(t, midi, dur, m);
    else if (kind === "rise") {
      const f = A.freqFromMidi(midi);
      [0.5, 1, 2, 4].forEach((oct) => {
        const fn = f * oct;
        const a = 0.04 * g * A.shepardAmp(fn, 440, 0.9);
        A.toneHz(t, fn, dur, "sawtooth", a, m, { attack: 0.01, filter: "lowpass", ffreq: 1800, echo: true });
      });
    } else if (kind === "arp") A.tone(t, midi, dur, "square", 0.045 * g, m, { attack: 0.005, filter: "lowpass", ffreq: 2100, echo: true });
    else if (kind === "drone") A.tone(t, midi, dur, "sine", 0.07 * g, m, { attack: 0.1 });
  };

  A.drum = function (t, type, vel) {
    const v = vel == null ? 1 : vel;
    const { ctx, master } = audio;
    if (type === "kick" || type === "boom" || type === "taiko" || type === "808") {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine";
      const f0 = type === "taiko" ? 118 : type === "boom" ? 86 : 148;
      const f1 = type === "taiko" ? 36 : type === "boom" ? 26 : 42;
      o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + (type === "taiko" ? 0.22 : 0.12));
      const peak = (type === "boom" ? 0.8 : type === "taiko" ? 0.7 : 0.58) * v;
      g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(0.001, t + (type === "taiko" ? 0.4 : 0.18));
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.45);
      if (type === "taiko" || type === "boom") noiseBurst(t, 0.09, 0.1 * v, 380, master);
    } else if (type === "snare" || type === "clap") {
      noiseBurst(t, type === "clap" ? 0.11 : 0.13, (type === "clap" ? 0.26 : 0.3) * v, type === "clap" ? 800 : 1200, master);
      if (type === "snare") A.tone(t, 62, 0.08, "triangle", 0.1 * v, master);
      if (type === "clap") { noiseBurst(t + 0.018, 0.09, 0.16 * v, 1000, master); }
    } else {
      const dur = type === "crash" ? 0.55 : type === "ride" ? 0.2 : type === "tick" ? 0.028 : 0.04;
      const hp = type === "tick" ? 7200 : type === "crash" ? 2000 : type === "ride" ? 4000 : 6200;
      noiseBurst(t, dur, (type === "crash" ? 0.2 : 0.09) * v, hp, master);
    }
  };

  A.schedule = function (song, onEnd, loop) {
    if (!audio) A.makeAudio();
    const spb = 60 / song.tempo, stepDur = spb / 4, t0 = audio.ctx.currentTime + 0.12;
    playhead = { t0, total: song.bars * A.SPB * stepDur };
    playing = true;
    const at = (ev) => t0 + (ev.bar * A.SPB + ev.step) * stepDur;
    const swingAmt = (song.swing != null ? song.swing : ((song.moodKey === "lofi" || song.moodKey === "jazz" || song.moodKey === "chill") ? 0.16 : 0));
    const swing = swingAmt * stepDur;
    const tAt = (ev) => at(ev) + ((ev.step % 2) ? swing : 0);
    const human = (ev) => tAt(ev) + (Math.sin(ev.bar * 3.1 + ev.step) * 0.006);

    song.chords.forEach((ev) => ev.notes.forEach((n, i) =>
      A.toneHz(human(ev), (ev.hzs && ev.hzs[i]) || A.freqFromMidi(n), ev.len * stepDur * 0.96, "triangle", 0.045, audio.master, { attack: 0.06, echo: true })
    ));
    song.pads.forEach((ev) => {
      A.playPadNotes(human(ev), ev.notes, ev.len * stepDur * 0.98, ev.kind, ev.gain);
      if (ev.hzs && song.deep && song.deep.ji) {
        ev.hzs.forEach((h) => A.toneHz(human(ev), h, ev.len * stepDur * 0.98, "sine", 0.03 * (ev.gain || 1), audio.master, { attack: 0.2, detune: -8, echo: true }));
      }
    });
    song.bass.forEach((ev) => {
      if (ev.hz) A.toneHz(human(ev), ev.hz, ev.len * stepDur * 0.92, "sine", 0.28, audio.master, { attack: 0.04 });
      else A.playBass(human(ev), ev.midi, ev.len * stepDur * 0.92, ev.kind);
    });
    song.ostinato.forEach((ev) => A.playOst(human(ev), ev.midi, ev.len * stepDur * 0.9, ev.kind, ev.gain));
    song.brass.forEach((ev) => A.playBrass(human(ev), ev.notes, ev.len * stepDur * 0.95, ev.kind, ev.gain));
    song.melody.forEach((ev) => {
      const tim = ev.layer === "cello" ? "cello" : ev.layer === "fractal" ? "bell" : song.timbre;
      A.playLead(human(ev), ev.midi, ev.len * stepDur * 0.9, tim, ev.hz);
    });
    song.drums.forEach((ev) => A.drum(tAt(ev), ev.type, ev.vel ?? 1));
    if (song.texture && audio) {
      const ctx = audio.ctx;
      const n = Math.floor(ctx.sampleRate * 2);
      const buf = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 5200;
      const g = ctx.createGain(); g.gain.value = 0.025 * (song.intensity || 0.6);
      src.connect(f); f.connect(g); g.connect(audio.master);
      src.start(t0); src.stop(t0 + playhead.total + 0.2);
    }

    timers.push(setTimeout(() => {
      if (loop && playing) A.schedule(song, onEnd, loop);
      else { playing = false; if (onEnd) onEnd(); }
    }, playhead.total * 1000 + 100));
  };

  A.stopPlayback = function () {
    playing = false;
    timers.forEach(clearTimeout); timers = [];
    cancelAnimationFrame(raf); raf = 0;
    if (audio) { try { audio.ctx.close(); } catch (e) {} audio = null; }
  };

  A.drawScore = function (cvs, song, animate) {
    cancelAnimationFrame(raf);
    if (!cvs || !song) return;
    const ctx = cvs.getContext("2d"), W = cvs.width, H = cvs.height;
    const SPB = A.SPB, stepW = W / (song.bars * SPB);
    const pool = [...song.melody.map((e) => e.midi), ...song.bass.map((e) => e.midi)];
    const lo = (pool.length ? Math.min.apply(null, pool) : 40) - 3;
    const hi = (pool.length ? Math.max.apply(null, pool) : 84) + 3;
    const y = (m) => H - (m - lo) / (hi - lo) * (H - 30) - 16;
    function frame() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#0a0a14"; ctx.fillRect(0, 0, W, H);
      for (let b = 0; b <= song.bars; b++) {
        ctx.strokeStyle = b % 8 === 0 ? "#4a4068" : b % 4 === 0 ? "#2c2c4a" : "#1a1a30";
        ctx.beginPath(); ctx.moveTo(b * SPB * stepW, 0); ctx.lineTo(b * SPB * stepW, H); ctx.stroke();
      }
      const rect = (x, yy, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x, yy, w, h); };
      song.chords.forEach((ev) => ev.notes.forEach((n) => rect((ev.bar * SPB + ev.step) * stepW + 1, y(n) - 3, ev.len * stepW - 2, 6, "#3d3d7a")));
      song.pads.forEach((ev) => ev.notes.forEach((n) => rect((ev.bar * SPB + ev.step) * stepW + 1, y(n) - 2, ev.len * stepW - 2, 5, "rgba(110,200,255,0.32)")));
      song.bass.forEach((ev) => rect((ev.bar * SPB + ev.step) * stepW + 1, y(ev.midi) - 4, Math.max(3, ev.len * stepW - 2), 8, "#4db38a"));
      song.ostinato.forEach((ev) => {
        if (ev.kind === "tick") rect((ev.bar * SPB + ev.step) * stepW + 1, H - 42, Math.max(2, stepW - 2), 3, "#c9a46a");
        else rect((ev.bar * SPB + ev.step) * stepW + 1, y(ev.midi) - 2, Math.max(2, ev.len * stepW - 2), 5, "#c9a46a");
      });
      song.brass.forEach((ev) => ev.notes.forEach((n) => rect((ev.bar * SPB + ev.step) * stepW + 1, y(n) - 3, ev.len * stepW - 2, 7, "#e07a3d")));
      song.melody.forEach((ev) => rect((ev.bar * SPB + ev.step) * stepW + 1, y(ev.midi) - 5, Math.max(3, ev.len * stepW - 2), 9, ev.layer === "cello" ? "#c48bff" : "#ffd479"));
      song.drums.forEach((ev) => {
        const yy = (ev.type === "kick" || ev.type === "boom" || ev.type === "taiko") ? H - 14 : (ev.type === "snare" || ev.type === "clap") ? H - 24 : H - 34;
        rect((ev.bar * SPB + ev.step) * stepW + 1, yy, Math.max(2, stepW - 2), 6, "#d06a8a");
      });
      if (animate && playing && audio) {
        const p = (audio.ctx.currentTime - playhead.t0) / playhead.total;
        if (p >= 0 && p <= 1) { ctx.fillStyle = "#ece9e2"; ctx.fillRect(p * W, 0, 2, H); }
        raf = requestAnimationFrame(frame);
      }
    }
    frame();
  };

  A.drawTension = function (cvs, song) {
    if (!cvs || !song || !song.tension) return;
    const ctx = cvs.getContext("2d"), W = cvs.width, H = cvs.height;
    ctx.fillStyle = "#0a0a14"; ctx.fillRect(0, 0, W, H);
    const t = song.tension, n = t.length;
    const mx = Math.max.apply(null, t) || 1;
    ctx.strokeStyle = "#ffd479"; ctx.lineWidth = 2; ctx.beginPath();
    t.forEach((v, i) => {
      const x = (i / Math.max(1, n - 1)) * W;
      const y = H - 8 - (v / mx) * (H - 16);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
    const phi = 1 / A.PHI;
    ctx.strokeStyle = "rgba(110,200,255,0.5)";
    ctx.beginPath(); ctx.moveTo(phi * W, 0); ctx.lineTo(phi * W, H); ctx.stroke();
  };

  function vlq(n) { const b = [n & 0x7f]; n >>= 7; while (n) { b.unshift((n & 0x7f) | 0x80); n >>= 7; } return b; }
  A.downloadMIDI = function (song) {
    const tpq = 480, step = tpq / 4, evs = [];
    const add = (tick, bytes, ord) => evs.push({ tick, bytes, ord });
    const onoff = (ch, n, t, d, vel) => {
      n = A.clamp(n | 0, 0, 127);
      add(t, [0x90 | ch, n, vel], 1); add(t + d, [0x80 | ch, n, 0], 0);
    };
    song.chords.forEach((ev) => ev.notes.forEach((n) => onoff(0, n, (ev.bar * A.SPB + ev.step) * step, ev.len * step, 48)));
    song.bass.forEach((ev) => onoff(1, ev.midi, (ev.bar * A.SPB + ev.step) * step, ev.len * step, 84));
    song.melody.forEach((ev) => onoff(2, ev.midi, (ev.bar * A.SPB + ev.step) * step, ev.len * step, 96));
    song.ostinato.forEach((ev) => { if (ev.kind !== "tick") onoff(3, ev.midi, (ev.bar * A.SPB + ev.step) * step, ev.len * step, 58); });
    song.pads.forEach((ev) => ev.notes.forEach((n) => onoff(4, n, (ev.bar * A.SPB + ev.step) * step, ev.len * step, 42)));
    song.brass.forEach((ev) => ev.notes.forEach((n) => onoff(5, n, (ev.bar * A.SPB + ev.step) * step, ev.len * step, 80)));
    song.drums.forEach((ev) => {
      const n = (ev.type === "kick" || ev.type === "boom" || ev.type === "taiko" || ev.type === "808") ? 36 : (ev.type === "snare" || ev.type === "clap") ? 38 : ev.type === "crash" ? 49 : 42;
      const t = (ev.bar * A.SPB + ev.step) * step;
      add(t, [0x99, n, Math.round(70 * (ev.vel || 1))], 1); add(t + step, [0x89, n, 0], 0);
    });
    evs.sort((a, b) => a.tick - b.tick || a.ord - b.ord);
    const us = Math.round(60000000 / song.tempo);
    let track = [...vlq(0), 0xFF, 0x51, 0x03, (us >> 16) & 255, (us >> 8) & 255, us & 255];
    let last = 0;
    evs.forEach((e) => { track.push(...vlq(Math.max(0, e.tick - last)), ...e.bytes); last = e.tick; });
    track.push(...vlq(0), 0xFF, 0x2F, 0x00);
    const bytes = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, (tpq >> 8) & 255, tpq & 255, 0x4d, 0x54, 0x72, 0x6b, (track.length >>> 24) & 255, (track.length >>> 16) & 255, (track.length >>> 8) & 255, track.length & 255, ...track];
    A.saveBlob(new Blob([new Uint8Array(bytes)], { type: "audio/midi" }), song.name.replace(/\s+/g, "-") + ".mid");
  };
  A.saveBlob = function (blob, name) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
})(window.Aether);
