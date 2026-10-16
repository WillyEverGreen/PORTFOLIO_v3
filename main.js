(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  /* ---------- helpers that work without GSAP ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const clock = $("#clock");
  const tickClock = () => {
    if (!clock) return;
    clock.textContent =
      new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()) + " IST";
  };
  tickClock();
  setInterval(tickClock, 30000);

  const showFinalState = () => {
    const loader = $("#loader");
    if (loader) loader.remove();
    document.body.classList.remove("is-loading");
    $$("[data-count]").forEach((el) => {
      el.textContent = el.dataset.count + (el.dataset.suffix || "");
    });
    $$(".about__text .w").forEach((w) => (w.style.color = "var(--text)"));
  };

  /* wrap about-text words so we can scrub their colour */
  const aboutText = $("#aboutText");
  if (aboutText) {
    const words = aboutText.textContent.trim().split(/\s+/);
    aboutText.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(" ");
  }

  /* smooth in-page anchors (native, works with the pinned section) */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id.length > 1 ? $(id) : null;
      if (id === "#top") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      } else if (target) {
        e.preventDefault();
        const y = target.getBoundingClientRect().top + window.scrollY - 10;
        window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
      }
    });
  });

  if (!hasGsap || reduceMotion) {
    showFinalState();
    return;
  }

  /* =====================================================================
     GSAP
  ===================================================================== */
  gsap.registerPlugin(ScrollTrigger);
  document.body.classList.add("is-loading");
  window.scrollTo(0, 0);
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  /* initial hidden states (set from JS so the page still works if JS fails) */
  gsap.set(".hero .line__in", { yPercent: 115 });
  gsap.set("[data-hero]", { opacity: 0, y: 30 });
  gsap.set("[data-reveal]", { opacity: 0, y: 40 });
  gsap.set("#nav", { yPercent: -120 });
  gsap.set(".contact__title .line__in", { yPercent: 115 });

  /* ---------- preloader ---------- */
  const loaderName = $("#loaderName");
  loaderName.innerHTML = [...loaderName.textContent].map((c) => `<span>${c === " " ? "&nbsp;" : c}</span>`).join("");

  gsap.set("#loaderName span", { yPercent: 115 });
  const counter = { v: 0 };
  let introDone = false;

  const runIntro = () => {
    if (introDone) return;
    introDone = true;
    $("#loader")?.remove();
    document.body.classList.remove("is-loading");
    initScrollAnimations();
    const t = gsap.timeline({ defaults: { ease: "expo.out" } });
    t.to("#nav", { yPercent: 0, duration: 1 }, 0)
      .to(".hero .line__in", { yPercent: 0, duration: 1.3, stagger: 0.14 }, 0.05)
      .to("[data-hero]", { opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: "power3.out" }, 0.45);
  };

  const loadTl = gsap.timeline({
    onComplete: () => {
      gsap.to("#loader", {
        yPercent: -100,
        duration: 1,
        ease: "power4.inOut",
        onComplete: runIntro,
      });
    },
  });

  loadTl
    .to("#loaderName span", { yPercent: 0, duration: 0.9, stagger: 0.05, ease: "power4.out" }, 0)
    .to(
      counter,
      {
        v: 100,
        duration: 1.7,
        ease: "power2.inOut",
        onUpdate: () => {
          $("#loaderCount").textContent = Math.round(counter.v);
          $("#loaderBar").style.transform = `scaleX(${counter.v / 100})`;
        },
      },
      0
    )
    .to("#loaderName", { opacity: 0, y: -20, duration: 0.4, ease: "power2.in" }, ">+0.1");

  /* failsafe so a slow device is never stuck behind the loader */
  setTimeout(() => {
    if (!introDone) {
      loadTl.progress(1);
    }
  }, 6000);

  /* ---------- everything that depends on the page being visible ---------- */
  function initScrollAnimations() {
    /* scroll progress */
    gsap.to(".progress span", {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { start: 0, end: "max", scrub: 0.2 },
    });

    /* nav: solid after hero start, hide on scroll down, show on scroll up */
    const nav = $("#nav");
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        nav.classList.toggle("is-solid", self.scroll() > 40);
        const hide = self.direction === 1 && self.scroll() > 240;
        gsap.to(nav, { yPercent: hide ? -120 : 0, duration: 0.4, ease: "power3.out", overwrite: true });
      },
    });

    /* active link */
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

    /* hero parallax */
    gsap.to(".hero__inner", {
      yPercent: -10,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to(".orb--a", { yPercent: 40, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".orb--b", { yPercent: -40, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

    /* ambient orb drift */
    gsap.to(".orb--a", { x: -60, y: 40, duration: 7, ease: "sine.inOut", repeat: -1, yoyo: true });
    gsap.to(".orb--b", { x: 70, y: -50, duration: 9, ease: "sine.inOut", repeat: -1, yoyo: true });

    /* generic reveals, batched so grids stagger */
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 90%",
      once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: "power3.out" }),
    });

    /* contact title masks */
    gsap.to(".contact__title .line__in", {
      yPercent: 0,
      duration: 1.2,
      stagger: 0.14,
      ease: "expo.out",
      scrollTrigger: { trigger: ".contact__title", start: "top 85%", once: true },
    });

    /* about: words light up as you scroll */
    const words = $$(".about__text .w");
    if (words.length) {
      gsap.to(words, {
        color: "rgb(232, 239, 233)",
        ease: "none",
        stagger: 0.12,
        scrollTrigger: { trigger: "#aboutText", start: "top 82%", end: "bottom 50%", scrub: true },
      });
    }

    /* counters */
    $$("[data-count]").forEach((el) => {
      const target = +el.dataset.count;
      const suffix = el.dataset.suffix || "";
      const o = { v: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: "top 90%",
        once: true,
        onEnter: () =>
          gsap.to(o, {
            v: target,
            duration: 1.6,
            ease: "power3.out",
            onUpdate: () => (el.textContent = Math.round(o.v) + suffix),
          }),
      });
    });

    /* marquee rows: infinite loop, speeds up with scroll velocity */
    const marqueeTweens = $$(".marquee__row").map((row) => {
      const track = $(".marquee__track", row);
      track.innerHTML += track.innerHTML;
      const dir = +row.dataset.dir;
      const from = dir < 0 ? 0 : -50;
      const to = dir < 0 ? -50 : 0;
      return gsap.fromTo(track, { xPercent: from }, { xPercent: to, duration: 38, ease: "none", repeat: -1 });
    });
    let boost = 1;
    ScrollTrigger.create({
      onUpdate: (self) => {
        boost = Math.min(7, 1 + Math.abs(self.getVelocity()) / 260);
      },
    });
    gsap.ticker.add(() => {
      boost += (1 - boost) * 0.06;
      marqueeTweens.forEach((t) => t.timeScale(boost));
    });

    /* ---------- projects ---------- */
    const mm = gsap.matchMedia();

    mm.add("(min-width: 761px)", () => {
      const track = $("#workTrack");
      const cards = $$("[data-card]", track);
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const total = cards.length;
      const countEl = $("#workCount");
      const bar = $("#workBar");

      const move = gsap.to(track, {
        x: () => -dist(),
        ease: "none",
        scrollTrigger: {
          trigger: "#workPin",
          start: "top top",
          end: () => "+=" + dist(),
          pin: true,
          scrub: 0.7,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const n = Math.min(total, Math.floor(self.progress * (total - 0.001)) + 1);
            countEl.textContent = String(n).padStart(2, "0");
            bar.style.transform = `scaleX(${self.progress})`;
          },
        },
      });

      cards.forEach((card) => {
        gsap.fromTo(
          card,
          { opacity: 0.35, scale: 0.9 },
          {
            opacity: 1,
            scale: 1,
            ease: "none",
            scrollTrigger: { trigger: card, containerAnimation: move, start: "left 96%", end: "left 62%", scrub: true },
          }
        );
        const img = $("img", card);
        if (img) {
          gsap.fromTo(
            img,
            { xPercent: 6 },
            {
              xPercent: -6,
              scale: 1.12,
              ease: "none",
              scrollTrigger: { trigger: card, containerAnimation: move, start: "left 100%", end: "right 0%", scrub: true },
            }
          );
        }
      });
    });

    mm.add("(max-width: 760px)", () => {
      ScrollTrigger.batch("[data-card]", {
        start: "top 92%",
        once: true,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: "power3.out" }),
      });
      gsap.set("[data-card]", { opacity: 0 });
    });

    /* images are fixed-ratio so layout is stable, but refresh once everything is in */
    window.addEventListener("load", () => ScrollTrigger.refresh());
  }

  /* ---------- pointer-driven effects (desktop only) ---------- */
  if (finePointer) {
    const cursor = $(".cursor");
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3" });
    window.addEventListener(
      "mousemove",
      (e) => {
        xTo(e.clientX);
        yTo(e.clientY);
        gsap.to(cursor, { opacity: 1, duration: 0.3, overwrite: "auto" });
      },
      { passive: true }
    );
    document.addEventListener("mouseleave", () => gsap.to(cursor, { opacity: 0, duration: 0.2 }));
    $$("a, button, .card__media").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
    });

    /* magnetic buttons */
    $$(".magnetic").forEach((el) => {
      const strength = 0.32;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, {
          x: (e.clientX - (r.left + r.width / 2)) * strength,
          y: (e.clientY - (r.top + r.height / 2)) * strength,
          duration: 0.4,
          ease: "power3.out",
        });
      });
      el.addEventListener("mouseleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" }));
    });

    /* orb parallax with the mouse */
    const hero = $(".hero");
    const orbA = gsap.quickTo(".orb--a", "x", { duration: 1.4, ease: "power3" });
    const grid = gsap.quickTo(".hero__grid", "x", { duration: 1.6, ease: "power3" });
    hero.addEventListener("mousemove", (e) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      orbA(-nx * 90);
      grid(nx * 24);
    });

    /* 3D tilt on project cards */
    $$("[data-card]").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(card, { rotationY: px * 7, rotationX: -py * 7, transformPerspective: 1000, duration: 0.5, ease: "power2.out" });
      });
      card.addEventListener("mouseleave", () => gsap.to(card, { rotationY: 0, rotationX: 0, duration: 0.8, ease: "power3.out" }));
    });
  }
})();
