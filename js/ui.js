window.Aether = window.Aether || {};
(function (A) {
  "use strict";
  const $ = (id) => document.getElementById(id);
  let song = null;

  function params() {
    return {
      seed: $("seed").value.trim() || "arena",
      mood: $("mood").value,
      bars: parseInt($("bars").value, 10),
      tempo: parseInt($("tempo").value, 10),
      density: parseInt($("density").value, 10) / 100,
      weird: parseInt($("weird").value, 10) / 100,
      intensity: parseInt($("intensity").value, 10) / 100,
      timbre: $("timbre").value,
      layers: {
        drums: $("drums").checked,
        ostinato: $("ostinato").checked,
        pads: $("padsOn").checked,
        brass: $("brassOn").checked,
        bass: $("bassOn").checked
      },
      deep: {
        ji: $("deepJi") ? $("deepJi").checked : true,
        nested: $("deepNested") ? $("deepNested").checked : true,
        silence: $("deepSilence") ? $("deepSilence").checked : true,
        fractal: $("deepFractal") ? $("deepFractal").checked : true,
        groove: $("deepGroove") ? $("deepGroove").checked : true,
        texture: $("deepTexture") ? $("deepTexture").checked : true
      }
    };
  }

  function render() {
    if (!song) return;
    $("songTitle").textContent = "♪ “" + song.name + "”";
    $("songMeta").textContent = `seed “${song.seedStr}” · ${song.tempo} BPM · ${song.bars} bars · ${song.timbre}`;
    const chip = $("keyChip"); chip.style.display = ""; chip.textContent = "Key of " + song.rootName + " " + song.scaleLabel;
    const sc = $("styleChip"); sc.style.display = ""; sc.textContent = song.styleLabel;
    const g = $("gradeChip"); g.style.display = "";
    g.textContent = "Critic " + song.critic.grade + " · " + song.critic.score;
    g.className = "chip " + (song.critic.score >= 85 ? "ok" : song.critic.score >= 70 ? "mid" : "bad");
    $("prog").innerHTML = "<b>Progression:</b> " + song.progDegrees.map((d) => A.roman(song.root, song.scale, d)).join("  →  ")
      + (song.form ? " &nbsp; <b>Form:</b> logistic bloom → φ cut → collapse" : "")
      + " &nbsp; <b>Engine:</b> " + song.engine
      + " &nbsp; <b>Tuning:</b> " + (song.tuning || "12-TET")
      + (song.silenceBar != null ? " &nbsp; <b>Ma:</b> bar " + (song.silenceBar + 1) : "");
    $("critScore").textContent = song.critic.score;
    $("critGrade").textContent = "Grade " + song.critic.grade + " · " + (song.critic.metrics.chordToneRate * 100 | 0) + "% strong-beat chord tones · VL " + song.critic.metrics.motion.toFixed(2) + " st";
    $("critIssues").innerHTML = song.critic.issues.map((x) => "<li>" + x + "</li>").join("");
    const d = A.SKILL_DIGEST || {};
    $("mathBox").innerHTML =
      (song.tuning === "just"
        ? "just: f = f<sub>0</sub> · ratio · 2<sup>oct</sup> (fifth = 3/2) · "
        : "12-TET: f = 440 · 2<sup>((m−69)/12)</sup> · ")
      + "piano f<sub>n</sub> = n f<sub>0</sub>√(1+B n²) · I(x)=1/(1+e<sup>−k(x−x₀)</sup>)<br>"
      + "Deep-Music 3,060 + theory 3,600 skills · " + ((song.deepActive || []).slice(0, 6).join(" · ") || "");
    if (song.chroma) document.body.style.background = "radial-gradient(1200px 620px at 50% -8%, " + song.chroma + " 0%, #0b0b14 48%, #07070d 100%)";
    A.drawScore($("roll"), song, false);
    A.drawTension($("spark"), song);
  }

  function stop() {
    A.stopPlayback();
    $("playBtn").disabled = false;
    $("stopBtn").disabled = true;
    if (song) A.drawScore($("roll"), song, false);
  }

  function play() {
    stop();
    song = A.compose(params());
    render();
    A.makeAudio();
    if (audioResume()) {}
    $("playBtn").disabled = true;
    $("stopBtn").disabled = false;
    A.schedule(song, () => { $("playBtn").disabled = false; $("stopBtn").disabled = true; A.drawScore($("roll"), song, false); }, $("loop").checked);
    A.drawScore($("roll"), song, true);
  }
  function audioResume() {
    const a = A.getAudio();
    if (a && a.ctx.resume) a.ctx.resume();
    return true;
  }

  function syncLabels() {
    $("tempoVal").textContent = $("tempo").value + " BPM";
    $("barsVal").textContent = $("bars").value + " bars";
    $("densVal").textContent = $("density").value + "%";
    $("weirdVal").textContent = $("weird").value + "%";
    $("intVal").textContent = $("intensity").value + "%";
  }

  $("playBtn").onclick = play;
  $("stopBtn").onclick = stop;
  $("newBtn").onclick = () => { $("seed").value = Math.random().toString(36).slice(2, 9); play(); };
  $("diceBtn").onclick = () => { $("seed").value = Math.random().toString(36).slice(2, 9); };
  $("midiBtn").onclick = () => { if (!song) { song = A.compose(params()); render(); } A.downloadMIDI(song); };
  $("jsonBtn").onclick = () => {
    if (!song) { song = A.compose(params()); render(); }
    const slim = Object.assign({}, song);
    A.saveBlob(new Blob([JSON.stringify(slim, null, 2)], { type: "application/json" }), song.name.replace(/\s+/g, "-") + "-recipe.json");
  };
  $("mood").onchange = (e) => {
    const m = A.STYLES[e.target.value]; if (!m) return;
    $("tempo").value = Math.round((m.tempo[0] + m.tempo[1]) / 2);
    $("weird").value = Math.round(m.weird * 100);
    $("density").value = Math.round((m.dens || 0.5) * 100);
    syncLabels();
  };
  ["tempo", "bars", "density", "weird", "intensity"].forEach((id) => $(id).addEventListener("input", syncLabels));
  syncLabels();
  song = A.compose(params());
  render();
})(window.Aether);
