(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  const animate = hasGsap && !reduceMotion;

  /* =====================================================================
     Small helpers
  ===================================================================== */
  const root = document.documentElement;

  const burst = (x, y, count = 22) => {
    if (!animate) return;
    const colors = ["#d9481c", "#f0d98a", "#2f7d5b", "#1c1b18", "#ff7a4d"];
    for (let i = 0; i < count; i++) {
      const piece = document.createElement("span");
      piece.className = "confetti";
      const round = Math.random() > 0.5;
      piece.style.background = colors[i % colors.length];
      piece.style.borderRadius = round ? "50%" : "2px";
      document.body.appendChild(piece);
      const angle = Math.random() * Math.PI * 2;
      const dist = 70 + Math.random() * 130;
      gsap.set(piece, { x, y, rotation: Math.random() * 360, scale: 0.6 + Math.random() * 0.9 });
      gsap.to(piece, {
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist + 60,
        rotation: "+=" + (200 + Math.random() * 300),
        opacity: 0,
        duration: 0.9 + Math.random() * 0.6,
        ease: "power3.out",
        onComplete: () => piece.remove(),
      });
    }
  };

  /* =====================================================================
     Things that never need GSAP
  ===================================================================== */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const clock = $("#clock");
  const tickClock = () => {
    if (!clock) return;
    const t = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date());
    clock.textContent = "Mumbai, " + t + " local time";
  };
  tickClock();
  setInterval(tickClock, 30000);

  /* ----- theme ----- */
  const themeBtn = $("#themeBtn");
  const themeMeta = $('meta[name="theme-color"]');
  const syncTheme = () => {
    const dark = root.getAttribute("data-theme") === "dark";
    themeBtn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    if (themeMeta) themeMeta.setAttribute("content", dark ? "#151412" : "#f3ede2");
  };
  syncTheme();
  themeBtn.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) { /* storage can be blocked */ }
    syncTheme();
  });

  /* ----- mobile menu ----- */
  const menuBtn = $("#menuBtn");
  const sheet = $("#sheet");
  const setMenu = (open) => {
    sheet.classList.toggle("is-open", open);
    sheet.setAttribute("aria-hidden", String(!open));
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("menu-open", open);
  };
  menuBtn.addEventListener("click", () => setMenu(!sheet.classList.contains("is-open")));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  /* ----- split the about paragraph into words ----- */
  const aboutText = $("#aboutText");
  if (aboutText) {
    aboutText.innerHTML = aboutText.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
  }

  /* ----- in-page links ----- */
  const goTo = (id) => {
    const behavior = reduceMotion ? "auto" : "smooth";
    if (id === "#top") return window.scrollTo({ top: 0, behavior });
    const target = $(id);
    if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 10, behavior });
  };
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      e.preventDefault();
      const wasOpen = sheet.classList.contains("is-open");
      setMenu(false);
      setTimeout(() => goTo(id), wasOpen ? 250 : 0);
    });
  });

  /* ----- project details dialog ----- */
  const dialog = $("#dialog");
  const dialogBody = $("#dialogBody");
  let lastOpener = null;

  const openProject = (key, opener) => {
    const tpl = $("#t-" + key);
    if (!tpl) return;
    lastOpener = opener || null;
    dialogBody.innerHTML = "";
    dialogBody.appendChild(tpl.content.cloneNode(true));
    root.style.overflow = "hidden";
    dialog.showModal();
    const focusClose = () => $("#dialogClose").focus({ preventScroll: true });
    focusClose();
    requestAnimationFrame(focusClose);
    setTimeout(focusClose, 120);
    if (animate) {
      /* animate the inner wrapper: transforming the <dialog> itself makes GSAP re-append it and drops it out of the top layer */
      gsap.fromTo(dialogBody, { opacity: 0, y: 30, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "power3.out" });
      gsap.fromTo($$("li", dialogBody), { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.45, stagger: 0.08, delay: 0.15, ease: "power2.out" });
    }
  };
  const closeProject = () => {
    if (!dialog.open) return;
    if (animate) {
      gsap.to(dialogBody, { opacity: 0, y: 20, scale: 0.97, duration: 0.25, ease: "power2.in", onComplete: () => dialog.close() });
    } else {
      dialog.close();
    }
  };
  dialog.addEventListener("close", () => {
    root.style.overflow = "";
    if (hasGsap) gsap.set(dialogBody, { clearProps: "all" });
    if (lastOpener) lastOpener.focus({ preventScroll: true });
  });
  dialog.addEventListener("cancel", (e) => { e.preventDefault(); closeProject(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dialog.open) { e.preventDefault(); closeProject(); }
  });
  dialog.addEventListener("click", (e) => { if (e.target === dialog) closeProject(); });
  $("#dialogClose").addEventListener("click", closeProject);

  $$("[data-open]").forEach((btn) => btn.addEventListener("click", () => openProject(btn.dataset.open, btn)));
  $$(".card[data-project]").forEach((card) => {
    $(".card__body", card).addEventListener("click", (e) => {
      if (e.target.closest("a, button")) return;
      openProject(card.dataset.project, $(".more", card));
    });
  });

  /* ----- copy email ----- */
  const copyBtn = $("#copyBtn");
  const mail = $("#mailLink").textContent.trim();
  copyBtn.addEventListener("click", async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(mail);
      ok = true;
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = mail;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
      ta.remove();
    }
    copyBtn.textContent = ok ? "Copied!" : "Press Ctrl+C";
    copyBtn.classList.toggle("is-done", ok);
    if (ok) {
      const r = copyBtn.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2);
    }
    setTimeout(() => {
      copyBtn.textContent = "Copy email";
      copyBtn.classList.remove("is-done");
    }, 2000);
  });

  /* ----- say hello ----- */
  $("#scribble").addEventListener("click", (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 26);
    if (animate) gsap.fromTo(e.currentTarget, { rotation: -6 }, { rotation: 0, duration: 0.8, ease: "elastic.out(1, 0.35)" });
  });

  /* ----- the knight board ----- */
  (() => {
    const board = $("#board");
    const knight = $("#knight");
    const countEl = $("#chessCount");
    const msg = $("#chessMsg");
    const reset = $("#chessReset");
    const files = "abcdefgh";
    const jumps = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
    const squares = [];
    let pos, visited, moves, busy;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "sq " + ((r + c) % 2 === 0 ? "light" : "dark");
        b.dataset.r = r;
        b.dataset.c = c;
        b.addEventListener("click", () => tryMove(r, c, b));
        board.insertBefore(b, knight);
        squares.push(b);
      }
    }

    const sq = (r, c) => squares[r * 8 + c];
    const place = (r, c, instant) => {
      if (animate && !instant) {
        gsap.to(knight, { xPercent: c * 100, yPercent: r * 100, duration: 0.5, ease: "power2.inOut" });
        gsap.fromTo(knight, { scale: 1 }, { scale: 1.35, duration: 0.25, yoyo: true, repeat: 1, ease: "sine.inOut" });
      } else {
        if (hasGsap) gsap.set(knight, { xPercent: c * 100, yPercent: r * 100 });
        else knight.style.transform = `translate(${c * 100}%, ${r * 100}%)`;
      }
    };
    const legalFrom = (r, c) =>
      jumps.map(([dr, dc]) => [r + dr, c + dc]).filter(([nr, nc]) => nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && !visited.has(nr * 8 + nc));

    const paint = () => {
      const legal = new Set(legalFrom(pos[0], pos[1]).map(([r, c]) => r * 8 + c));
      squares.forEach((s, i) => {
        const r = Math.floor(i / 8), c = i % 8;
        const isLegal = legal.has(i);
        s.classList.toggle("legal", isLegal);
        s.tabIndex = isLegal ? 0 : -1;
        s.setAttribute("aria-label", `${files[c]}${8 - r}${visited.has(i) ? ", visited" : ""}${isLegal ? ", legal move" : ""}`);
      });
      countEl.textContent = visited.size;
    };

    const start = () => {
      pos = [7, 1];
      visited = new Map([[7 * 8 + 1, 1]]);
      moves = 0;
      busy = false;
      squares.forEach((s) => { s.classList.remove("visited"); s.removeAttribute("data-n"); });
      sq(7, 1).classList.add("visited");
      sq(7, 1).dataset.n = 1;
      place(7, 1, true);
      msg.textContent = "";
      paint();
    };

    const tryMove = (r, c, el) => {
      if (busy) return;
      const ok = legalFrom(pos[0], pos[1]).some(([nr, nc]) => nr === r && nc === c);
      if (!ok) {
        el.classList.remove("shake");
        void el.offsetWidth;
        el.classList.add("shake");
        msg.textContent = "A knight moves in an L: two squares one way, then one to the side.";
        return;
      }
      busy = true;
      pos = [r, c];
      moves++;
      visited.set(r * 8 + c, visited.size + 1);
      el.classList.add("visited");
      el.dataset.n = visited.size;
      place(r, c);
      setTimeout(() => {
        busy = false;
        paint();
        if (visited.size === 64) {
          msg.textContent = "All 64 squares. That is a full knight's tour. Impressive.";
          const b = knight.getBoundingClientRect();
          burst(b.left + b.width / 2, b.top + b.height / 2, 40);
        } else if (legalFrom(r, c).length === 0) {
          msg.textContent = `Stuck after ${visited.size} squares. Hit reset and try a different route.`;
        } else if (moves === 4) {
          msg.textContent = "Tip: move to the square that has the fewest exits left, and save the roomy squares for later.";
        } else if (moves === 1) {
          msg.textContent = "";
        }
      }, animate ? 520 : 0);
    };

    reset.addEventListener("click", start);
    start();
  })();

  /* =====================================================================
     No GSAP, or reduced motion: show the final state of everything
  ===================================================================== */
  if (!animate) {
    $("#loader")?.remove();
    $$(".about__text .w").forEach((w) => (w.style.opacity = "1"));
    $$("[data-count]").forEach((el) => {
      const d = +(el.dataset.decimals || 0);
      el.textContent = (+el.dataset.count).toFixed(d) + (el.dataset.suffix || "");
    });
    $$("#prs span").forEach((s) => s.classList.add("is-on"));
    $$("[data-job]").forEach((j) => j.classList.add("is-on"));
    const fill = $("#timelineFill");
    if (fill) fill.style.transform = "scaleY(1)";
    return;
  }

  /* =====================================================================
     GSAP
  ===================================================================== */
  gsap.registerPlugin(ScrollTrigger);
  document.body.classList.add("is-loading");
  window.scrollTo(0, 0);
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  gsap.set(".hero .line__in, .contact__title .line__in", { yPercent: 115 });
  gsap.set("[data-hero]", { opacity: 0, y: 24 });
  gsap.set("[data-reveal]", { opacity: 0, y: 36 });
  gsap.set("#nav", { yPercent: -120 });
  gsap.set(".badge", { opacity: 0, scale: 0.6, rotation: -30 });
  gsap.set(".chips li", { opacity: 0, y: 14, scale: 0.9 });

  const scribblePath = $(".scribble path");
  const scribbleLen = scribblePath.getTotalLength();
  gsap.set(scribblePath, { strokeDasharray: scribbleLen, strokeDashoffset: scribbleLen });

  /* ----- greeting screen ----- */
  const greetings = ["Hello", "नमस्कार", "Hola", "Hi"];
  const wordEl = $("#loaderWord");
  let introDone = false;

  const startSite = () => {
    if (introDone) return;
    introDone = true;
    $("#loader")?.remove();
    document.body.classList.remove("is-loading");
    initScroll();

    const t = gsap.timeline({ defaults: { ease: "expo.out" } });
    t.to("#nav", { yPercent: 0, duration: 1 }, 0)
      .to(".hero .line__in", { yPercent: 0, duration: 1.2, stagger: 0.12 }, 0)
      .to("[data-hero]", { opacity: 1, y: 0, duration: 0.9, stagger: 0.1, ease: "power3.out" }, 0.5)
      .to(".badge", { opacity: 1, scale: 1, rotation: 0, duration: 1, ease: "back.out(1.6)" }, 0.8)
      .to(scribblePath, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" }, 1.1)
      .add(startRotator, 1.8);
  };

  const greet = gsap.timeline({
    onComplete: () => gsap.to("#loader", { yPercent: -100, duration: 0.9, ease: "power4.inOut", onComplete: startSite }),
  });
  greetings.forEach((word, i) => {
    greet.add(() => (wordEl.textContent = word));
    greet.fromTo(wordEl, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" });
    greet.to(wordEl, { opacity: i === greetings.length - 1 ? 1 : 0, duration: 0.15, delay: 0.12 });
  });
  setTimeout(() => { if (!introDone) greet.progress(1); }, 5000);

  /* ----- rotating headline ----- */
  function startRotator() {
    const words = ["full-stack apps.", "AI tools.", "real-time apps.", "things people use."];
    const em = $("#rotator em");
    let i = 0;
    const next = () => {
      i = (i + 1) % words.length;
      gsap.timeline()
        .to(em, { yPercent: -110, opacity: 0, duration: 0.45, ease: "power3.in" })
        .add(() => (em.textContent = words[i]))
        .fromTo(em, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: "expo.out" });
    };
    setInterval(() => { if (!document.hidden) next(); }, 2800);
  }

  /* ----- scroll animations ----- */
  function initScroll() {
    gsap.to(".progress span", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.2 } });

    const nav = $("#nav");
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        nav.classList.toggle("is-solid", self.scroll() > 40);
        const hide = self.direction === 1 && self.scroll() > 240 && !document.body.classList.contains("menu-open");
        gsap.to(nav, { yPercent: hide ? -120 : 0, duration: 0.35, ease: "power3.out", overwrite: true });
      },
    });

    $$("[data-link]").forEach((link) => {
      const sec = $(link.getAttribute("href"));
      if (!sec) return;
      ScrollTrigger.create({
        trigger: sec,
        start: "top 55%",
        end: "bottom 55%",
        onToggle: (self) => link.classList.toggle("is-active", self.isActive),
      });
    });

    gsap.to(".hero__inner", {
      yPercent: -8,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });

    ScrollTrigger.batch("[data-reveal]", {
      start: "top 90%",
      once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: "power3.out" }),
    });

    gsap.to(".contact__title .line__in", {
      yPercent: 0,
      duration: 1.1,
      stagger: 0.12,
      ease: "expo.out",
      scrollTrigger: { trigger: ".contact__title", start: "top 85%", once: true },
    });

    /* about words */
    const words = $$(".about__text .w");
    gsap.to(words, {
      opacity: 1,
      ease: "none",
      stagger: 0.12,
      scrollTrigger: { trigger: "#aboutText", start: "top 82%", end: "bottom 55%", scrub: true },
    });

    /* counters */
    $$("[data-count]").forEach((el) => {
      const target = +el.dataset.count;
      const decimals = +(el.dataset.decimals || 0);
      const suffix = el.dataset.suffix || "";
      const o = { v: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: "top 92%",
        once: true,
        onEnter: () =>
          gsap.to(o, {
            v: target,
            duration: 1.8,
            ease: "power3.out",
            onUpdate: () => (el.textContent = o.v.toFixed(decimals) + suffix),
          }),
      });
    });

    /* experience timeline */
    gsap.to("#timelineFill", {
      scaleY: 1,
      ease: "none",
      scrollTrigger: { trigger: "#timeline", start: "top 70%", end: "bottom 65%", scrub: true },
    });
    $$("[data-job]").forEach((job) => {
      ScrollTrigger.create({
        trigger: job,
        start: "top 68%",
        onEnter: () => job.classList.add("is-on"),
        onLeaveBack: () => job.classList.remove("is-on"),
      });
    });

    /* merged PR squares fill in one by one */
    const prs = $$("#prs span");
    ScrollTrigger.create({
      trigger: "#prs",
      start: "top 85%",
      once: true,
      onEnter: () =>
        prs.forEach((s, i) =>
          gsap.fromTo(s, { scale: 0.3 }, { scale: 1, duration: 0.55, delay: i * 0.07, ease: "back.out(2.4)", onStart: () => s.classList.add("is-on") })
        ),
    });

    /* skill chips pop in */
    ScrollTrigger.batch(".chips li", {
      start: "top 94%",
      once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, scale: 1, duration: 0.55, stagger: 0.04, ease: "back.out(1.8)" }),
    });

    /* ----- projects ----- */
    const mm = gsap.matchMedia();

    mm.add("(min-width: 761px)", () => {
      const track = $("#workTrack");
      const cards = $$("[data-card]", track);
      const total = cards.length;
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const countEl = $("#workCount");
      const bar = $("#workBar");

      const slide = gsap.to(track, {
        x: () => -dist(),
        ease: "none",
        scrollTrigger: {
          trigger: "#workPin",
          start: "top top",
          end: () => "+=" + dist(),
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            countEl.textContent = Math.min(total, Math.floor(self.progress * (total - 0.001)) + 1);
            bar.style.transform = `scaleX(${self.progress})`;
          },
        },
      });

      cards.forEach((card) => {
        const img = $("img", card);
        if (!img) return;
        gsap.fromTo(
          img,
          { xPercent: 5, scale: 1.1 },
          { xPercent: -5, ease: "none", scrollTrigger: { trigger: card, containerAnimation: slide, start: "left 100%", end: "right 0%", scrub: true } }
        );
      });
    });

    mm.add("(max-width: 760px)", () => {
      gsap.set("[data-card]", { opacity: 0, y: 40 });
      ScrollTrigger.batch("[data-card]", {
        start: "top 92%",
        once: true,
        onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" }),
      });
    });

    window.addEventListener("load", () => ScrollTrigger.refresh());
  }
})();
