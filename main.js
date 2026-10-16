(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  /* ---------- things that never need GSAP ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const clock = $("#clock");
  const tickClock = () => {
    if (!clock) return;
    const t = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    }).format(new Date());
    clock.textContent = "Mumbai, " + t + " local time";
  };
  tickClock();
  setInterval(tickClock, 30000);

  /* split the about paragraph into words so they can fade in one by one */
  const aboutText = $("#aboutText");
  if (aboutText) {
    const words = aboutText.textContent.trim().split(/\s+/);
    aboutText.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(" ");
  }

  /* in-page links scroll smoothly with the browser, which plays nicely with the pinned section */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const behavior = reduceMotion ? "auto" : "smooth";
      if (id === "#top") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior });
        return;
      }
      const target = id.length > 1 ? $(id) : null;
      if (target) {
        e.preventDefault();
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 10, behavior });
      }
    });
  });

  /* no GSAP, or the visitor prefers less motion: show everything as it is */
  if (!hasGsap || reduceMotion) {
    $("#loader")?.remove();
    $$(".about__text .w").forEach((w) => (w.style.color = "var(--ink)"));
    return;
  }

  /* =====================================================================
     GSAP
  ===================================================================== */
  gsap.registerPlugin(ScrollTrigger);
  document.body.classList.add("is-loading");
  window.scrollTo(0, 0);
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  /* starting positions, set from JS so the page still works without it */
  gsap.set(".hero .line__in, .contact__title .line__in", { yPercent: 115 });
  gsap.set("[data-hero]", { opacity: 0, y: 24 });
  gsap.set("[data-reveal]", { opacity: 0, y: 36 });
  gsap.set("#nav", { yPercent: -120 });
  gsap.set(".badge", { opacity: 0, scale: 0.6, rotation: -30 });

  const scribble = $(".scribble path");
  const scribbleLen = scribble ? scribble.getTotalLength() : 0;
  if (scribble) gsap.set(scribble, { strokeDasharray: scribbleLen, strokeDashoffset: scribbleLen });

  /* ---------- greeting screen ---------- */
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
      .to(".badge", { opacity: 1, scale: 1, rotation: 0, duration: 1, ease: "back.out(1.6)" }, 0.8);
    if (scribble) t.to(scribble, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" }, 1.1);
  };

  const greet = gsap.timeline({
    onComplete: () => {
      gsap.to("#loader", { yPercent: -100, duration: 0.9, ease: "power4.inOut", onComplete: startSite });
    },
  });
  greetings.forEach((word, i) => {
    greet.add(() => (wordEl.textContent = word));
    greet.fromTo(wordEl, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" });
    greet.to(wordEl, { opacity: i === greetings.length - 1 ? 1 : 0, duration: 0.15, delay: 0.12 });
  });

  /* never trap a slow device behind the greeting */
  setTimeout(() => {
    if (!introDone) greet.progress(1);
  }, 5000);

  /* ---------- scroll animations ---------- */
  function initScroll() {
    gsap.to(".progress span", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.2 } });

    /* nav: gets a background after the hero, hides when scrolling down, returns when scrolling up */
    const nav = $("#nav");
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        nav.classList.toggle("is-solid", self.scroll() > 40);
        const hide = self.direction === 1 && self.scroll() > 240;
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

    /* hero drifts up a little as you leave it */
    gsap.to(".hero__inner", {
      yPercent: -8,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });

    /* fade-ups, batched so groups arrive one after another */
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

    /* the about paragraph darkens word by word as you read */
    const words = $$(".about__text .w");
    if (words.length) {
      gsap.to(words, {
        color: "rgb(28, 27, 24)",
        ease: "none",
        stagger: 0.12,
        scrollTrigger: { trigger: "#aboutText", start: "top 82%", end: "bottom 55%", scrub: true },
      });
    }

    /* ---------- projects ---------- */
    const mm = gsap.matchMedia();

    /* desktop: pin the section and slide the cards sideways */
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

      /* the screenshot inside each card slides a touch the other way */
      cards.forEach((card) => {
        const img = $("img", card);
        if (!img) return;
        gsap.fromTo(
          img,
          { xPercent: 5, scale: 1.1 },
          {
            xPercent: -5,
            ease: "none",
            scrollTrigger: { trigger: card, containerAnimation: slide, start: "left 100%", end: "right 0%", scrub: true },
          }
        );
      });
    });

    /* phones: cards simply rise into place as you scroll */
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
