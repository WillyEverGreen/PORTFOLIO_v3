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

  const sounds = {
    /* a vowel-ish meow: a buzzy tone whose pitch and filter glide up and back down */
    meow() {
      const t = ctx.currentTime;
      const len = 0.62;
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(760, t + 0.16);
      osc.frequency.exponentialRampToValueAtTime(520, t + len);
      const vibrato = ctx.createOscillator();
      const vibratoDepth = ctx.createGain();
      vibrato.frequency.value = 6;
      vibratoDepth.gain.value = 9;
      vibrato.connect(vibratoDepth);
      vibratoDepth.connect(osc.frequency);
      const formant = ctx.createBiquadFilter();
      formant.type = "bandpass";
      formant.Q.value = 4;
      formant.frequency.setValueAtTime(700, t);
      formant.frequency.exponentialRampToValueAtTime(1900, t + 0.18);
      formant.frequency.exponentialRampToValueAtTime(900, t + len);
      osc.connect(formant);
      formant.connect(envelope(t, 0.5, 0.05, len));
      osc.start(t);
      vibrato.start(t);
      osc.stop(t + len + 0.05);
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

    /* a low rumble pulsed about 25 times a second */
    purr() {
      const t = ctx.currentTime;
      const len = 1.3;
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = 52;
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 260;
      const pulse = ctx.createGain();
      pulse.gain.value = 0.5;
      const lfo = ctx.createOscillator();
      const lfoDepth = ctx.createGain();
      lfo.type = "square";
      lfo.frequency.value = 25;
      lfoDepth.gain.value = 0.5;
      lfo.connect(lfoDepth);
      lfoDepth.connect(pulse.gain);
      osc.connect(lowpass);
      lowpass.connect(pulse);
      pulse.connect(envelope(t, 0.55, 0.25, len));
      osc.start(t);
      lfo.start(t);
      osc.stop(t + len + 0.1);
      lfo.stop(t + len + 0.1);
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
