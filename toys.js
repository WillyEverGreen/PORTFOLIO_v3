/* Mango's toys. Every toy is a real rigid body (Matter.js): balls bounce and roll, the bell and the
   feather swing on ropes, the mouse and fish thud and slide. Drag a toy to throw it, tap it to poke it.
   A chest holds the rest of the toy box; Mango plays with at most three at a time. */
(() => {
  "use strict";

  const nook = document.getElementById("pjNook");
  if (!nook || typeof window.Matter === "undefined" || typeof window.gsap === "undefined") return;

  const { Engine, Bodies, Body, Composite, Constraint, Events, Sleeping } = Matter;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MAX_TOYS = 3;
  const STORE = "nookToys";

  const sfx = (name, volume) => { if (window.Sfx) Sfx.play(name, volume); };
  const mango = () => window.mangoNook || { say() {}, look() {} };

  /* ---------- the toys: look, size, physics and what Mango says ---------- */
  const ink = "stroke:var(--ink);stroke-width:3;stroke-linejoin:round;stroke-linecap:round";
  const TOYS = {
    ball: {
      label: "Ball", w: 52, h: 52, shape: "circle", bounce: 0.82, friction: 0.03, air: 0.004, sound: "boing",
      line: "Boing! Again, again!",
      art: `<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="27" style="fill:var(--accent);${ink}"/><path d="M11 20q19 10 38 0" style="fill:none;stroke:#fff;stroke-width:3.5;stroke-linecap:round;opacity:.9"/><path d="M12 42q18-8 36 0" style="fill:none;stroke:#fff;stroke-width:3.5;stroke-linecap:round;opacity:.9"/><ellipse cx="21" cy="17" rx="5" ry="3" transform="rotate(-30 21 17)" style="fill:#fff;opacity:.55"/></svg>`,
    },
    bell: {
      label: "Bell", w: 40, h: 56, shape: "circle", radius: 17, bounce: 0.35, friction: 0.05, air: 0.006, sound: "bell",
      rope: { x: 0.3, length: 0.24 }, line: "ting-a-ling! Was that dinner?",
      art: `<svg viewBox="0 0 44 56"><circle cx="22" cy="8.5" r="4.6" style="fill:none;stroke:var(--ink);stroke-width:2.8"/><circle cx="22" cy="34" r="19" style="fill:#f2b632;${ink}"/><path d="M5 34h34" style="fill:none;stroke:var(--ink);stroke-width:2.5"/><ellipse cx="22" cy="42" rx="4" ry="2.4" style="fill:var(--ink)"/><path d="M22 44v6" style="stroke:var(--ink);stroke-width:2.5;stroke-linecap:round"/><ellipse cx="14" cy="26" rx="4" ry="6" transform="rotate(25 14 26)" style="fill:#fff;opacity:.5"/></svg>`,
    },
    yarn: {
      label: "Yarn", w: 56, h: 56, shape: "circle", bounce: 0.3, friction: 0.5, air: 0.01, sound: "thud",
      line: "Yarn. My sworn enemy.",
      art: `<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="27" style="fill:var(--highlight);${ink}"/><path d="M8 22q22 10 44-4M5 34q26 12 50-6M12 47q20-6 36-24M24 5q-8 22 6 52M40 8q10 20 0 46" style="fill:none;stroke:var(--accent);stroke-width:3;stroke-linecap:round"/></svg>`,
    },
    mouse: {
      label: "Mouse", w: 76, h: 40, shape: "rect", chamfer: 14, bounce: 0.2, friction: 0.8, air: 0.012, sound: "squeak",
      line: "A mouse! ...it's a fake. Obviously.",
      art: `<svg viewBox="0 0 76 40"><path d="M60 24q14 2 14-12" style="fill:none;stroke:var(--ink);stroke-width:3;stroke-linecap:round"/><ellipse cx="34" cy="24" rx="30" ry="15" style="fill:#b9b4ab;${ink}"/><circle cx="30" cy="11" r="8" style="fill:#f4a6a0;${ink}"/><circle cx="12" cy="24" r="3" style="fill:#f4a6a0"/><circle cx="20" cy="21" r="2.2" style="fill:var(--ink)"/></svg>`,
    },
    fish: {
      label: "Fish", w: 84, h: 40, shape: "rect", chamfer: 14, bounce: 0.25, friction: 0.7, air: 0.012, sound: "thud",
      line: "Fish! Is it dinner time?",
      art: `<svg viewBox="0 0 84 40"><path d="M60 20l22-14v28z" style="fill:var(--accent);${ink}"/><ellipse cx="34" cy="20" rx="30" ry="15" style="fill:#f08a24;${ink}"/><path d="M44 6q6 14 0 28M54 9q5 11 0 22" style="fill:none;stroke:#fbe3c0;stroke-width:4;stroke-linecap:round"/><circle cx="16" cy="16" r="3.4" style="fill:var(--ink)"/></svg>`,
    },
    jingle: {
      label: "Jingle ball", w: 50, h: 50, shape: "circle", bounce: 0.85, friction: 0.03, air: 0.004, sound: "rattle",
      line: "It rattles! Something lives inside.",
      art: `<svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="25" style="fill:#f2b632;${ink}"/><circle cx="17" cy="19" r="4.5" style="fill:var(--ink)"/><circle cx="35" cy="14" r="4" style="fill:var(--ink)"/><circle cx="42" cy="30" r="4.5" style="fill:var(--ink)"/><circle cx="14" cy="36" r="4" style="fill:var(--ink)"/><circle cx="30" cy="44" r="4.5" style="fill:var(--ink)"/><circle cx="28" cy="28" r="6" style="fill:var(--accent);stroke:var(--ink);stroke-width:2.5"/></svg>`,
    },
    feather: {
      label: "Feather", w: 44, h: 90, shape: "rect", bounce: 0.2, friction: 0.1, air: 0.03, sound: "swish",
      rope: { x: 0.78, length: 0.3 }, line: "FEATHER! Must. Catch.",
      art: `<svg viewBox="0 0 44 90"><circle cx="22" cy="5" r="3.6" style="fill:none;stroke:var(--ink);stroke-width:2.6"/><path d="M22 9v14" style="fill:none;stroke:var(--ink);stroke-width:3;stroke-linecap:round"/><path d="M22 20c-14 6-18 30-10 52 4 8 18 8 20 0 6-22 2-46-10-52z" style="fill:var(--accent);${ink}"/><path d="M22 24v58" style="fill:none;stroke:var(--ink);stroke-width:2.5;stroke-linecap:round"/><path d="M22 36l-10-6M22 46l-12-6M22 56l-12-6M22 36l10-6M22 46l12-6M22 56l12-6" style="fill:none;stroke:#fbe3c0;stroke-width:2.5;stroke-linecap:round"/></svg>`,
    },
  };
  const DEFAULTS = ["ball", "bell"];

  /* ---------- chosen toys (remembered between visits) ---------- */
  const readChosen = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || "null");
      if (Array.isArray(saved)) return saved.filter((id) => TOYS[id]).slice(0, MAX_TOYS);
    } catch (e) { /* ignore */ }
    return DEFAULTS.slice();
  };
  const saveChosen = () => {
    try { localStorage.setItem(STORE, JSON.stringify([...toys.keys()])); } catch (e) { /* ignore */ }
  };

  /* ---------- world ---------- */
  const layer = document.createElement("div");
  layer.className = "pj-toys";
  layer.innerHTML = '<svg class="pj-ropes" aria-hidden="true"></svg>';
  nook.appendChild(layer);
  const ropesSvg = layer.querySelector(".pj-ropes");

  const engine = Engine.create({ gravity: { x: 0, y: 1 }, enableSleeping: true });
  let W = 0;
  let H = 0;
  let unit = 1;
  let floorY = 0;
  let statics = [];
  const toys = new Map(); /* id -> { id, def, body, el, rope, line, w, h } */

  const measure = () => {
    W = nook.clientWidth;
    H = nook.clientHeight;
    unit = W / 560;
    floorY = H - 26 * unit; /* toys rest just above the caption */
  };

  const buildStatics = () => {
    Composite.remove(engine.world, statics);
    const t = 200;
    const wall = (x, y, w, h) => Bodies.rectangle(x, y, w, h, { isStatic: true, restitution: 0.5, friction: 0.4 });
    /* the chest is solid: toys can be thrown onto its lid-line and rest there */
    const chestTop = chest.offsetTop + chest.offsetHeight * 0.5;
    const chestBox = Bodies.rectangle(
      chest.offsetLeft + chest.offsetWidth / 2,
      (chestTop + floorY) / 2,
      chest.offsetWidth * 0.9,
      Math.max(10, floorY - chestTop),
      { isStatic: true, restitution: 0.4, friction: 0.5 }
    );
    statics = [
      chestBox,
      wall(W / 2, floorY + t / 2, W * 3, t),
      wall(-t / 2 + 6 * unit, H / 2, t, H * 6),
      wall(W + t / 2 - 6 * unit, H / 2, t, H * 6),
      wall(W / 2, -H * 0.9 - t / 2, W * 3, t),
    ];
    Composite.add(engine.world, statics);
  };

  /* ---------- creating and removing toys ---------- */
  const createToy = (id, { drop = true } = {}) => {
    const def = TOYS[id];
    const w = def.w * unit;
    const h = def.h * unit;
    const el = document.createElement("div");
    el.className = "pj-t pj-t--" + id;
    el.style.width = w + "px";
    el.style.height = h + "px";
    /* physics owns the outer element's transform; GSAP only ever touches the inner wrapper */
    el.innerHTML = `<div class="pj-t__in">${def.art}</div>`;
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.setAttribute("aria-label", def.label + ": drag it, throw it, or press Enter to poke it");
    layer.appendChild(el);

    let x = w + Math.random() * (W - w * 2);
    let y = drop ? -h - Math.random() * 60 : floorY - h;
    const opts = { restitution: def.bounce, friction: def.friction, frictionAir: def.air, sleepThreshold: 90 };
    let body;
    let rope = null;
    let line = null;
    let hook = null;

    if (def.rope) {
      const anchor = { x: W * def.rope.x, y: 2 * unit };
      const length = H * def.rope.length;
      const swing = (Math.random() < 0.5 ? -1 : 1) * 0.7;
      x = anchor.x + Math.sin(swing) * length;
      y = anchor.y + Math.cos(swing) * length;
      body = def.shape === "circle"
        ? Bodies.circle(x, y, def.radius * unit, { ...opts, density: 0.003 })
        : Bodies.rectangle(x, y, w * 0.55, h * 0.8, { ...opts, density: 0.0018 });
      /* the rope is tied at the small loop at the top of each toy's artwork */
      const topOffset = -h * 0.44;
      rope = Constraint.create({ pointA: anchor, bodyB: body, pointB: { x: 0, y: topOffset }, length, stiffness: 0.95, damping: 0.01 });
      Composite.add(engine.world, [body, rope]);
      line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("class", "pj-rope");
      ropesSvg.appendChild(line);
      /* a little hook so the rope has something to hang from */
      hook = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      hook.setAttribute("class", "pj-hook");
      hook.setAttribute("cx", anchor.x);
      hook.setAttribute("cy", anchor.y);
      hook.setAttribute("r", 4.5 * unit);
      ropesSvg.appendChild(hook);
    } else if (def.shape === "circle") {
      body = Bodies.circle(x, y, w / 2 - 2 * unit, opts);
      Composite.add(engine.world, body);
    } else {
      body = Bodies.rectangle(x, y, w, h * 0.8, { ...opts, chamfer: { radius: Math.min(def.chamfer * unit, h * 0.38) } });
      Composite.add(engine.world, body);
    }
    if (drop) Body.setAngle(body, (Math.random() - 0.5) * 1.4);
    body.plugin.toy = id;

    const toy = { id, def, body, el, rope, line, hook, w, h, lastSound: 0 };
    toys.set(id, toy);
    bindToy(toy);
    draw(toy);
    if (drop) gsap.fromTo(el.firstElementChild, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(2)", clearProps: "all" });
    return toy;
  };

  const removeToy = (id) => {
    const toy = toys.get(id);
    if (!toy) return;
    toys.delete(id);
    const finish = () => {
      Composite.remove(engine.world, [toy.body, ...(toy.rope ? [toy.rope] : [])]);
      toy.el.remove();
    };
    if (toy.line) toy.line.remove();
    if (toy.hook) toy.hook.remove();
    if (reduceMotion) return finish();
    gsap.to(toy.el.firstElementChild, { opacity: 0, scale: 0.2, duration: 0.3, ease: "back.in(2)", onComplete: finish });
  };

  /* ---------- drawing ---------- */
  function draw(toy) {
    const { body, el, w, h } = toy;
    el.style.transform = `translate(${body.position.x - w / 2}px, ${body.position.y - h / 2}px) rotate(${body.angle}rad)`;
    if (toy.rope) {
      /* Matter turns constraint.pointB with the body on every step, so it is already the offset from the
         body's centre to the rope's tie point in world space. Rotating it again would pull the rope off the toy. */
      const tie = toy.rope.pointB;
      toy.line.setAttribute("x1", toy.rope.pointA.x);
      toy.line.setAttribute("y1", toy.rope.pointA.y);
      toy.line.setAttribute("x2", body.position.x + tie.x);
      toy.line.setAttribute("y2", body.position.y + tie.y);
    }
  }

  /* ---------- poking, dragging and throwing ---------- */
  const wakeBody = (body) => Sleeping.set(body, false);
  const kick = (body, vx, vy, spin = 0) => {
    wakeBody(body);
    Body.setVelocity(body, { x: vx * unit, y: vy * unit });
    Body.setAngularVelocity(body, spin);
  };

  const poke = (toy) => {
    const dir = Math.random() < 0.5 ? -1 : 1;
    if (toy.def.rope) kick(toy.body, dir * 9, -3, dir * 0.1);
    else kick(toy.body, dir * 5, -11, dir * 0.25);
    sfx(toy.def.sound, 0.8);
    mango().say(toy.def.line, 2600, "excited", { key: "tap:" + toy.id });
  };

  let drag = null;
  const localPoint = (e) => {
    const r = nook.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  function bindToy(toy) {
    const { el, body } = toy;
    el.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || reduceMotion) return;
      e.preventDefault();
      const p = localPoint(e);
      wakeBody(body);
      const c = Constraint.create({
        pointA: p, bodyB: body, pointB: { x: p.x - body.position.x, y: p.y - body.position.y },
        length: 0, stiffness: 0.14, damping: 0.12,
      });
      Composite.add(engine.world, c);
      drag = { toy, c, x: e.clientX, y: e.clientY, moved: 0 };
      el.setPointerCapture(e.pointerId);
      el.classList.add("is-held");
    });
    el.addEventListener("pointermove", (e) => {
      if (!drag || drag.toy !== toy) return;
      drag.c.pointA = localPoint(e);
      drag.moved += Math.hypot(e.clientX - drag.x, e.clientY - drag.y);
      drag.x = e.clientX;
      drag.y = e.clientY;
      wakeBody(body);
    });
    const release = () => {
      if (!drag || drag.toy !== toy) return;
      Composite.remove(engine.world, drag.c);
      el.classList.remove("is-held");
      const tapped = drag.moved < 6;
      drag = null;
      if (tapped) poke(toy);
    };
    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", release);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        poke(toy);
      }
    });
  }

  /* ---------- Mango bats a toy when you pet him ---------- */
  window.addEventListener("nook:pet", () => {
    const list = [...toys.values()];
    if (!list.length) return;
    const toy = list[Math.floor(Math.random() * list.length)];
    const dir = toy.body.position.x < W / 2 ? 1 : -1;
    window.setTimeout(() => {
      if (toy.def.rope) kick(toy.body, dir * 8, -2, 0.08 * dir);
      else kick(toy.body, dir * 7, -8, dir * 0.3);
    }, 250);
  });

  /* ---------- collisions make sounds, louder for harder hits ---------- */
  Events.on(engine, "collisionStart", (event) => {
    const now = performance.now();
    event.pairs.forEach(({ bodyA, bodyB }) => {
      const speed = Math.hypot(bodyA.velocity.x - bodyB.velocity.x, bodyA.velocity.y - bodyB.velocity.y) / unit;
      if (speed < 3) return;
      [bodyA, bodyB].forEach((b) => {
        const toy = b.plugin.toy && toys.get(b.plugin.toy);
        if (!toy || now - toy.lastSound < 110) return;
        toy.lastSound = now;
        const hitsToy = (bodyA.plugin.toy && bodyB.plugin.toy);
        const name = toy.def.rope ? toy.def.sound : hitsToy ? "thud" : toy.def.sound;
        sfx(name, Math.min(1, speed / 16));
      });
    });
  });

  /* ---------- the loop ---------- */
  let lastLook = 0;
  const lastSwing = new Map();
  const tick = (_, deltaMs) => {
    Engine.update(engine, Math.min(deltaMs, 32));
    const now = performance.now();
    let fastest = null;
    let fastSpeed = 0;
    toys.forEach((toy) => {
      const { body, def } = toy;
      /* friction against the floor slows a rolling toy to a stop instead of letting it glide for ever */
      if (!def.rope && body.position.y > floorY - toy.h * 0.7 && !body.isSleeping) {
        Body.setAngularVelocity(body, body.angularVelocity * 0.993);
        Body.setVelocity(body, { x: body.velocity.x * 0.996, y: body.velocity.y });
      }
      const speed = Math.hypot(body.velocity.x, body.velocity.y) / unit;
      if (speed > fastSpeed) { fastSpeed = speed; fastest = toy; }
      /* ropes: ring or whoosh when the toy is swung hard */
      if (def.rope && speed > 7 && now - (lastSwing.get(toy.id) || 0) > 420) {
        lastSwing.set(toy.id, now);
        sfx(def.sound, Math.min(1, speed / 18));
      }
      draw(toy);
    });
    /* Mango's eyes follow the liveliest toy */
    if (fastest && fastSpeed > 5 && now - lastLook > 160) {
      lastLook = now;
      const r = nook.getBoundingClientRect();
      mango().look(r.left + fastest.body.position.x, r.top + fastest.body.position.y);
    }
  };

  let running = false;
  const setRunning = (on) => {
    if (on === running || reduceMotion) return;
    running = on;
    if (on) gsap.ticker.add(tick);
    else gsap.ticker.remove(tick);
  };

  /* ---------- the toy chest and its picker ---------- */
  /* fixed wood colours on purpose, so the chest looks the same in light and dark mode */
  const WOOD = "#b9783a";
  const WOOD_LIGHT = "#d99a52";
  const OUTLINE = "stroke:#1c1b18;stroke-width:3;stroke-linejoin:round;stroke-linecap:round";
  const chest = document.createElement("button");
  chest.type = "button";
  chest.className = "pj-chest";
  chest.id = "pjChest";
  chest.setAttribute("aria-expanded", "false");
  chest.setAttribute("aria-controls", "pjToyPanel");
  chest.setAttribute("aria-label", "Open the toy chest");
  chest.innerHTML = `
    <svg viewBox="0 -10 120 106" aria-hidden="true">
      <g class="pj-chest__open">
        <path d="M14 42L21 10Q23 3 31 3H89Q97 3 99 10L106 42Z" style="fill:#8f5b2c;${OUTLINE}"/>
        <path d="M27 36L32 12H88L93 36Z" style="fill:#a96f38;stroke:#1c1b18;stroke-width:2;opacity:.9"/>
        <path d="M38 12v24M82 12v24" style="fill:none;stroke:var(--accent);stroke-width:7"/>
        <path d="M14 42h92v6H14z" style="fill:#2b2320"/>
        <g class="pj-chest__stuff">
          <circle cx="42" cy="44" r="11" style="fill:var(--accent);${OUTLINE}"/>
          <path d="M37 40q5 4 10 0" style="fill:none;stroke:#fff;stroke-width:2.4;stroke-linecap:round"/>
          <path d="M58 46l9-16 9 16z" style="fill:#f08a24;${OUTLINE}"/>
          <ellipse cx="86" cy="45" rx="12" ry="7" style="fill:#b9b4ab;${OUTLINE}"/>
          <circle cx="92" cy="37" r="4.4" style="fill:#f4a6a0;${OUTLINE}"/>
        </g>
      </g>
      <rect x="8" y="46" width="104" height="44" rx="6" style="fill:${WOOD};${OUTLINE}"/>
      <path d="M8 62h104M8 76h104" style="fill:none;stroke:#1c1b18;stroke-width:2;opacity:.35"/>
      <rect x="22" y="46" width="12" height="44" style="fill:var(--accent);${OUTLINE}"/>
      <rect x="86" y="46" width="12" height="44" style="fill:var(--accent);${OUTLINE}"/>
      <rect x="50" y="52" width="20" height="16" rx="3" style="fill:#f2b632;${OUTLINE}"/>
      <circle cx="60" cy="60" r="2.6" style="fill:#1c1b18"/>
      <g class="pj-chest__lid">
        <path d="M8 50V38Q8 16 60 16t52 22v12z" style="fill:${WOOD_LIGHT};${OUTLINE}"/>
        <rect x="21" y="19" width="14" height="31" style="fill:var(--accent);${OUTLINE}"/>
        <rect x="85" y="19" width="14" height="31" style="fill:var(--accent);${OUTLINE}"/>
        <rect x="52" y="42" width="16" height="14" rx="3" style="fill:#f2b632;${OUTLINE}"/>
        <circle cx="60" cy="49" r="2.4" style="fill:#1c1b18"/>
      </g>
      <path d="M2 92h116" style="stroke:#1c1b18;stroke-width:3;stroke-linecap:round"/>
    </svg>`;
  layer.appendChild(chest);

  const panel = document.createElement("div");
  panel.className = "pj-toypanel";
  panel.id = "pjToyPanel";
  panel.hidden = true;
  panel.innerHTML = `
    <p class="pj-toypanel__head">Toy chest <span class="pj-toypanel__note">pick up to ${MAX_TOYS}</span> <span class="pj-toypanel__count" id="pjToyCount"></span></p>
    <ul class="pj-toypanel__list">
      ${Object.entries(TOYS)
        .map(([id, d]) => `<li><button type="button" class="pj-pick" data-toy="${id}" aria-pressed="false"><span class="pj-pick__art">${d.art}</span><span>${d.label}</span></button></li>`)
        .join("")}
    </ul>`;
  layer.appendChild(panel);
  const countEl = panel.querySelector("#pjToyCount");

  const syncPanel = () => {
    countEl.textContent = `${toys.size} / ${MAX_TOYS}`;
    panel.querySelectorAll(".pj-pick").forEach((b) => b.setAttribute("aria-pressed", String(toys.has(b.dataset.toy))));
  };

  const setOpen = (open) => {
    panel.hidden = !open;
    chest.classList.toggle("is-open", open);
    nook.classList.toggle("is-picking", open);
    chest.setAttribute("aria-expanded", String(open));
    chest.setAttribute("aria-label", open ? "Close the toy chest" : "Open the toy chest");
    if (open) {
      sfx("thud", 0.5);
      mango().say("Ooh, my toy chest! Pick up to three.", 2600, "excited", { key: "chest" });
      if (!reduceMotion) gsap.fromTo(panel, { opacity: 0, y: -14, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(1.6)" });
    }
  };

  chest.addEventListener("click", () => setOpen(panel.hidden));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) setOpen(false); });
  document.addEventListener("pointerdown", (e) => {
    if (!panel.hidden && !e.target.closest(".pj-toypanel, .pj-chest")) setOpen(false);
  });

  panel.addEventListener("click", (e) => {
    const btn = e.target.closest(".pj-pick");
    if (!btn) return;
    const id = btn.dataset.toy;
    if (toys.has(id)) {
      removeToy(id);
    } else if (toys.size >= MAX_TOYS) {
      mango().say("Three toys is plenty! Put one back first.", 2600, "curious", { force: true });
      if (!reduceMotion) gsap.fromTo(panel, { x: -6 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
      return;
    } else {
      createToy(id);
      sfx("thud", 0.4);
      mango().say(TOYS[id].line, 2400, "happy", { key: "add:" + id });
      if (reduceMotion) settle();
    }
    saveChosen();
    syncPanel();
  });

  /* ---------- start up ---------- */
  function settle() {
    for (let i = 0; i < 500; i++) Engine.update(engine, 1000 / 60);
    toys.forEach(draw);
  }

  const build = () => {
    measure();
    buildStatics();
    readChosen().forEach((id) => createToy(id, { drop: !reduceMotion }));
    if (reduceMotion) settle();
    syncPanel();
  };

  const clearAll = () => {
    [...toys.keys()].forEach((id) => {
      const toy = toys.get(id);
      toys.delete(id);
      Composite.remove(engine.world, [toy.body, ...(toy.rope ? [toy.rope] : [])]);
      toy.el.remove();
      if (toy.line) toy.line.remove();
      if (toy.hook) toy.hook.remove();
    });
  };

  build();
  if (!reduceMotion) new IntersectionObserver(([entry]) => setRunning(entry.isIntersecting), { threshold: 0.05 }).observe(nook);

  /* the toys are sized to the scene, so a resize starts them again with the same choice */
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const chosen = [...toys.keys()];
      clearAll();
      measure();
      buildStatics();
      chosen.forEach((id) => createToy(id, { drop: false }));
      if (reduceMotion) settle();
    }, 250);
  });
})();
