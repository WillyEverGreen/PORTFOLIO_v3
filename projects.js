/* The projects archive: an index with a cursor-following preview, a static gallery,
   animated filters and a details dialog. Data comes from projects-data.js. */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const projects = window.PROJECTS || [];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGsap = typeof window.gsap !== "undefined";
  const animate = hasGsap && !reduceMotion;
    if (hasGsap) gsap.registerPlugin(window.ScrollTrigger);

  const FILTERS = [
    ["all", "All"],
    ["ai", "AI"],
    ["web", "Web apps"],
    ["security", "Security"],
    ["tools", "Tools"],
    ["games", "Games"],
  ];

  const els = {
    index: $("#pjIndex"),
    grid: $("#pjGrid"),
    filters: $("#pjFilters"),
    view: $("#pjView"),
    preview: $("#pjPreview"),
    dialog: $("#pjDialog"),
    dialogBody: $("#pjDialogBody"),
    dialogClose: $("#pjDialogClose"),
  };

  const state = { filter: "all", view: "index", busy: false };

  /* ---------- helpers ---------- */
  const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const escapeHtml = (str) => String(str).replace(/[&<>"']/g, (c) => ESCAPES[c]);
    const matches = (p, filter) => filter === "all" || p.cats.includes(filter);
  const stackList = (p) => p.stack.split(",").map((s) => s.trim());
  const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg>';

  /* "Security. Client-side..." becomes a short bold lead-in followed by the sentence */
  const point = (text) => {
    const i = text.indexOf(". ");
    if (i > 0 && text.slice(0, i).split(" ").length <= 3) {
      return `<b>${escapeHtml(text.slice(0, i + 1))}</b> ${escapeHtml(text.slice(i + 2))}`;
    }
    return escapeHtml(text);
  };

  const linksHtml = (p) => {
    const live = `<a class="pj-link" href="${escapeHtml(p.live)}" target="_blank" rel="noopener">${escapeHtml(p.liveLabel || "Live demo")}${ARROW}</a>`;
    const code = p.code ? `<a class="pj-link" href="${escapeHtml(p.code)}" target="_blank" rel="noopener">Code${ARROW}</a>` : "";
    // projects with a written case study get a link to it first
    const study = p.caseStudy ? `<a class="pj-link pj-link--study" href="${escapeHtml(p.caseStudy)}">Read the story${ARROW}</a>` : "";
    return study + live + code;
  };

  const tagsHtml = (p, max = Infinity) => `<ul class="pj-tags">${stackList(p).slice(0, max).map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>`;
  const pointsHtml = (p) => `<ul class="pj-points">${p.points.map((t) => `<li>${point(t)}</li>`).join("")}</ul>`;

  /* ---------- render ---------- */
  const filterCount = (key) => projects.filter((p) => matches(p, key)).length;

  const renderFilters = () => {
    els.filters.innerHTML =
      '<span class="pj-chip-thumb" aria-hidden="true"></span>' +
      FILTERS.filter(([key]) => filterCount(key) > 0)
        .map(
          ([key, label]) =>
            `<button type="button" class="pj-chip" data-filter="${key}" aria-pressed="${key === state.filter}">${label}<sup>${filterCount(key)}</sup></button>`
        )
        .join("");
  };

  /* the dark pill that slides behind the active filter */
  const moveThumb = (instant) => {
    const thumb = $(".pj-chip-thumb", els.filters);
    const chip = $('.pj-chip[aria-pressed="true"]', els.filters);
    if (!thumb || !chip) return;
    const box = { x: chip.offsetLeft, y: chip.offsetTop, width: chip.offsetWidth, height: chip.offsetHeight };
    if (!hasGsap) {
      Object.assign(thumb.style, { transform: `translate(${box.x}px, ${box.y}px)`, width: box.width + "px", height: box.height + "px" });
    } else if (instant || !animate) {
      gsap.set(thumb, box);
    } else {
      gsap.to(thumb, { ...box, duration: 0.55, ease: "power3.inOut" });
    }
  };

  const renderIndex = () => {
    els.index.innerHTML = projects
      .map(
        (p, i) => `
      <article class="pj-row" data-id="${p.id}" data-cats="${p.cats.join(" ")}">
        <button class="pj-row__head" type="button" aria-expanded="false" aria-controls="panel-${p.id}">
          <span class="pj-row__no">${i + 1}</span>
          <span class="pj-row__title">${escapeHtml(p.title)}</span>
          <span class="pj-row__kicker">${escapeHtml(p.kicker)}</span>
          <span class="pj-row__stack">${escapeHtml(stackList(p).slice(0, 3).join(" · "))}</span>
          <span class="pj-row__plus" aria-hidden="true"></span>
        </button>
        <div class="pj-row__panel" id="panel-${p.id}" role="region" aria-label="${escapeHtml(p.title)} details">
          <div class="pj-row__panel-in">
            <a class="pj-row__shot" href="${escapeHtml(p.live)}" target="_blank" rel="noopener" tabindex="-1">
              <img src="${p.image}" alt="${escapeHtml(p.title)} screenshot" loading="lazy" decoding="async" width="1440" height="900" />
            </a>
            <div class="pj-row__info">
              <p class="pj-row__desc">${escapeHtml(p.desc)}</p>
              ${pointsHtml(p)}
              ${tagsHtml(p)}
              <div class="pj-links">${linksHtml(p)}</div>
            </div>
          </div>
        </div>
      </article>`
      )
      .join("");
  };

  const renderGrid = () => {
    els.grid.innerHTML = projects
      .map(
        (p, i) => `
      <article class="card pj-card" data-id="${p.id}" data-cats="${p.cats.join(" ")}">
        <a class="card__media" href="${escapeHtml(p.live)}" target="_blank" rel="noopener" tabindex="-1">
          <img src="${p.image}" alt="${escapeHtml(p.title)} screenshot" loading="lazy" decoding="async" width="1440" height="900" />
        </a>
        <div class="card__body">
          <span class="card__no">${i + 1}</span>
          <h3>${escapeHtml(p.title)}</h3>
          <p class="card__kicker">${escapeHtml(p.kicker)}</p>
          <p>${escapeHtml(p.desc)}</p>
          <p class="card__tags">${escapeHtml(p.stack)}</p>
          <div class="card__links">
            <button type="button" class="more" data-open="${p.id}">Details</button>
            ${p.caseStudy ? `<a href="${escapeHtml(p.caseStudy)}">Read the story</a>` : ""}
            <a href="${escapeHtml(p.live)}" target="_blank" rel="noopener">${escapeHtml(p.liveLabel || "Live demo")}</a>
            ${p.code ? `<a href="${escapeHtml(p.code)}" target="_blank" rel="noopener">Code</a>` : ""}
          </div>
        </div>
      </article>`
      )
      .join("");
  };

  const renderPreview = () => {
    els.preview.innerHTML = projects.map((p) => `<img data-id="${p.id}" data-title="${escapeHtml(p.title)}" src="${p.image}" alt="" decoding="async" />`).join("");
  };

  const shown = (container) => $$(":scope > :not(.is-hidden)", container);

  /* ---------- index rows ---------- */
  const closeRows = (except) => {
    $$(".pj-row.is-open").forEach((row) => {
      if (row === except) return;
      row.classList.remove("is-open");
      $(".pj-row__head", row).setAttribute("aria-expanded", "false");
    });
  };

  const refreshTriggers = (delay = 0) => {
    if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), delay);
  };

  const toggleRow = (row) => {
    const open = !row.classList.contains("is-open");
    closeRows(open ? row : null);
    row.classList.toggle("is-open", open);
    $(".pj-row__head", row).setAttribute("aria-expanded", String(open));
    if (open) {
      hidePreview();
      /* bring the opened row up once its panel has started to grow */
      setTimeout(() => {
        const top = row.getBoundingClientRect().top;
        if (top < 90 || top > window.innerHeight * 0.45) {
          window.scrollTo({ top: window.scrollY + top - 100, behavior: reduceMotion ? "auto" : "smooth" });
        }
      }, 120);
    }
    refreshTriggers(700);
  };

  /* ---------- filtering ---------- */
  const hiddenFor = (el, key) => key !== "all" && !el.dataset.cats.split(" ").includes(key);
  let filtering = false;
  let queuedFilter = null;

  /* old items leave, the list eases to its new height, new items arrive in a stagger */
  const setFilter = (key) => {
    if (key === state.filter && !filtering) return;
    state.filter = key;
    $$(".pj-chip", els.filters).forEach((chip) => chip.setAttribute("aria-pressed", String(chip.dataset.filter === key)));
    moveThumb();
    mango.say(FILTER_LINES[key] || "Let us see.", 2600, "curious", { key: "filter:" + key });
    closeRows();
    hidePreview();

    const apply = () => $$(".pj-row, .pj-card").forEach((el) => el.classList.toggle("is-hidden", hiddenFor(el, state.filter)));
    if (!animate) return apply();
    if (filtering) {
      queuedFilter = key;
      return;
    }

    filtering = true;
    const grid = state.view === "grid";
    const container = grid ? els.grid : els.index;
    container.style.minHeight = container.offsetHeight + "px";
    const startHeight = container.offsetHeight;

    /* a shorter list would drag the page up with it, so bring the filters back into view first */
    const toolbarTop = $("#pjToolbar").getBoundingClientRect().top + window.scrollY - 96;
    if (window.scrollY > toolbarTop + 40) {
      const scroll = { y: window.scrollY };
      gsap.to(scroll, { y: toolbarTop, duration: 0.7, ease: "power3.inOut", onUpdate: () => window.scrollTo(0, scroll.y) });
    }

    gsap.to(shown(container), {
      opacity: 0,
      y: grid ? 0 : -18,
      scale: grid ? 0.94 : 1,
      duration: 0.25,
      stagger: grid ? { amount: 0.25, from: "start" } : 0.02,
      ease: "power2.in",
      onComplete: () => {
        gsap.set(shown(container), { clearProps: "opacity,transform" });
        apply();
        const entering = shown(container);
        gsap.set(entering, { opacity: 0, y: grid ? 50 : 30, scale: grid ? 0.92 : 1 });
        container.style.minHeight = "";
        const endHeight = container.offsetHeight;
        gsap.fromTo(container, { minHeight: startHeight }, { minHeight: endHeight, duration: 0.6, ease: "power3.inOut", clearProps: "minHeight" });
        gsap.to(entering, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          delay: 0.15,
          stagger: grid ? { amount: 0.5, from: "start" } : 0.05,
          ease: "power3.out",
          clearProps: "opacity,transform",
          onComplete: () => {
            filtering = false;
            refreshTriggers();
            if (queuedFilter !== null) {
              const next = queuedFilter;
              queuedFilter = null;
              setFilter(next);
            }
          },
        });
      },
    });
  };

  /* ---------- cursor-following preview (index view, mouse only) ---------- */
  let previewX, previewY, previewRot;

  function showPreview(id) {
    if (!previewX) return;
    $$("img", els.preview).forEach((img) => img.classList.toggle("is-on", img.dataset.id === id));
    gsap.to(els.preview, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.6)", overwrite: "auto" });
  }

  function hidePreview() {
    if (!previewX) return;
    gsap.to(els.preview, { opacity: 0, scale: 0.7, duration: 0.25, ease: "power2.in", overwrite: "auto" });
  }

  const initPreview = () => {
    if (!animate || !finePointer) return;
    gsap.set(els.preview, { xPercent: -50, yPercent: -50, opacity: 0, scale: 0.7 });
    previewX = gsap.quickTo(els.preview, "x", { duration: 0.45, ease: "power3" });
    previewY = gsap.quickTo(els.preview, "y", { duration: 0.45, ease: "power3" });
    previewRot = gsap.quickTo(els.preview, "rotation", { duration: 0.6, ease: "power3" });

    let lastX = 0;
    let settle;
    els.index.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      previewX(Math.min(e.clientX + 270, window.innerWidth - 190));
      previewY(e.clientY - 20);
      previewRot(gsap.utils.clamp(-9, 9, (e.clientX - lastX) * 0.5));
      lastX = e.clientX;
      clearTimeout(settle);
      settle = setTimeout(() => previewRot(0), 90);
    });
    els.index.addEventListener("pointerover", (e) => {
      if (e.pointerType !== "mouse") return;
      const row = e.target.closest(".pj-row");
      if (!row || row.classList.contains("is-open")) hidePreview();
      else showPreview(row.dataset.id);
    });
    els.index.addEventListener("pointerleave", hidePreview);
  };

  /* ---------- view switch ---------- */
  const setView = (view) => {
    if (view === state.view || state.busy) return;
    const from = view === "grid" ? els.index : els.grid;
    const to = view === "grid" ? els.grid : els.index;
    state.view = view;
    try { localStorage.setItem("pjView", view); } catch (e) { /* storage can be blocked */ }
    $$("button", els.view).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === view)));
    els.view.dataset.active = view;
    mango.say(view === "grid" ? "Gallery mode. Fancy!" : "Back to the tidy index.", 2400, "happy", { key: "view:" + view });
    closeRows();
    hidePreview();

    const swap = () => {
      from.hidden = true;
      to.hidden = false;
      if (!animate) return;
      gsap.fromTo(
        shown(to),
        { opacity: 0, y: view === "grid" ? 50 : 24, scale: view === "grid" ? 0.92 : 1 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out", stagger: 0.045, clearProps: "transform,opacity", onComplete: () => refreshTriggers() }
      );
    };

    if (!animate) return swap();
    state.busy = true;
    gsap.to(shown(from), {
      opacity: 0,
      y: -20,
      duration: 0.22,
      stagger: 0.02,
      ease: "power2.in",
      onComplete: () => {
        gsap.set(shown(from), { clearProps: "all" });
        swap();
        state.busy = false;
      },
    });
  };

  /* ---------- details dialog ---------- */
  let lastOpener = null;

  const ICONS = {
    chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
    reload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5"/></svg>',
    open: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg>',
  };

  const hostOf = (url) => {
    try {
      const u = new URL(url);
      return u.host + (u.pathname === "/" ? "" : u.pathname);
    } catch (e) {
      return url;
    }
  };

  /* the details panel can slide away so the live site gets the whole dialog; the choice is remembered */
  let infoCollapsed = false;
  try { infoCollapsed = sessionStorage.getItem("pjInfoCollapsed") === "1"; } catch (e) { /* ignore */ }

  const stageHtml = (p) =>
    p.embed === false
      ? `<div class="pj-viewer__fallback">
           <img src="${p.image}" alt="${escapeHtml(p.title)} screenshot" />
           <div class="pj-viewer__notice">
             <p>${escapeHtml(p.title)} can't be shown inside another page.</p>
             <a class="pj-link" href="${escapeHtml(p.live)}" target="_blank" rel="noopener">Open the live site${ARROW}</a>
           </div>
         </div>`
      : `<div class="pj-viewer__frame is-loading">
           <img class="pj-viewer__poster" src="${p.image}" alt="" />
           <p class="pj-viewer__loading">Loading the live site…</p>
           <iframe class="pj-viewer__iframe" title="${escapeHtml(p.title)} live site" src="${escapeHtml(p.live)}"
             sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox" referrerpolicy="no-referrer"></iframe>
         </div>`;

  const VIRTUAL_WIDTH = 1366; /* the width live sites are rendered at inside the viewer */

  const openDialog = (id, opener) => {
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    lastOpener = opener || null;
    els.dialogBody.innerHTML = `
      <div class="pj-viewer${infoCollapsed ? " is-collapsed" : ""}" id="pjViewer">
        <section class="pj-viewer__stage" aria-label="Live preview of ${escapeHtml(p.title)}">
          <div class="pj-viewer__bar">
            <span class="pj-viewer__dots" aria-hidden="true"><i></i><i></i><i></i></span>
            <span class="pj-viewer__url">${escapeHtml(hostOf(p.live))}</span>
            ${p.embed === false ? "" : `<button class="pj-viewer__tool" type="button" data-act="reload" aria-label="Reload the preview">${ICONS.reload}</button>`}
            <a class="pj-viewer__tool" href="${escapeHtml(p.live)}" target="_blank" rel="noopener" aria-label="Open in a new tab">${ICONS.open}</a>
          </div>
          ${stageHtml(p)}
        </section>
        <button class="pj-viewer__toggle" id="pjInfoToggle" type="button" aria-controls="pjInfo" aria-expanded="${!infoCollapsed}" aria-label="${infoCollapsed ? "Show details" : "Hide details"}" title="${infoCollapsed ? "Show details" : "Hide details"}">${ICONS.chevron}</button>
        <aside class="pj-viewer__info" id="pjInfo"${infoCollapsed ? " inert" : ""}>
          <div class="pj-viewer__info-in">
            <h2 id="pjDialogTitle">${escapeHtml(p.title)}</h2>
            <p class="pj-dialog__kicker">${escapeHtml(p.kicker)}</p>
            <p>${escapeHtml(p.desc)}</p>
            ${pointsHtml(p)}
            ${tagsHtml(p)}
            <div class="pj-links">${linksHtml(p)}</div>
          </div>
        </aside>
      </div>`;

    const viewer = $("#pjViewer", els.dialogBody);
    const info = $("#pjInfo", viewer);
    const toggle = $("#pjInfoToggle", viewer);
    toggle.addEventListener("click", () => {
      infoCollapsed = !viewer.classList.contains("is-collapsed");
      viewer.classList.toggle("is-collapsed", infoCollapsed);
      info.inert = infoCollapsed;
      const label = infoCollapsed ? "Show details" : "Hide details";
      toggle.setAttribute("aria-expanded", String(!infoCollapsed));
      toggle.setAttribute("aria-label", label);
      toggle.title = label;
      try { sessionStorage.setItem("pjInfoCollapsed", infoCollapsed ? "1" : "0"); } catch (e) { /* ignore */ }
    });

    const frame = $(".pj-viewer__frame", viewer);
    if (frame) {
      const iframe = $("iframe", frame);
      iframe.addEventListener("load", () => frame.classList.remove("is-loading"));

      /* Sites are laid out for a desktop-wide window, so render the page at a fixed desktop width and
         scale it to fit. Otherwise a narrow preview makes responsive sites reflow into overlapping menus.
         Clicking and scrolling still work as normal inside the scaled page. */
      const fit = () => {
        const w = frame.clientWidth;
        const h = frame.clientHeight;
        const k = Math.min(1, w / VIRTUAL_WIDTH);
        if (w < 700 || k >= 1) {
          iframe.style.cssText = ""; /* phones get the site's own mobile layout; wide previews need no scaling */
          return;
        }
        iframe.style.width = VIRTUAL_WIDTH + "px";
        iframe.style.height = h / k + "px";
        iframe.style.transform = `scale(${k})`;
        iframe.style.transformOrigin = "0 0";
      };
      new ResizeObserver(fit).observe(frame);
      $('[data-act="reload"]', viewer).addEventListener("click", () => {
        frame.classList.add("is-loading");
        iframe.src = iframe.src;
      });
    }

    els.dialog.showModal();
    mango.say("Ooh, details! Tell me there is a fish in it.", 2600, "excited", { key: "dialog" });
    document.body.classList.add("is-modal");
    if (!animate) return;
    gsap.fromTo(els.dialogBody, { opacity: 0, y: 34, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "power3.out" });
    gsap.fromTo($$("li", info), { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.07, delay: 0.15, ease: "power2.out" });
  };

  const closeDialog = () => {
    if (!els.dialog.open) return;
    if (!animate) return els.dialog.close();
    gsap.to(els.dialogBody, { opacity: 0, y: 20, scale: 0.97, duration: 0.22, ease: "power2.in", onComplete: () => els.dialog.close() });
  };

  els.dialog.addEventListener("close", () => {
    document.body.classList.remove("is-modal");
    if (lastOpener) lastOpener.focus({ preventScroll: true });
  });
  els.dialog.addEventListener("click", (e) => { if (e.target === els.dialog) closeDialog(); });
  els.dialog.addEventListener("cancel", (e) => { e.preventDefault(); closeDialog(); });
  els.dialogClose.addEventListener("click", closeDialog);

  /* ---------- intro and scroll effects ---------- */
  const intro = () => {
    if (!animate) return;
    gsap.set(".pj-hero .line__in", { yPercent: 115 });
    gsap.set(".pj-hero__label, .pj-hero__meta, .pj-toolbar", { opacity: 0, y: 24 });
    gsap.timeline({ defaults: { ease: "power4.out" }, delay: 0.1 })
      .to(".pj-hero__label", { opacity: 1, y: 0, duration: 0.7 }, 0)
      .to(".pj-hero .line__in", { yPercent: 0, duration: 1.2, stagger: 0.12 }, 0.1)
      .to(".pj-hero__meta", { opacity: 1, y: 0, duration: 0.9 }, 0.7)
      .to(".pj-toolbar", { opacity: 1, y: 0, duration: 0.8 }, 0.9);
  };

  /* ---------- hero: Mango asleep in his bed, who wakes up and reacts to what you do on this page ---------- */
  const mango = { say: () => {} };
  const sfx = (name) => { if (window.Sfx) Sfx.play(name); };

  const initNook = () => {
    const wrap = $("#nookCat");
    if (!wrap) return;
    const bubble = $("#nookBubble");
    const btn = $("#nookBtn");
    const pupils = $$(".cat__pupil", wrap);
    const head = $(".cat__head", wrap);
    const scene = $("#pjNook");

    let asleep = true;
    let moodTimer, bubbleTimer, sleepTimer, purrTimer;
    let line = 0;
    const clicks = [];

    const setMood = (mood, ms = 1800) => {
      wrap.dataset.mood = mood;
      clearTimeout(moodTimer);
      if (mood !== "neutral") moodTimer = setTimeout(() => { wrap.dataset.mood = "neutral"; }, ms);
    };

    const fallAsleep = () => {
      asleep = true;
      wrap.classList.add("is-asleep");
      wrap.dataset.mood = "neutral";
      bubble.classList.remove("is-on");
    };
    const armSleep = () => {
      clearTimeout(sleepTimer);
      sleepTimer = setTimeout(fallAsleep, 9000);
    };
    const wake = () => {
      if (asleep) {
        asleep = false;
        wrap.classList.remove("is-asleep");
        setMood("surprised", 700);
        sfx("chirp");
      }
      armSleep();
    };

    /* Mango should not chatter: most comments are said once, and a quiet spell follows each one.
       opts.force is for replies to something you did to him (petting, the three-toy limit). */
    const said = new Set();
    let quietUntil = 0;
    const say = (text, ms = 3200, mood, opts = {}) => {
      if (opts.key && said.has(opts.key)) return;
      const now = performance.now();
      if (!opts.force && now < quietUntil) return; /* too soon after the last comment; the same one can still come later */
      if (opts.key) said.add(opts.key);
      quietUntil = now + ms + 3500;
      wake();
      bubble.textContent = text;
      bubble.classList.remove("is-on");
      void bubble.offsetWidth;
      bubble.classList.add("is-on");
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(() => bubble.classList.remove("is-on"), ms);
      if (mood) setTimeout(() => setMood(mood, ms), asleep ? 0 : 750);
    };
    mango.say = say;

    const purr = () => {
      wrap.classList.remove("is-purr");
      void wrap.offsetWidth;
      wrap.classList.add("is-purr");
      clearTimeout(purrTimer);
      purrTimer = setTimeout(() => wrap.classList.remove("is-purr"), 850);
    };

    /* little hearts float up out of the bed */
    const hearts = () => {
      if (reduceMotion) return;
      for (let i = 0; i < 6; i++) {
        const heart = document.createElement("span");
        heart.className = "nook-heart";
        heart.textContent = "♥";
        heart.style.left = 34 + Math.random() * 32 + "%";
        heart.style.setProperty("--dx", (Math.random() - 0.5) * 80 + "px");
        heart.style.animationDelay = i * 90 + "ms";
        scene.appendChild(heart);
        heart.addEventListener("animationend", () => heart.remove(), { once: true });
      }
    };

    const LINES = [
      ["purrrr... that's the spot.", "love"],
      ["mrrp! Five more minutes.", "happy"],
      ["*kneads the blanket*", "excited"],
      ["feed me, then pick a project.", "love"],
    ];
    btn.addEventListener("click", () => {
      const now = Date.now();
      clicks.push(now);
      while (clicks.length && now - clicks[0] > 3500) clicks.shift();
      if (clicks.length >= 6) {
        clicks.length = 0;
        say("HISSS! Nap time, human!", 2600, "annoyed", { force: true });
        sfx("hiss");
        return;
      }
      const [text, mood] = LINES[line++ % LINES.length];
      say(text, 2800, mood, { force: true });
      purr();
      hearts();
      sfx("meow");
      window.dispatchEvent(new CustomEvent("nook:pet"));
    });

    /* wakes up, perks up and tracks the pointer (or whichever toy is moving) */
    scene.addEventListener("pointerenter", () => { wake(); if (!asleep) setMood("happy", 1400); });
    let aimRaf = false;
    let aimX = 0;
    let aimY = 0;
    let lookUntil = 0;
    const aim = (x, y) => {
      aimX = x;
      aimY = y;
      if (aimRaf || asleep) return;
      aimRaf = true;
      requestAnimationFrame(() => {
        aimRaf = false;
        const r = btn.getBoundingClientRect();
        const dx = aimX - (r.left + r.width / 2);
        const dy = aimY - (r.top + r.height * 0.38);
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, d / 240);
        pupils.forEach((el) => {
          el.style.setProperty("--px", ((dx / d) * 3.1 * k).toFixed(2) + "px");
          el.style.setProperty("--py", ((dy / d) * 3.1 * k).toFixed(2) + "px");
        });
        head.style.setProperty("--tilt", Math.max(-7, Math.min(7, (dx / window.innerWidth) * 18)).toFixed(1) + "deg");
      });
    };
    window.addEventListener(
      "pointermove",
      (e) => { if (performance.now() > lookUntil) aim(e.clientX, e.clientY); },
      { passive: true }
    );

    /* the toys (toys.js) use these to talk to Mango and to make him watch them */
    window.mangoNook = {
      say,
      look: (x, y) => {
        if (asleep) wake();
        lookUntil = performance.now() + 700;
        aim(x, y);
      },
    };

    /* he wakes up briefly to point you at the filters, then goes back to sleep */
    setTimeout(() => say("psst... there's more below. Pick a filter!", 3800, "happy", { force: true }), 1800);
    armSleep();
  };

  const FILTER_LINES = {
    all: "Everything on the table!",
    ai: "AI projects! Big brain energy.",
    web: "Web apps. Fine scratching posts.",
    security: "Locks and firewalls. Nothing gets past me.",
    tools: "Handy tools, like a good can opener.",
    games: "A game! Does it come with a laser pointer?",
  };

  const initReveals = () => {
    if (!animate) return;
    ScrollTrigger.batch(".pj-row", {
      start: "top 94%",
      once: true,
      onEnter: (batch) => gsap.fromTo(batch, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: "power3.out", clearProps: "transform,opacity" }),
    });
    gsap.from(".pj-end__title, .pj-end__actions", {
      opacity: 0,
      y: 40,
      duration: 0.9,
      stagger: 0.12,
      ease: "power3.out",
      scrollTrigger: { trigger: ".pj-end", start: "top 82%", once: true },
    });
  };

  const initProgress = () => {
    const bar = $("#pjProgress");
    let ticking = false;
    const update = () => {
      ticking = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    };
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  };

  /* ---------- wiring ---------- */
  const init = () => {
    renderFilters();
    renderIndex();
    renderGrid();
    renderPreview();
    moveThumb(true);
    if (document.fonts) document.fonts.ready.then(() => moveThumb(true));
    window.addEventListener("resize", () => moveThumb(true));

    els.filters.addEventListener("click", (e) => {
      const chip = e.target.closest(".pj-chip");
      if (chip) setFilter(chip.dataset.filter);
    });
    els.view.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-view]");
      if (btn) setView(btn.dataset.view);
    });
    els.index.addEventListener("click", (e) => {
      const head = e.target.closest(".pj-row__head");
      if (head) toggleRow(head.closest(".pj-row"));
    });
    els.grid.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      const card = e.target.closest(".pj-card");
      if (card) openDialog(card.dataset.id, $(".more", card));
    });

    /* open straight into a filter or the gallery from a link such as projects.html#ai */
    const hash = location.hash.slice(1);
    if (FILTERS.some(([key]) => key === hash) && filterCount(hash) > 0) setFilter(hash);
    let saved = null;
    try { saved = localStorage.getItem("pjView"); } catch (e) { /* ignore */ }
    if (saved === "grid" || /[?&]view=grid/.test(location.search)) setView("grid");

    intro();
    initReveals();
    initNook();
    initPreview();
    initProgress();
  };

  init();
})();
