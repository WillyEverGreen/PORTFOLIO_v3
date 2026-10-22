/* Tiny sound kit for Mango and his toys, synthesised with the Web Audio API (no audio files).
   Sounds only ever play after a click or tap, and the mute button in the nav switches them all off. */
(() => {
  "use strict";

  const KEY = "sfxMuted";
  let ctx = null;
  let master = null;
  let muted = false;
  try { muted = localStorage.getItem(KEY) === "1"; } catch (e) { /* storage can be blocked */ }

  const ensure = () => {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
      master = ctx.createGain();
      master.gain.value = 0.55;
      /* a gentle limiter so overlapping sounds never clip */
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp);
      comp.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  };

  let noiseBuffer = null;
  let meowWave = null; /* built once, the soft voice for the meow */
  const noise = () => {
    if (!noiseBuffer) {
      noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    return src;
  };

  /* a gain node that rises quickly and fades out, wired to the master bus */
  let level = 1; /* 0..1, set per play() so hard hits sound louder than soft ones */
  const envelope = (t, peak, attack, length) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * level), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + length);
    g.connect(master);
    return g;
  };

  /* Real meows (Pixabay, free to use). They load after the first click so a first visit pays
     nothing, and until they arrive (or if they never do) the synthesised meow plays instead. */
  const MEOW_FILES = ["audio/meow-kitten.mp3", "audio/meow-cat.mp3"];
  let meows = [];
  let meowsReady = null; /* a promise once loading has started */
  let lastMeow = -1;
  const loadMeows = () => {
    if (meowsReady || !ctx) return meowsReady;
    meowsReady = Promise.all(MEOW_FILES.map((url) =>
      fetch(url)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
        .then((data) => ctx.decodeAudioData(data))
        .then((buffer) => {
          /* even out the two recordings so neither is louder than the other */
          let peak = 0;
          for (let c = 0; c < buffer.numberOfChannels; c++) {
            const d = buffer.getChannelData(c);
            for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
          }
          meows.push({ buffer, gain: peak > 0 ? 0.32 / peak : 1 });
        })
        .catch(() => { /* this one stays out; the synthesised meow covers for it */ })
    ));
    return meowsReady;
  };
  /* start fetching on the visitor's first touch anywhere, so the files are usually in by the
     time they pet Mango (audio may only start after a gesture, so this is the earliest point) */
  window.addEventListener("pointerdown", () => { if (!muted && ensure()) loadMeows(); }, { once: true, passive: true });

  const playMeow = () => {
    /* never the same recording twice in a row */
    let i = Math.floor(Math.random() * meows.length);
    if (meows.length > 1 && i === lastMeow) i = (i + 1) % meows.length;
    lastMeow = i;
    const { buffer, gain } = meows[i];
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = 0.96 + Math.random() * 0.08; /* a touch of variety */
    const g = ctx.createGain();
    g.gain.value = gain * level;
    src.connect(g);
    g.connect(master);
    src.start();
  };

  const sounds = {
    meow() {
      if (meows.length) return playMeow();
      /* still loading: wait a moment for a real one, otherwise use the synthesised meow */
      const pending = loadMeows();
      if (!pending) return sounds.meowSynth();
      const lvl = level;
      Promise.race([pending, new Promise((r) => setTimeout(r, 500))]).then(() => {
        level = lvl;
        if (meows.length) playMeow();
        else sounds.meowSynth();
      });
    },

    meowSynth() {
      const t = ctx.currentTime;
      const len = 0.46;
      if (!meowWave) {
        const n = 24, real = new Float32Array(n), imag = new Float32Array(n);
        for (let k = 1; k < n; k++) imag[k] = 1 / Math.pow(k, 1.35);
        meowWave = ctx.createPeriodicWave(real, imag);
      }
      const voice = ctx.createOscillator();
      voice.setPeriodicWave(meowWave);
      voice.frequency.setValueAtTime(640, t);
      voice.frequency.exponentialRampToValueAtTime(960, t + 0.12);
      voice.frequency.exponentialRampToValueAtTime(760, t + 0.28);
      voice.frequency.exponentialRampToValueAtTime(580, t + len);
      /* a gentle wobble once the note is sounding */
      const vibrato = ctx.createOscillator();
      const vibratoDepth = ctx.createGain();
      vibrato.frequency.value = 6;
      vibratoDepth.gain.setValueAtTime(0, t);
      vibratoDepth.gain.linearRampToValueAtTime(10, t + 0.18);
      vibrato.connect(vibratoDepth);
      vibratoDepth.connect(voice.frequency);
      /* the "m": the mouth opens over the first 70 ms */
      const mouth = ctx.createBiquadFilter();
      mouth.type = "lowpass";
      mouth.Q.value = 0.7;
      mouth.frequency.setValueAtTime(700, t);
      mouth.frequency.exponentialRampToValueAtTime(5000, t + 0.07);
      mouth.frequency.exponentialRampToValueAtTime(2600, t + len);
      voice.connect(mouth);
      const out = ctx.createGain();
      out.gain.setValueAtTime(0.0001, t);
      out.gain.exponentialRampToValueAtTime(0.085 * level, t + 0.035);
      out.gain.setValueAtTime(0.085 * level, t + 0.26);
      out.gain.exponentialRampToValueAtTime(0.0001, t + len);
      out.connect(master);
      /* vowel resonances: ee, then ah, then oo */
      const formant = (f0, f1, f2, q, gain) => {
        const f = ctx.createBiquadFilter();
        f.type = "bandpass";
        f.Q.value = q;
        f.frequency.setValueAtTime(f0, t);
        f.frequency.exponentialRampToValueAtTime(f1, t + 0.15);
        f.frequency.exponentialRampToValueAtTime(f2, t + len);
        const g = ctx.createGain();
        g.gain.value = gain;
        mouth.connect(f);
        f.connect(g);
        g.connect(out);
      };
      formant(380, 900, 520, 5, 1.1);
      formant(2300, 1500, 1000, 7, 0.7);
      /* a little of the plain voice keeps it warm rather than whistly */
      const body = ctx.createGain();
      body.gain.value = 0.18;
      mouth.connect(body);
      body.connect(out);
      voice.start(t);
      vibrato.start(t);
      voice.stop(t + len + 0.05);
      vibrato.stop(t + len + 0.05);
    },

    /* a short rising trill, the "mrrp" a cat makes when it wakes up */
    chirp() {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(330, t);
      osc.frequency.exponentialRampToValueAtTime(560, t + 0.14);
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = 28;
      depth.gain.value = 30;
      lfo.connect(depth);
      depth.connect(osc.frequency);
      osc.connect(envelope(t, 0.35, 0.02, 0.2));
      osc.start(t);
      lfo.start(t);
      osc.stop(t + 0.25);
      lfo.stop(t + 0.25);
    },

    hiss() {
      const t = ctx.currentTime;
      const src = noise();
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 3800;
      src.connect(hp);
      hp.connect(envelope(t, 0.4, 0.05, 0.55));
      src.start(t);
      src.stop(t + 0.6);
    },

    /* bright metal partials, struck three times like a jingle */
    bell() {
      const t0 = ctx.currentTime;
      [0, 0.16, 0.34].forEach((offset, hit) => {
        const t = t0 + offset;
        [2093, 3136, 4200, 5330].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.value = freq * (1 + hit * 0.004);
          osc.connect(envelope(t, 0.22 / (i + 1), 0.004, 0.9 - i * 0.15));
          osc.start(t);
          osc.stop(t + 1);
        });
      });
    },

    /* the ball with a bell inside: a clattering shake then a small ping */
    rattle() {
      const t0 = ctx.currentTime;
      for (let i = 0; i < 7; i++) {
        const t = t0 + i * 0.055;
        const src = noise();
        const band = ctx.createBiquadFilter();
        band.type = "bandpass";
        band.frequency.value = 3200 + Math.random() * 2200;
        band.Q.value = 5;
        src.connect(band);
        band.connect(envelope(t, 0.28, 0.003, 0.06));
        src.start(t, Math.random());
        src.stop(t + 0.08);
      }
      const ping = ctx.createOscillator();
      ping.frequency.value = 2637;
      ping.connect(envelope(t0 + 0.2, 0.18, 0.004, 0.5));
      ping.start(t0 + 0.2);
      ping.stop(t0 + 0.75);
    },

    /* a rubbery bounce */
    boing() {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.22);
      osc.connect(envelope(t, 0.5, 0.01, 0.28));
      osc.start(t);
      osc.stop(t + 0.3);
    },

    /* a soft landing: a short low thump */
    thud() {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);
      osc.connect(envelope(t, 0.6, 0.004, 0.16));
      osc.start(t);
      osc.stop(t + 0.2);
    },

    /* a squeaky toy mouse */
    squeak() {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(1500, t);
      osc.frequency.exponentialRampToValueAtTime(2500, t + 0.07);
      osc.frequency.exponentialRampToValueAtTime(1900, t + 0.14);
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 2200;
      band.Q.value = 2;
      osc.connect(band);
      band.connect(envelope(t, 0.22, 0.01, 0.17));
      osc.start(t);
      osc.stop(t + 0.2);
    },

    /* feathers whipping through the air */
    swish() {
      const t = ctx.currentTime;
      const src = noise();
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.Q.value = 1.2;
      band.frequency.setValueAtTime(1200, t);
      band.frequency.exponentialRampToValueAtTime(5200, t + 0.28);
      src.connect(band);
      band.connect(envelope(t, 0.35, 0.08, 0.38));
      src.start(t);
      src.stop(t + 0.4);
    },
  };

  const listeners = new Set();
  const api = {
    play(name, volume = 1) {
      if (muted || !sounds[name]) return;
      level = Math.max(0.08, Math.min(1, volume));
      /* browsers only allow audio after a click or tap; anything earlier is skipped, not queued */
      if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
      if (!ensure()) return;
      if (ctx.state !== "running") return;
      sounds[name]();
    },
    get muted() { return muted; },
    set muted(value) {
      muted = Boolean(value);
      try { localStorage.setItem(KEY, muted ? "1" : "0"); } catch (e) { /* ignore */ }
      listeners.forEach((fn) => fn(muted));
    },
    onChange(fn) { listeners.add(fn); },
  };
  window.Sfx = api;

  /* the mute button in the nav */
  const btn = document.getElementById("sfxBtn");
  if (btn) {
    const sync = () => {
      btn.setAttribute("aria-pressed", String(muted));
      btn.setAttribute("aria-label", muted ? "Turn sounds on" : "Turn sounds off");
      btn.classList.toggle("is-muted", muted);
    };
    sync();
    btn.addEventListener("click", () => {
      api.muted = !muted;
      if (!api.muted) api.play("chirp");
    });
    api.onChange(sync);
  }
})();
