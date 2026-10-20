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
    const frag = document.createDocumentFragment();
    const pieces = [];
    for (let i = 0; i < count; i++) {
      const piece = document.createElement("span");
      piece.className = "confetti";
      const round = Math.random() > 0.5;
      piece.style.background = colors[i % colors.length];
      piece.style.borderRadius = round ? "50%" : "2px";
      frag.appendChild(piece);
      pieces.push(piece);
    }
    document.body.appendChild(frag);

    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];
      const angle = Math.random() * Math.PI * 2;
      const dist = 70 + Math.random() * 130;
      gsap.set(piece, { x, y, rotation: Math.random() * 360, scale: 0.6 + Math.random() * 0.9, force3D: true });
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

  /* theme switching lives in theme.js (shared with the projects page) */

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
    window.dispatchEvent(new CustomEvent("mango:project", { detail: key }));
  };
  const closeProject = () => {
    if (!dialog.open) return;
    window.dispatchEvent(new CustomEvent("mango:projectClose"));
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
    window.dispatchEvent(new CustomEvent("mango:scribble"));
  });

  /* ----- resume preview dialog ----- */
  const resumeDialog = $("#resumeDialog");
  const resumeDialogBody = $("#resumeDialogBody");
  let lastResumeOpener = null;

  const openResume = (opener) => {
    if (!resumeDialog) return;
    lastResumeOpener = opener || null;
    root.style.overflow = "hidden";
    resumeDialog.showModal();
    const focusClose = () => {
      const closeBtn = $("#resumeDialogClose");
      if (closeBtn) closeBtn.focus({ preventScroll: true });
    };
    focusClose();
    requestAnimationFrame(focusClose);
    setTimeout(focusClose, 120);

    if (opener && typeof burst === "function") {
      const r = opener.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, 28);
    }
    if (animate) {
      gsap.fromTo(
        resumeDialogBody,
        { opacity: 0, y: 32, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "power3.out" }
      );
      gsap.fromTo(
        $$(".rq-item", resumeDialogBody),
        { opacity: 0, y: 16, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.06, delay: 0.12, ease: "back.out(1.8)" }
      );
    }
    window.dispatchEvent(new CustomEvent("mango:resumeOpen"));
  };

  const closeResume = () => {
    if (!resumeDialog || !resumeDialog.open) return;
    window.dispatchEvent(new CustomEvent("mango:resumeClose"));
    if (animate) {
      gsap.to(resumeDialogBody, {
        opacity: 0,
        y: 20,
        scale: 0.97,
        duration: 0.22,
        ease: "power2.in",
        onComplete: () => resumeDialog.close(),
      });
    } else {
      resumeDialog.close();
    }
  };

  if (resumeDialog) {
    resumeDialog.addEventListener("close", () => {
      root.style.overflow = "";
      if (hasGsap) gsap.set(resumeDialogBody, { clearProps: "all" });
      if (lastResumeOpener) lastResumeOpener.focus({ preventScroll: true });
    });
    resumeDialog.addEventListener("cancel", (e) => {
      e.preventDefault();
      closeResume();
    });
    resumeDialog.addEventListener("click", (e) => {
      if (e.target === resumeDialog) closeResume();
    });
    const resumeCloseBtn = $("#resumeDialogClose");
    if (resumeCloseBtn) resumeCloseBtn.addEventListener("click", closeResume);
    const resumeCloseFooter = $("#resumeCloseFooter");
    if (resumeCloseFooter) resumeCloseFooter.addEventListener("click", closeResume);
  }

  // Hook up all resume buttons to openResume:
  ["#navResumeBtn", "#heroResumeBtn", "#socialResumeBtn", "#sheetResumeBtn"].forEach((sel) => {
    const btn = $(sel);
    if (btn) {
      btn.addEventListener("click", () => {
        const wasOpen = sheet && sheet.classList.contains("is-open");
        if (wasOpen && typeof setMenu === "function") setMenu(false);
        setTimeout(() => openResume(btn), wasOpen ? 250 : 0);
      });
    }
  });

  $$('a[href*="Resume"]').forEach((a) => {
    a.addEventListener("click", () => window.dispatchEvent(new CustomEvent("mango:resumeOpen")));
  });

  /* =====================================================================
     Daily 5 Mate Challenge (Tactical Chess Engine)
  ===================================================================== */
  (() => {
    const streakBadge = $("#chessStreakBadge");
    const titleEl = $("#chessTitle");
    const pillsWrap = $("#chessPills");
    const turnDot = $("#chessTurnDot");
    const turnText = $("#chessTurnText");
    const motifEl = $("#chessMotif");
    const hintBtn = $("#chessHintBtn");
    const resetBtn = $("#chessResetBtn");
    const prevBtn = $("#chessPrevBtn");
    const nextBtn = $("#chessNextBtn");
    const msgEl = $("#chessMsg");

    // 30 Official Lichess Tactical Puzzles (100% verified mathematically with chess.js)
    const PUZZLES = [
      {
            "id": "lic_003IX",
            "title": "Rapid Mating Attack",
            "motif": "#Checkmate",
            "turn": "b",
            "type": "m1",
            "fen": "8/3pk3/R7/1R2PK1p/2PPn1r1/8/8/8 b - - 0 43",
            "moves": [
                  "e4g3"
            ],
            "rating": 1726,
            "desc": "Official Lichess puzzle #003IX (1726 rating). Spot the immediate knockout blow!"
      },
      {
            "id": "lic_004JD",
            "title": "Rapid Mating Attack",
            "motif": "#Checkmate",
            "turn": "b",
            "type": "m1",
            "fen": "3r4/R7/2p5/p1P2p2/1p4k1/nP2K3/P3NP2/8 b - - 4 41",
            "moves": [
                  "a3c2"
            ],
            "rating": 1336,
            "desc": "Official Lichess puzzle #004JD (1336 rating). Spot the immediate knockout blow!"
      },
      {
            "id": "lic_004iZ",
            "title": "Rapid Mating Attack",
            "motif": "#Checkmate",
            "turn": "w",
            "type": "m1",
            "fen": "r2r2k1/2q1bpp1/3p3p/1ppn4/1P1BP3/P5Q1/4RPPP/R5K1 w - - 0 21",
            "moves": [
                  "g3g7"
            ],
            "rating": 570,
            "desc": "Official Lichess puzzle #004iZ (570 rating). Spot the immediate knockout blow!"
      },
      {
            "id": "lic_008LD",
            "title": "Rapid Mating Attack",
            "motif": "#Checkmate",
            "turn": "b",
            "type": "m1",
            "fen": "8/6pp/6k1/5pN1/5P2/5rPb/4R2P/6K1 b - - 1 35",
            "moves": [
                  "f3f1"
            ],
            "rating": 461,
            "desc": "Official Lichess puzzle #008LD (461 rating). Spot the immediate knockout blow!"
      },
      {
            "id": "lic_008Nz",
            "title": "Back-Rank Ambush",
            "motif": "#BackRankMate",
            "turn": "w",
            "type": "m1",
            "fen": "6k1/2p2ppp/pnp5/B7/2P3PP/1P2PPR1/r3b2r/3R2K1 w - - 2 30",
            "moves": [
                  "d1d8"
            ],
            "rating": 457,
            "desc": "Official Lichess puzzle #008Nz (457 rating). Spot the immediate knockout blow!"
      },
      {
            "id": "lic_00AGs",
            "title": "Rapid Mating Attack",
            "motif": "#Checkmate",
            "turn": "w",
            "type": "m1",
            "fen": "rn5Q/4kp2/2p1p1r1/1q4p1/8/8/4NPPP/3R1K1R w - - 6 24",
            "moves": [
                  "h8d8"
            ],
            "rating": 849,
            "desc": "Official Lichess puzzle #00AGs (849 rating). Spot the immediate knockout blow!"
      },
      {
            "id": "lic_00Bm8",
            "title": "Rapid Mating Attack",
            "motif": "#Checkmate",
            "turn": "b",
            "type": "m1",
            "fen": "8/6kp/4b1q1/1p6/1PpPN2Q/2P1P3/r5P1/5RK1 b - - 0 34",
            "moves": [
                  "g6g2"
            ],
            "rating": 1126,
            "desc": "Official Lichess puzzle #00Bm8 (1126 rating). Spot the immediate knockout blow!"
      },
      {
            "id": "lic_00DPQ",
            "title": "Rapid Mating Attack",
            "motif": "#Checkmate",
            "turn": "b",
            "type": "m1",
            "fen": "2k4r/pp3pp1/4pn2/2np2p1/8/1B1P1Pq1/PPPN3R/R2Q3K b - - 7 20",
            "moves": [
                  "g3h2"
            ],
            "rating": 769,
            "desc": "Official Lichess puzzle #00DPQ (769 rating). Spot the immediate knockout blow!"
      },
      {
            "id": "lic_00DWo",
            "title": "Rapid Mating Attack",
            "motif": "#Checkmate",
            "turn": "b",
            "type": "m1",
            "fen": "b4b1r/3k1ppp/p2p4/1p2p3/3Pq3/N3B3/PP3PPP/R2Q1RK1 b - - 0 16",
            "moves": [
                  "e4g2"
            ],
            "rating": 1063,
            "desc": "Official Lichess puzzle #00DWo (1063 rating). Spot the immediate knockout blow!"
      },
      {
            "id": "lic_00FHX",
            "title": "Decisive Infiltration",
            "motif": "#HangingPiece",
            "turn": "w",
            "type": "m1",
            "fen": "2r3k1/5p1p/4pP2/3p3P/8/5P2/p5P1/1bR3K1 w - - 1 31",
            "moves": [
                  "c1c8"
            ],
            "rating": 532,
            "desc": "Official Lichess puzzle #00FHX (532 rating). Spot the immediate knockout blow!"
      },
      {
            "id": "lic_00GRa",
            "title": "Rapid Mating Attack",
            "motif": "#Checkmate",
            "turn": "w",
            "type": "m1",
            "fen": "1r3rk1/2p1qppb/p2n4/1p2p1Pp/4Qn1P/2P1N3/PPB2P1K/3R2R1 w - - 0 29",
            "moves": [
                  "e4h7"
            ],
            "rating": 465,
            "desc": "Official Lichess puzzle #00GRa (465 rating). Spot the immediate knockout blow!"
      },
      {
            "id": "lic_00GY4",
            "title": "Rapid Mating Attack",
            "motif": "#Checkmate",
            "turn": "w",
            "type": "m1",
            "fen": "3k2r1/pR5R/3r4/4p3/7q/3Pn1PP/PP5K/8 w - - 0 28",
            "moves": [
                  "b7b8"
            ],
            "rating": 1205,
            "desc": "Official Lichess puzzle #00GY4 (1205 rating). Spot the immediate knockout blow!"
      },
      {
            "id": "lic_00H1C",
            "title": "Rapid Mating Attack",
            "motif": "#Checkmate",
            "turn": "w",
            "type": "m1",
            "fen": "r3r3/1kpR1qpp/p1n2p2/Qp2P2P/1N6/4Pb2/PPP3P1/2K2R2 w - - 1 23",
            "moves": [
                  "a5c7"
            ],
            "rating": 1528,
            "desc": "Official Lichess puzzle #00H1C (1528 rating). Spot the immediate knockout blow!"
      },
      {
            "id": "lic_00H9n",
            "title": "Rapid Mating Attack",
            "motif": "#Checkmate",
            "turn": "b",
            "type": "m1",
            "fen": "7k/6p1/8/4p3/Pp1Q4/1P3b1q/6P1/5RK1 b - - 0 45",
            "moves": [
                  "h3g2"
            ],
            "rating": 878,
            "desc": "Official Lichess puzzle #00H9n (878 rating). Spot the immediate knockout blow!"
      },
      {
            "id": "lic_00HHN",
            "title": "Rapid Mating Attack",
            "motif": "#Checkmate",
            "turn": "b",
            "type": "m1",
            "fen": "4r2k/p4R1p/1p6/2p5/2P5/1P4R1/r5PP/2K5 b - - 1 32",
            "moves": [
                  "e8e1"
            ],
            "rating": 491,
            "desc": "Official Lichess puzzle #00HHN (491 rating). Spot the immediate knockout blow!"
      },
      {
            "id": "lic_00HPz",
            "title": "Rapid Mating Attack",
            "motif": "#Checkmate",
            "turn": "b",
            "type": "m1",
            "fen": "6r1/7p/2pk1p2/P2p4/P2KbP2/2N1P3/5R1P/8 b - - 2 35",
            "moves": [
                  "c6c5"
            ],
            "rating": 681,
            "desc": "Official Lichess puzzle #00HPz (681 rating). Spot the immediate knockout blow!"
      },
      {
            "id": "lic_00HnR",
            "title": "Rapid Mating Attack",
            "motif": "#Checkmate",
            "turn": "b",
            "type": "m1",
            "fen": "q5kr/p4p2/4b1p1/4B2p/5n2/2P5/P1Q2PPP/3R1RK1 b - - 0 21",
            "moves": [
                  "a8g2"
            ],
            "rating": 755,
            "desc": "Official Lichess puzzle #00HnR (755 rating). Spot the immediate knockout blow!"
      },
      {
            "id": "lic_00HoG",
            "title": "Rapid Mating Attack",
            "motif": "#Checkmate",
            "turn": "w",
            "type": "m1",
            "fen": "5r1k/8/2b2rQp/1p1p2p1/1q4P1/8/8/1B3R1K w - - 0 37",
            "moves": [
                  "g6h7"
            ],
            "rating": 1489,
            "desc": "Official Lichess puzzle #00HoG (1489 rating). Spot the immediate knockout blow!"
      },
      {
            "id": "lic_00Hxb",
            "title": "Rapid Mating Attack",
            "motif": "#Checkmate",
            "turn": "w",
            "type": "m1",
            "fen": "1rb2k2/p4ppp/2B5/2pr1NP1/2P5/P7/7P/4R1K1 w - - 0 28",
            "moves": [
                  "e1e8"
            ],
            "rating": 1126,
            "desc": "Official Lichess puzzle #00Hxb (1126 rating). Spot the immediate knockout blow!"
      },
      {
            "id": "lic_00IPp",
            "title": "Rapid Mating Attack",
            "motif": "#Checkmate",
            "turn": "b",
            "type": "m1",
            "fen": "4Q3/6pk/p3p2p/5P2/1p1P4/4q2P/2B1n2B/7K b - - 0 35",
            "moves": [
                  "e3f3"
            ],
            "rating": 1597,
            "desc": "Official Lichess puzzle #00IPp (1597 rating). Spot the immediate knockout blow!"
      },
      {
            "id": "lic_000Zo",
            "title": "Rapid Mating Attack in 2",
            "motif": "#Checkmate",
            "turn": "b",
            "type": "m2",
            "fen": "4r3/1k6/pp3P2/1b5p/3R1p2/P1R2P2/1P4PP/6K1 b - - 0 35",
            "moves": [
                  "e8e1",
                  "g1f2",
                  "e1f1"
            ],
            "rating": 1311,
            "desc": "Official Lichess puzzle #000Zo (1311 rating). Find the 2-move forced mating sequence!"
      },
      {
            "id": "lic_000hf",
            "title": "Rapid Mating Attack in 2",
            "motif": "#Checkmate",
            "turn": "w",
            "type": "m2",
            "fen": "r1bq3r/pp1nbkp1/2p1p2p/8/2BP4/1PN3P1/P3QP1P/3R1RK1 w - - 0 20",
            "moves": [
                  "e2e6",
                  "f7f8",
                  "e6f7"
            ],
            "rating": 1590,
            "desc": "Official Lichess puzzle #000hf (1590 rating). Find the 2-move forced mating sequence!"
      },
      {
            "id": "lic_001Wz",
            "title": "Back-Rank Ambush in 2",
            "motif": "#BackRankMate",
            "turn": "w",
            "type": "m2",
            "fen": "6k1/5ppp/r1p5/p1n1rP2/8/2P2N1P/2P3P1/3R2K1 w - - 0 22",
            "moves": [
                  "d1d8",
                  "e5e8",
                  "d8e8"
            ],
            "rating": 1127,
            "desc": "Official Lichess puzzle #001Wz (1127 rating). Find the 2-move forced mating sequence!"
      },
      {
            "id": "lic_001om",
            "title": "Rapid Mating Attack in 2",
            "motif": "#Checkmate",
            "turn": "b",
            "type": "m2",
            "fen": "5r1k/pp4pp/5p2/1BbQp1r1/7K/7P/1PP3P1/3R3R b - - 3 26",
            "moves": [
                  "c5f2",
                  "g2g3",
                  "f2g3"
            ],
            "rating": 1018,
            "desc": "Official Lichess puzzle #001om (1018 rating). Find the 2-move forced mating sequence!"
      },
      {
            "id": "lic_003Tx",
            "title": "Back-Rank Ambush in 2",
            "motif": "#BackRankMate",
            "turn": "b",
            "type": "m2",
            "fen": "2r5/pR5p/5p1k/4p3/4R3/B4nPP/PP3P2/1K6 b - - 0 27",
            "moves": [
                  "f3d2",
                  "b1a1",
                  "c8c1"
            ],
            "rating": 1529,
            "desc": "Official Lichess puzzle #003Tx (1529 rating). Find the 2-move forced mating sequence!"
      },
      {
            "id": "lic_0042j",
            "title": "Back-Rank Ambush in 2",
            "motif": "#BackRankMate",
            "turn": "w",
            "type": "m2",
            "fen": "3r2k1/4nppp/pq3b2/1p2p3/2r2P2/2P1NR2/PP1Q2BP/3R2K1 w - - 0 25",
            "moves": [
                  "d2d8",
                  "b6d8",
                  "d1d8"
            ],
            "rating": 427,
            "desc": "Official Lichess puzzle #0042j (427 rating). Find the 2-move forced mating sequence!"
      },
      {
            "id": "lic_004X6",
            "title": "Rapid Mating Attack in 2",
            "motif": "#Checkmate",
            "turn": "b",
            "type": "m2",
            "fen": "1r4k1/p4ppp/2Q5/3pq3/8/P6P/2PR1PP1/1R4K1 b - - 0 26",
            "moves": [
                  "b8b1",
                  "d2d1",
                  "b1d1"
            ],
            "rating": 1176,
            "desc": "Official Lichess puzzle #004X6 (1176 rating). Find the 2-move forced mating sequence!"
      },
      {
            "id": "lic_005N7",
            "title": "Back-Rank Ambush in 2",
            "motif": "#BackRankMate",
            "turn": "w",
            "type": "m2",
            "fen": "r6k/2q3pp/8/2p5/R1np4/7P/2PB1PP1/6K1 w - - 0 33",
            "moves": [
                  "a4a8",
                  "c7b8",
                  "a8b8"
            ],
            "rating": 448,
            "desc": "Official Lichess puzzle #005N7 (448 rating). Find the 2-move forced mating sequence!"
      },
      {
            "id": "lic_005nD",
            "title": "Rapid Mating Attack in 2",
            "motif": "#Checkmate",
            "turn": "w",
            "type": "m2",
            "fen": "3rk2r/2qn2p1/p1Q1p3/3n3p/8/8/PP4PP/5R1K w k - 0 24",
            "moves": [
                  "c6e6",
                  "d5e7",
                  "e6f7"
            ],
            "rating": 964,
            "desc": "Official Lichess puzzle #005nD (964 rating). Find the 2-move forced mating sequence!"
      },
      {
            "id": "lic_006HV",
            "title": "Rapid Mating Attack in 2",
            "motif": "#Checkmate",
            "turn": "b",
            "type": "m2",
            "fen": "1r6/5k2/2Q1pNp1/p5Pp/1p2P2P/2P4R/KP3P2/3q4 b - - 0 31",
            "moves": [
                  "b4b3",
                  "a2a3",
                  "d1a1"
            ],
            "rating": 1293,
            "desc": "Official Lichess puzzle #006HV (1293 rating). Find the 2-move forced mating sequence!"
      }
]

    // Deterministic Daily Puzzle Selection
    const getDateSeed = (dateStr) => {
      let hash = 0;
      for (let i = 0; i < dateStr.length; i++) {
        hash = (hash << 5) - hash + dateStr.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash);
    };

    const seededRandom = (seed) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    const getDailyPuzzles = (dateStr) => {
      const m1List = PUZZLES.filter((p) => p.type === "m1");
      const m2List = PUZZLES.filter((p) => p.type === "m2");
      const seed = getDateSeed(dateStr);
      const chosen = [];

      const m1Indices = [...Array(m1List.length).keys()];
      for (let i = 0; i < 3; i++) {
        const s = seed + i * 19;
        const rIdx = Math.floor(seededRandom(s) * m1Indices.length);
        chosen.push(m1List[m1Indices.splice(rIdx, 1)[0]]);
      }

      const m2Indices = [...Array(m2List.length).keys()];
      for (let i = 0; i < 2; i++) {
        const s = seed + (i + 3) * 37;
        const rIdx = Math.floor(seededRandom(s) * m2Indices.length);
        chosen.push(m2List[m2Indices.splice(rIdx, 1)[0]]);
      }
      return chosen;
    };

    // State
    const boardEl = $("#chessBoard");
    if (!boardEl) return;

    const todayStr = new Date().toISOString().slice(0, 10);
    const storageKey = "chess_daily_" + todayStr;
    const dailyPuzzles = getDailyPuzzles(todayStr);

    let solvedStatus = [false, false, false, false, false];
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) solvedStatus = JSON.parse(saved);
    } catch (e) {}

    let currentPuzzleIdx = 0;
    let currentPuzzle = dailyPuzzles[0];
    let currentStep = 0;
    let isCheckmated = false;
    let hintLevel = 0;
    let isBusy = false;
    let chessEngine = null;
    let selectedSquare = null;
    let currentLegalMoves = [];
    const hintsOverlay = $("#chessHintsOverlay");

    const updateBadges = () => {
      const solvedCount = solvedStatus.filter(Boolean).length;
      if (streakBadge) streakBadge.textContent = `Solved ${solvedCount} / 5`;
    };

    const updatePillsUI = () => {
      if (!pillsWrap) return;
      const pills = pillsWrap.querySelectorAll(".pill");
      pills.forEach((p, idx) => {
        p.classList.toggle("is-active", idx === currentPuzzleIdx);
        p.classList.toggle("is-solved", !!solvedStatus[idx]);
        p.textContent = solvedStatus[idx] ? `${idx + 1} ✓` : `${idx + 1}`;
      });
    };

    const getGridCoords = (square, orientation) => {
      const file = square.charCodeAt(0) - 97;
      const rank = parseInt(square.charAt(1), 10) - 1;
      const col = orientation === "white" ? file + 1 : 8 - file;
      const row = orientation === "white" ? 8 - rank : rank + 1;
      return { col, row };
    };

    const clearHints = () => {
      selectedSquare = null;
      currentLegalMoves = [];
      if (hintsOverlay) hintsOverlay.innerHTML = "";
    };

    const showLegalMoves = (square) => {
      if (!chessEngine || !hintsOverlay || isBusy || isCheckmated) return;
      const piece = chessEngine.get(square);
      const playerColor = currentPuzzle.turn;
      if (!piece || piece.color !== playerColor) {
        clearHints();
        return;
      }

      const moves = chessEngine.moves({ square, verbose: true });
      selectedSquare = square;
      currentLegalMoves = moves;

      const frag = document.createDocumentFragment();
      const orientation = boardEl.orientation || "white";

      // Selected square highlight
      const selPos = getGridCoords(square, orientation);
      const selEl = document.createElement("div");
      selEl.className = "chess__hint-selected";
      selEl.style.setProperty("--col", selPos.col);
      selEl.style.setProperty("--row", selPos.row);
      frag.appendChild(selEl);

      // Destination squares: circular dots for empty squares, rings for captures
      moves.forEach((m) => {
        const destPos = getGridCoords(m.to, orientation);
        const destEl = document.createElement("div");
        destEl.className = m.captured ? "chess__hint-ring" : "chess__hint-dot";
        destEl.style.setProperty("--col", destPos.col);
        destEl.style.setProperty("--row", destPos.row);
        frag.appendChild(destEl);
      });

      hintsOverlay.innerHTML = "";
      hintsOverlay.appendChild(frag);
    };

    const getSquareFromEvent = (e) => {
      if (e.composedPath) {
        const sqEl = e.composedPath().find((el) => el.getAttribute && el.getAttribute("data-square"));
        if (sqEl) return sqEl.getAttribute("data-square");
      }
      const rect = boardEl.getBoundingClientRect();
      const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : null);
      const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : null);
      if (clientX === null || clientY === null) return null;

      const x = clientX - rect.left;
      const y = clientY - rect.top;
      if (x < 0 || x > rect.width || y < 0 || y > rect.height) return null;

      const col = Math.floor((x / rect.width) * 8);
      const row = Math.floor((y / rect.height) * 8);
      const orientation = boardEl.orientation || "white";

      let file, rank;
      if (orientation === "white") {
        file = String.fromCharCode(97 + col);
        rank = 8 - row;
      } else {
        file = String.fromCharCode(104 - col);
        rank = 1 + row;
      }
      return `${file}${rank}`;
    };

    const executeMoveStep = (source, target, isDrop = false, dropEvent = null) => {
      clearHints();
      if (isBusy || isCheckmated) {
        if (isDrop && dropEvent) dropEvent.detail.setAction("snapback");
        return;
      }

      const moveStr = source + target;
      const expectedMove = currentPuzzle.moves[currentStep * 2];

      if (moveStr === expectedMove) {
        // Correct winning move!
        if (!isDrop) {
          boardEl.move(source + "-" + target);
        }
        if (chessEngine) chessEngine.move({ from: source, to: target });

        if (currentPuzzle.type === "m1" || currentStep === 1) {
          onCheckmate();
        } else {
          // Mate in 2: Step 1 completed, computer replies!
          currentStep = 1;
          isBusy = true;
          if (msgEl) {
            msgEl.className = "chess__msg is-success";
            msgEl.textContent = "Brilliant move! Opponent makes the forced reply...";
          }

          setTimeout(() => {
            const replyMove = currentPuzzle.moves[1];
            const from = replyMove.slice(0, 2);
            const to = replyMove.slice(2, 4);
            boardEl.move(from + "-" + to);
            if (chessEngine) chessEngine.move({ from, to });
            isBusy = false;
            if (msgEl) {
              msgEl.className = "chess__msg";
              msgEl.textContent = "Forced defense played. Now deliver the knockout blow!";
            }
          }, 450);
        }
      } else {
        // Wrong move
        if (isDrop && dropEvent) {
          dropEvent.detail.setAction("snapback");
        } else {
          boardEl.move(source + "-" + target);
          setTimeout(() => {
            boardEl.setPosition(chessEngine ? chessEngine.fen() : currentPuzzle.fen, true);
          }, 380);
        }

        boardEl.classList.remove("is-shaking");
        void boardEl.offsetWidth;
        boardEl.classList.add("is-shaking");
        if (msgEl) {
          msgEl.className = "chess__msg is-error";
          msgEl.textContent = "Not checkmate! The defender can still escape. Try another line.";
        }
        window.dispatchEvent(new CustomEvent("mango:chess", { detail: { action: "wrong" } }));
      }
    };

    const loadPuzzle = (puzzle) => {
      currentPuzzle = puzzle;
      currentStep = 0;
      isCheckmated = false;
      hintLevel = 0;
      isBusy = false;

      if (typeof window.Chess === "function") {
        chessEngine = new window.Chess(puzzle.fen);
      }
      clearHints();

      if (titleEl) titleEl.textContent = puzzle.title;
      if (turnDot) {
        turnDot.className = "chess__turn-dot " + (puzzle.turn === "w" ? "is-white" : "is-black");
        turnDot.textContent = "";
      }
      if (turnText) {
        turnText.textContent = `${puzzle.turn === "w" ? "White" : "Black"} to move • ${puzzle.type === "m1" ? "Mate in 1" : "Mate in 2"}`;
      }
      if (motifEl) motifEl.textContent = puzzle.motif;
      if (msgEl) {
        msgEl.className = "chess__msg";
        msgEl.textContent = "Tap or drag a piece to see legal moves and deliver checkmate!";
      }

      updateBadges();
      updatePillsUI();

      // Setup premade chess-board
      boardEl.orientation = puzzle.turn === "w" ? "white" : "black";
      boardEl.setPosition(puzzle.fen, false);
      if (boardEl._highlightedSquares) {
        boardEl._highlightedSquares.clear();
        boardEl.requestUpdate();
      }
    };

    // Click on board: Tap piece to view moves, or tap legal destination to move!
    boardEl.addEventListener("click", (e) => {
      if (isBusy || isCheckmated) return;
      const sq = getSquareFromEvent(e);
      if (!sq) {
        clearHints();
        return;
      }

      // 1. If a square is selected and clicked square is one of its legal destinations:
      if (selectedSquare && currentLegalMoves.some((m) => m.to === sq)) {
        executeMoveStep(selectedSquare, sq, false);
        return;
      }

      // 2. If clicking on current player's piece: show legal moves!
      if (chessEngine) {
        const piece = chessEngine.get(sq);
        if (piece && piece.color === currentPuzzle.turn) {
          if (selectedSquare === sq) {
            clearHints(); // Toggle off if tapped again
          } else {
            showLegalMoves(sq);
          }
          return;
        }
      }

      // 3. Clicked empty square or opponent piece:
      clearHints();
    });

    // Drag start validation & show legal moves
    boardEl.addEventListener("drag-start", (e) => {
      if (isBusy || isCheckmated) {
        e.preventDefault();
        return;
      }
      const playerColor = currentPuzzle.turn;
      const piece = e.detail.piece;
      if (!piece || piece.charAt(0) !== playerColor) {
        e.preventDefault();
        return;
      }
      showLegalMoves(e.detail.source);
    });

    // Drop move validation
    boardEl.addEventListener("drop", (e) => {
      const { source, target } = e.detail;
      if (!source || !target || source === target) {
        clearHints();
        e.detail.setAction("snapback");
        return;
      }
      executeMoveStep(source, target, true, e);
    });

    // Deselect if user clicks outside the board
    document.addEventListener("click", (e) => {
      if (!boardEl.contains(e.target) && (!hintsOverlay || !hintsOverlay.contains(e.target))) {
        clearHints();
      }
    });

    const onCheckmate = () => {
      isCheckmated = true;
      if (msgEl) {
        msgEl.className = "chess__msg is-success";
        msgEl.textContent = "Checkmate! Well played.";
      }

      // Mark daily puzzle solved
      solvedStatus[currentPuzzleIdx] = true;
      try {
        localStorage.setItem(storageKey, JSON.stringify(solvedStatus));
      } catch (e) { /* storage can be blocked */ }
      updateBadges();
      updatePillsUI();
      
      const allSolved = solvedStatus.every(Boolean);

      // Fire confetti burst
      if (typeof burst === "function") {
        const boardRect = boardEl.getBoundingClientRect();
        burst(boardRect.left + boardRect.width * 0.5, boardRect.top + boardRect.height * 0.45, 45);
      }

      // Trigger Mango the cat dialogue & reactions
      window.dispatchEvent(new CustomEvent("mango:chess", {
        detail: { action: "mate", allSolved }
      }));
    };

    // Controls
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        loadPuzzle(currentPuzzle);
        window.dispatchEvent(new CustomEvent("mango:chess", { detail: { action: "reset" } }));
      });
    }

    if (hintBtn) {
      hintBtn.addEventListener("click", () => {
        if (isCheckmated || isBusy) return;
        hintLevel = Math.min(hintLevel + 1, 2);
        const expectedMove = currentPuzzle.moves[currentStep * 2];
        if (expectedMove) {
          const fromSq = expectedMove.slice(0, 2);
          const toSq = expectedMove.slice(2, 4);
          if (hintLevel === 1) {
            boardEl._highlightSquare(fromSq, true);
            showLegalMoves(fromSq);
            if (msgEl) msgEl.textContent = `Hint: Look at your piece on ${fromSq.toUpperCase()}!`;
          } else {
            boardEl._highlightSquare(toSq, true);
            if (msgEl) msgEl.textContent = `Target: Move to ${toSq.toUpperCase()} for the knockout!`;
          }
        }
        window.dispatchEvent(new CustomEvent("mango:chess", { detail: { action: "hint" } }));
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        currentPuzzleIdx = (currentPuzzleIdx - 1 + dailyPuzzles.length) % dailyPuzzles.length;
          loadPuzzle(dailyPuzzles[currentPuzzleIdx]);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        currentPuzzleIdx = (currentPuzzleIdx + 1) % dailyPuzzles.length;
          loadPuzzle(dailyPuzzles[currentPuzzleIdx]);
      });
    }

    if (pillsWrap) {
      pillsWrap.addEventListener("click", (e) => {
        const pill = e.target.closest(".pill");
        if (pill) {
          const idx = parseInt(pill.dataset.idx, 10);
          if (!isNaN(idx) && idx >= 0 && idx < dailyPuzzles.length) {
            currentPuzzleIdx = idx;
            loadPuzzle(dailyPuzzles[idx]);
          }
        }
      });
    }

    // Initialize with first daily puzzle
    if (customElements.get("chess-board")) {
      loadPuzzle(dailyPuzzles[0]);
    } else {
      customElements.whenDefined("chess-board").then(() => loadPuzzle(dailyPuzzles[0]));
    }
  })();

  /* =====================================================================
     Mango the cat, paw prints and the "meow" easter egg
  ===================================================================== */
  (() => {
    const PAW = '<svg viewBox="0 0 64 64" aria-hidden="true"><use href="#paw"/></svg>';
    const rand = (a, b) => a + Math.random() * (b - a);
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    /* ----- paw prints that walk across the page between sections ----- */
    const walks = $$("[data-pawwalk]");
    walks.forEach((el) => {
      if (!el.children.length) {
        el.innerHTML = Array.from({ length: 14 }, (_, i) => `<i style="--i:${i}">${PAW}</i>`).join("");
      }
      el.classList.add("is-in");
    });

    /* ----- little effects ----- */
    const makeSvg = (cls) => {
      const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      el.setAttribute("class", cls);
      el.setAttribute("viewBox", "0 0 64 64");
      el.setAttribute("aria-hidden", "true");
      const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
      use.setAttribute("href", "#paw");
      el.appendChild(use);
      return el;
    };
    const trailTpl = makeSvg("trail-paw");

    const pawBurst = (x, y) => {
      if (reduceMotion) return;
      const frag = document.createDocumentFragment();
      for (let i = 0; i < 12; i++) {
        const el = document.createElement("span");
        el.className = "pop";
        el.innerHTML = i % 3 === 0 ? "&#10084;&#xFE0E;" : PAW;
        const ang = rand(-Math.PI * 0.95, -Math.PI * 0.05);
        const dist = rand(70, 170);
        el.style.setProperty("--x", x - 11 + "px");
        el.style.setProperty("--y", y - 11 + "px");
        el.style.setProperty("--dx", Math.cos(ang) * dist + "px");
        el.style.setProperty("--dy", Math.sin(ang) * dist + "px");
        el.style.setProperty("--rot", rand(-70, 70) + "deg");
        el.style.animationDelay = i * 25 + "ms";
        frag.appendChild(el);
        el.addEventListener("animationend", () => el.remove(), { once: true });
      }
      document.body.appendChild(frag);
    };

    walks.forEach((walk) => {
      walk.addEventListener("click", (e) => {
        const paw = e.target.closest("i");
        if (!paw) return;
        const r = paw.getBoundingClientRect();
        pawBurst(r.left + r.width / 2, r.top + r.height / 2);
      });
    });

    const pawRain = () => {
      if (reduceMotion) return;
      for (let i = 0; i < 20; i++) {
        const el = makeSvg("rain-paw");
        el.style.left = rand(0, 98) + "vw";
        el.style.setProperty("--rot", rand(-200, 200) + "deg");
        el.style.animationDelay = rand(0, 900) + "ms";
        document.body.appendChild(el);
        el.addEventListener("animationend", () => el.remove());
      }
    };

    /* ----- paw trail behind the cursor ----- */
    const pawBtn = $("#pawToggle");
    let trailOn = true;
    try { if (localStorage.getItem("paws") === "off") trailOn = false; } catch (e) { /* ignore */ }
    const syncPaw = () => {
      pawBtn.setAttribute("aria-pressed", String(trailOn));
      pawBtn.textContent = "Paw trail: " + (trailOn ? "on" : "off");
    };
    syncPaw();
    pawBtn.addEventListener("click", () => {
      trailOn = !trailOn;
      try { localStorage.setItem("paws", trailOn ? "on" : "off"); } catch (e) { /* ignore */ }
      syncPaw();
      window.dispatchEvent(new CustomEvent("mango:pawToggle", { detail: trailOn }));
    });

    if (finePointer && !reduceMotion) {
      let lx = null, ly = null, side = 1, live = 0;
      window.addEventListener(
        "pointermove",
        (e) => {
          if (e.pointerType !== "mouse" || !trailOn || document.body.classList.contains("is-loading")) return;
          if (lx === null) { lx = e.clientX; ly = e.clientY; return; }
          const dx = e.clientX - lx, dy = e.clientY - ly;
          if (Math.hypot(dx, dy) < 46 || live > 22) return;
          const ang = Math.atan2(dy, dx);
          const el = trailTpl.cloneNode(true);
          el.style.setProperty("--tx", e.clientX - Math.sin(ang) * 9 * side - 11 + "px");
          el.style.setProperty("--ty", e.clientY + Math.cos(ang) * 9 * side - 11 + "px");
          el.style.setProperty("--r", (ang * 180) / Math.PI + 90 + "deg");
          side *= -1;
          document.body.appendChild(el);
          live++;
          el.addEventListener("animationend", () => { el.remove(); live--; }, { once: true });
          lx = e.clientX; ly = e.clientY;
        },
        { passive: true }
      );
    }

    /* ----- Mango ----- */
    const wrap = $("#catWrap");
    const catBtn = $("#cat");
    const bubble = $("#catBubble");
    const pupils = $$(".cat__pupil");
    const head = $(".cat__head");
    let speakingUntil = 0;
    let bubbleTimer, sleepTimer, sleepyTimer, moodTimer, purrTimer, asleep = false, idleSleepy = false;

    const triggerPurr = () => {
      wrap.classList.remove("is-purr");
      void wrap.offsetWidth;
      wrap.classList.add("is-purr");
      clearTimeout(purrTimer);
      purrTimer = setTimeout(() => wrap.classList.remove("is-purr"), 850);
    };

    /* moods: neutral, happy, excited, love, surprised, sleepy, annoyed, curious, dizzy, sad */
    const setMood = (mood, ms = 1800) => {
      if (asleep && mood !== "surprised") return;
      idleSleepy = false;
      wrap.dataset.mood = mood;
      clearTimeout(moodTimer);
      if (mood !== "neutral") moodTimer = setTimeout(() => { wrap.dataset.mood = "neutral"; }, ms);
    };

    /* never let the cat's speech bubble sit on top of the chess board */
    const keepBubbleOffBoard = () => {
      const board = $(".chess__board-wrap");
      if (!board) return;
      bubble.classList.remove("is-compact", "is-hidden");
      const hits = () => {
        const a = bubble.getBoundingClientRect(), b = board.getBoundingClientRect();
        return a.left < b.right + 12 && a.right > b.left - 12 && a.top < b.bottom + 12 && a.bottom > b.top - 12;
      };
      if (!hits()) return;
      bubble.classList.add("is-compact");
      if (hits()) bubble.classList.add("is-hidden");
    };

    const say = (text, ms = 3800, mood) => {
      if (asleep) {
        asleep = false;
        wrap.classList.remove("is-asleep");
      }
      armSleep();

      bubble.textContent = text;
      bubble.classList.remove("is-on");
      void bubble.offsetWidth;
      bubble.classList.add("is-on");
      wrap.classList.add("is-up");
      keepBubbleOffBoard();
      speakingUntil = performance.now() + Math.min(ms, 2000);
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(() => { bubble.classList.remove("is-on"); wrap.classList.remove("is-up"); }, ms);
      if (mood) setMood(mood, ms);
    };


    const armSleep = () => {
      clearTimeout(sleepTimer);
      clearTimeout(sleepyTimer);
      sleepyTimer = setTimeout(() => { if (!asleep) { setMood("sleepy", 4200); idleSleepy = true; } }, 12000);
      sleepTimer = setTimeout(() => {
        asleep = true;
        wrap.dataset.mood = "neutral";
        wrap.classList.add("is-asleep");
        wrap.classList.remove("is-up");
        bubble.classList.remove("is-on");
      }, 16000);
    };

    const wake = (msg) => {
      if (asleep) {
        asleep = false;
        wrap.classList.remove("is-asleep");
        setMood("surprised", 1000);
        if (msg) say(msg, 2400);
      } else if (idleSleepy) {
        setMood("neutral");
      }
      armSleep();
    };

    /* eyes and head follow the pointer (optimized with rAF batching & cached rect) */
    let catRect = null;
    let ptrRaf = false;
    let ptrX = 0, ptrY = 0;

    const updateCatRect = () => {
      if (catBtn) catRect = catBtn.getBoundingClientRect();
    };
    window.addEventListener("resize", updateCatRect, { passive: true });

    const renderCatPointer = () => {
      ptrRaf = false;
      if (asleep || !wrap.classList.contains("is-here")) return;
      if (!catRect) updateCatRect();
      if (!catRect) return;

      const cx = catRect.left + catRect.width * 0.5;
      const cy = catRect.top + catRect.height * 0.38;
      const dx = ptrX - cx;
      const dy = ptrY - cy;
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 240);

      const pxVal = ((dx / d) * 3.1 * k).toFixed(2) + "px";
      const pyVal = ((dy / d) * 3.1 * k).toFixed(2) + "px";
      const tiltVal = Math.max(-7, Math.min(7, (dx / window.innerWidth) * 18)).toFixed(1) + "deg";

      for (let i = 0; i < pupils.length; i++) {
        pupils[i].style.setProperty("--px", pxVal);
        pupils[i].style.setProperty("--py", pyVal);
      }
      head.style.setProperty("--tilt", tiltVal);
    };

    window.addEventListener(
      "pointermove",
      (e) => {
        wake();
        ptrX = e.clientX;
        ptrY = e.clientY;
        if (!ptrRaf) {
          ptrRaf = true;
          requestAnimationFrame(renderCatPointer);
        }
      },
      { passive: true }
    );
    ["touchstart"].forEach((ev) => window.addEventListener(ev, () => wake(), { passive: true }));

    /* he is pleased to see you */
    catBtn.addEventListener("mouseenter", () => { if (!asleep) setMood("happy", 1400); });

    /* petting him: happy, loving, and grumpy if you overdo it */
    const lines = [
      ["purrrrr... that's the good spot!", "love"],
      ["mrrp! Sai gives good scratches too.", "happy"],
      ["*headbutt* feed me some tuna?", "love"],
      ["*kneading biscuits on screen*", "excited"],
      ["meow! you're officially my favorite human.", "happy"],
      ["purrrrr... again, again!", "love"],
    ];
    const clicks = [];
    let li = 0;
    catBtn.addEventListener("click", () => {
      const wasAsleep = asleep;
      asleep = false;
      wrap.classList.remove("is-asleep");
      armSleep();
      const now = Date.now();
      clicks.push(now);
      while (clicks.length && now - clicks[0] > 3500) clicks.shift();
      const r = catBtn.getBoundingClientRect();
      if (clicks.length >= 8) {
        clicks.length = 0;
        say("HISSSS! Personal space, human!", 2800, "annoyed");
      } else if (clicks.length >= 5) {
        say("okay okay, watch the fur!", 2600, "annoyed");
      } else {
        if (wasAsleep) {
          setMood("surprised", 900);
          setTimeout(() => setMood("happy", 1600), 950);
          say("mrrp?! oh, you're petting me...", 2400, "happy");
        } else {
          const [text, mood] = lines[li++ % lines.length];
          say(text, 2800, mood);
        }
        triggerPurr();
        pawBurst(r.left + r.width * 0.5, r.top + r.height * 0.25);
      }
    });

    /* he reacts to what you do */
    const ready = () => wrap.classList.contains("is-here") && !asleep;

    /* hovering a project card makes him curious */
    let curiousCool = 0;
    document.addEventListener(
      "mouseover",
      (e) => {
        const card = e.target.closest && e.target.closest(".card[data-project]");
        if (card && ready() && performance.now() > curiousCool && performance.now() > dizzyUntil) {
          curiousCool = performance.now() + 4000;
          setMood("curious", 1800);
        }
      },
      { passive: true }
    );
    /* project details dialog commentary */
    const projectQuips = {
      clip: "Clip! Client-side zero-knowledge encryption. Even I can't read what's in there!",
      campus: "Campus Circular! Won 1st Runner Up at Web Fusion 2.0. Proud cat moment!",
      capital: "CapitalAI! Autonomous quant risk safeguards. Smarter than my banker.",
      legal: "LegalAI! RAG engine for Indian criminal statutes. Clean record here, promise!",
      loop: "Loop! Autonomous SRE dashboard. Watches server vitals while I sleep.",
      geoclash: "GeoClash! Sai and a friend built a run-a-loop territory game. I only chase lasers, not runners.",
    };

    /* copying the email makes him fall in love with the idea of treats */
    $("#copyBtn").addEventListener("click", () => { say("Treats incoming! Tell Sai to feed me!", 3200, "love"); });

    /* theme change: night vision in the dark, squinting in the light */
    const syncNight = (theme) => { wrap.dataset.night = String(theme === "dark"); };
    syncNight(root.getAttribute("data-theme"));
    window.addEventListener("themechange", (e) => {
      syncNight(e.detail);
      if (e.detail === "dark") say("ooh, night vision activated!", 2600, "happy");
      else say("too bright! where are my sunglasses?", 2400, "annoyed");
    });

    /* ----- Mango's first-scroll guided tour of Sai & each section ----- */
    const tour = {
      hero: {
        text: "Hi! I'm Mango, Sai's official supervisor. Scroll down and I'll give you the grand tour of my human!",
        mood: "happy",
        ms: 4200,
      },
      about: {
        text: "This is Sai! Computer engineering student in Mumbai (8.40 CGPA). He codes full-stack apps and gives 10/10 chin scratches.",
        mood: "love",
        ms: 4800,
      },
      experience: {
        text: "His grind zone: Frontend Intern at XIRCLS & tech member at Project Cell! He builds real stuff while I nap 16 hours a day.",
        mood: "curious",
        ms: 4800,
      },
      work: {
        text: "His proudest creations! Clip, Campus Circular, CapitalAI... Click any card! I helped by sitting directly on the spacebar.",
        mood: "excited",
        ms: 5000,
      },
      skills: {
        text: "Look at this stack: React, Next.js, Node, Supabase, Python... Lots of brainpower, but he still can't catch the laser dot.",
        mood: "surprised",
        ms: 4800,
      },
      beyond: {
        text: "Beyond coursework: Music Blocks open source contributor and 6th in India at chess! (Though I'm still the master of knocking pieces down).",
        mood: "happy",
        ms: 5000,
      },
      contact: {
        text: "Wanna build something cool or hire Sai? Drop him an email! (P.S. Make sure your offer mentions cat treats)",
        mood: "love",
        ms: 4800,
      },
    };

    /* quick quips for subsequent visits once the first scroll tour is complete */
    const revisitedTalk = {
      hero: ["Back at the top! Ready for round two?", "happy", 2600],
      about: ["Yup, still my favorite human.", "love", 2400],
      experience: ["Hard worker. I would have napped.", "sleepy", 2400],
      work: ["Did you try the live demos yet? Go poke them!", "curious", 2600],
      skills: ["All these tech chips... still zero fish.", "sad", 2400],
      beyond: ["Careful around that knight, it jumps!", "excited", 2400],
      contact: ["Don't be shy, send that email!", "love", 2600],
    };

    const toured = new Set();
    const sectionOrder = ["hero", "about", "experience", "work", "skills", "beyond", "contact"];
    let lastActiveSection = null;
    let tourBusyUntil = 0;

    const introduceSection = (id, isFirstTour = true) => {
      if (!wrap.classList.contains("is-here")) wrap.classList.add("is-here");
      
      // Wake Mango if asleep
      if (asleep) {
        asleep = false;
        wrap.classList.remove("is-asleep");
      }
      armSleep();

      const item = isFirstTour
        ? tour[id]
        : (revisitedTalk[id] ? { text: revisitedTalk[id][0], mood: revisitedTalk[id][1], ms: revisitedTalk[id][2] } : null);
      if (!item) return;

      if (isFirstTour) toured.add(id);
      lastActiveSection = id;
      tourBusyUntil = performance.now() + Math.min(item.ms, 4000);

      // Cute burst & purr animation on first introduction
      if (isFirstTour && id !== "hero") {
        triggerPurr();
        const r = catBtn.getBoundingClientRect();
        pawBurst(r.left + r.width * 0.5, r.top + r.height * 0.25);
      }

      say(item.text, item.ms, item.mood);
    };

    /* robust section tracker: triggers the very first scroll introduction reliably */
    const sectionEls = sectionOrder.map((id) => document.getElementById(id));
    let scrollRafScheduled = false;

    const checkActiveSection = () => {
      if (document.body.classList.contains("is-loading")) return;
      if (performance.now() < dizzyUntil) return; // Do NOT interrupt active dizzy animation

      const vh = window.innerHeight;
      const targetLine = vh * 0.42; // Focal reading line: 42% from top of viewport
      let active = null;

      for (let i = 0; i < sectionEls.length; i++) {
        const el = sectionEls[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        // Check if this section spans across the focal reading line
        if (rect.top <= targetLine && rect.bottom >= targetLine * 0.4) {
          active = sectionOrder[i];
        }
      }

      // Explicit bounds for the very top and very bottom
      if (window.scrollY < 140) {
        active = "hero";
      } else if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100) {
        active = "contact";
      }

      if (active && active !== lastActiveSection) {
        const isFirst = !toured.has(active);
        if (isFirst) {
          introduceSection(active, true);
        } else if (performance.now() > tourBusyUntil + 1400) {
          introduceSection(active, false);
        }
      }
    };

    const scheduleScrollCheck = () => {
      if (scrollRafScheduled) return;
      scrollRafScheduled = true;
      requestAnimationFrame(() => {
        scrollRafScheduled = false;
        if (performance.now() >= dizzyUntil) {
          checkActiveSection();
        }
      });
    };

    /* scrolling A LOT FAST only: sustained frantic scrolling triggers dizzy animation */
    let lastY = window.scrollY, lastT = performance.now();
    let dizzyCool = 0, dizzyUntil = 0;
    let fastDistance = 0, lastFastTime = 0;
    let scrollSettleTimer = null;

    window.addEventListener(
      "scroll",
      () => {
        wake();
        const now = performance.now(), y = window.scrollY;
        let dt = now - lastT;
        lastT = now;

        // If user was idle for more than 350ms, treat as a new gesture
        if (dt > 350) {
          fastDistance = 0;
          dt = 25; // baseline interval for first tick of gesture
        }

        const dy = Math.abs(y - lastY);
        lastY = y;
        if (dt < 10) return; // avoid division spikes on micro-intervals
        const v = (dy / dt) * 1000;

        // If more than 420ms elapsed since last rapid tick, reset the accumulator
        if (now - lastFastTime > 420) {
          fastDistance = 0;
        }

        // Only accumulate displacement during high-velocity scrolling (>= 3800 px/s)
        if (v >= 3800) {
          fastDistance += dy;
          lastFastTime = now;
        }

        // ONLY trigger dizzy if user scrolls "a lot fast":
        // Requires sustained aggressive velocity accumulating > 1800px in a rapid burst
        if (fastDistance >= 1800 && now > dizzyCool && ready()) {
          dizzyCool = now + 12000;
          dizzyUntil = now + 2800;
          tourBusyUntil = dizzyUntil + 500;
          fastDistance = 0;
          say("whoa, slow down! world is spinning!", 2600, "dizzy");
        }

        if (now >= dizzyUntil) {
          scheduleScrollCheck();
        }

        // When scrolling settles, verify active section (and introduce once dizziness clears)
        clearTimeout(scrollSettleTimer);
        const delay = Math.max(260, (dizzyUntil - now) + 120);
        scrollSettleTimer = setTimeout(() => {
          checkActiveSection();
        }, delay);
      },
      { passive: true }
    );

    /* reaction to scribble (Sai's name clicked) */
    window.addEventListener("mango:scribble", () => {
      say("That's my human! Computer engineer & top-tier cat servant.", 3200, "love");
    });

    /* reaction to opening project details */
    window.addEventListener("mango:project", (e) => {
      const key = e.detail;
      const line = projectQuips[key] || "Ooh, details! Tap the links to test the live demo!";
      say(line, 4200, "curious");
    });

    /* reaction to closing project details */
    window.addEventListener("mango:projectClose", () => {
      if (Math.random() > 0.4) {
        say("Liked that one? Poke another card!", 2600, "happy");
      }
    });

    /* interactive hover reactions on buttons & links */
    let hoverCool = 0;
    const attachHoverReaction = (selector, text, mood = "happy") => {
      $$(selector).forEach((el) => {
        let hoverTimer = null;
        el.addEventListener("mouseenter", () => {
          if (!wrap.classList.contains("is-here") || performance.now() < dizzyUntil) return;
          if (asleep) wake();
          setMood(mood, 1800);
          if (mood === "love" || mood === "excited") triggerPurr();
          hoverTimer = setTimeout(() => {
            const now = performance.now();
            /* a hover quip never talks over something Mango has just said */
            if (now > hoverCool && now >= dizzyUntil && now > speakingUntil) {
              hoverCool = performance.now() + 3500;
              say(text, 2800, mood);
            }
          }, 140);
        });
        el.addEventListener("mouseleave", () => {
          if (hoverTimer) clearTimeout(hoverTimer);
        });
      });
    };

    // 1. Resume buttons (nav, hero, mobile sheet, contact section)
    attachHoverReaction(
      "#navResumeBtn, #heroResumeBtn, #sheetResumeBtn, #socialResumeBtn",
      "Looking for Sai's resume? 8.40 CGPA and ready for opportunities!",
      "love"
    );

    // 2. "See my work" button
    attachHoverReaction(
      "#heroWorkBtn",
      "Ooh, projects! Clip, Campus Circular, CapitalAI... click to see!",
      "excited"
    );

    // 3. GitHub links
    attachHoverReaction(
      "#heroGithubBtn, #contactGithubLink",
      "Sai's GitHub! Projects, open-source work, and clean code.",
      "happy"
    );

    // 4. LinkedIn link
    attachHoverReaction(
      "#contactLinkedinLink",
      "Sai on LinkedIn! Great place to connect or chat about internships.",
      "curious"
    );

    // 5. Copy email button & email link
    attachHoverReaction(
      "#copyBtn, #mailLink",
      "Drop Sai a line! (P.S. Make sure to mention cat treats)",
      "love"
    );

    // 6. Scribble name
    attachHoverReaction(
      "#scribble",
      "Click Sai's name to say hello!",
      "happy"
    );

    // 7. Chess board
    attachHoverReaction(
      "#chessBoard, #chessSection",
      "Spot the winning checkmate! Master Sai would be proud.",
      "curious"
    );

    // 8. Nav links: Mango looks up and perks his ears
    $$(".nav__links a").forEach((link) => {
      link.addEventListener("mouseenter", () => {
        if (!wrap.classList.contains("is-here") || performance.now() < dizzyUntil) return;
        if (asleep) wake();
        setMood("curious", 1200);
        head.style.setProperty("--tilt", "-7deg");
      });
      link.addEventListener("mouseleave", () => {
        head.style.setProperty("--tilt", "0deg");
      });
    });

    /* reaction to resume preview modal */
    const onResumeOpen = () => {
      triggerPurr();
      const r = catBtn.getBoundingClientRect();
      pawBurst(r.left + r.width * 0.5, r.top + r.height * 0.25);
      say("Sai's resume! Solid 8.40 CGPA, full-stack developer, and open to internships.", 4200, "love");
    };
    window.addEventListener("mango:resumeOpen", onResumeOpen);
    window.addEventListener("mango:resumeClose", () => {
      say("Ready to hire him or collaborate? Hit that email button!", 2800, "happy");
    });

    /* reaction to chess milestones */
    window.addEventListener("mango:chess", (e) => {
      const data = typeof e.detail === "string" ? { action: e.detail } : e.detail || {};
      if (data.action === "win" || data.action === "mate") {
        if (data.allSolved) {
          triggerPurr();
          const r = catBtn.getBoundingClientRect();
          pawBurst(r.left + r.width * 0.5, r.top + r.height * 0.25);
          say("All 5 daily puzzles solved! Master Sai would be proud. Come back tomorrow for 5 new puzzles!", 5000, "excited");
        } else {
          triggerPurr();
          const r = catBtn.getBoundingClientRect();
          pawBurst(r.left + r.width * 0.5, r.top + r.height * 0.25);
          say("Checkmate! Outstanding tactical vision! Spotting mates is like spotting tuna!", 3800, "excited");
        }
      } else if (data.action === "wrong") {
        say("Not quite mate! The defender can still wriggle away. Keep hunting!", 3000, "curious");
      } else if (data.action === "reset") {
        say("Board reset! Take your time and find that killer move.", 2600, "happy");
      } else if (data.action === "hint") {
        say("Psst! Even top players take a hint now and then. Look closely!", 2800, "curious");
      }
    });

    /* reaction to open source PR squares */
    const prsEl = $("#prs");
    if (prsEl) {
      prsEl.addEventListener("click", () => {
        say("Sugar Labs Music Blocks! Bug fixes, memory leak patches, and plugin hooks.", 3400, "happy");
      });
    }

    /* reaction to paw trail toggle */
    window.addEventListener("mango:pawToggle", (e) => {
      if (e.detail) {
        say("Footprints back on! Pitter-patter!", 2600, "happy");
      } else {
        say("No more footprints? Aww, I was tracking you!", 2600, "sad");
      }
    });

    /* type "meow" anywhere */
    let typed = "";
    document.addEventListener("keydown", (e) => {
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey) return;
      typed = (typed + e.key.toLowerCase()).slice(-4);
      if (typed === "meow") {
        typed = "";
        wake("oh, hi!");
        say("MEOW!", 2600, "excited");
        pawRain();
      }
    });

    /* he shows up once the greeting screen is gone */
    const appear = () => {
      if (document.body.classList.contains("is-loading")) { setTimeout(appear, 250); return; }
      setTimeout(() => {
        wrap.classList.add("is-here");
        setTimeout(() => introduceSection("hero", true), 800);
        armSleep();
      }, 700);
    };
    appear();

    /* expose for the confetti on other buttons */
    window.__pawBurst = pawBurst;
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
  /* the pinned projects section changes page height on load, which can make the browser jump back to the old position */
  const toTop = () => { if (document.body.classList.contains("is-loading")) window.scrollTo(0, 0); };
  window.addEventListener("load", () => { toTop(); setTimeout(toTop, 150); });
  window.addEventListener("pageshow", (e) => { if (e.persisted) window.scrollTo(0, 0); });

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
  const greetings = ["Hello", "नमस्कार", "Hola", "Meow"];
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
  const subEl = $("#loaderSub");
  const subs = ["Waking Mango up", "Stretching his paws", "Checking the treat jar", "Mango is awake =^.^="];
  greetings.forEach((word, i) => {
    const last = i === greetings.length - 1;
    greet.add(() => {
      wordEl.textContent = word;
      wordEl.classList.toggle("is-meow", last);
      if (subEl) {
        subEl.textContent = subs[i] || subs[subs.length - 1];
        subEl.classList.toggle("is-done", last);
      }
    });
    greet.fromTo(wordEl, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" });
    greet.to(wordEl, { opacity: last ? 1 : 0, duration: 0.15, delay: last ? 0.35 : 0.12 });
  });

  setTimeout(() => { if (!introDone) greet.progress(1); }, 5000);

  /* ----- rotating headline ----- */
  function startRotator() {
    const words = ["full-stack apps.", "AI tools.", "real-time apps.", "things people use."];
    const em = $("#rotator em");
    if (!em) return;
    let i = 0;
    let busy = false;
    const next = () => {
      if (busy) return;
      busy = true;
      i = (i + 1) % words.length;
      gsap.timeline({ onComplete: () => { busy = false; } })
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
        const work = $("#work");
        const inWork = work && self.scroll() >= work.offsetTop - 80 && self.scroll() < work.offsetTop + work.offsetHeight - window.innerHeight;
        const hide = (inWork || (self.direction === 1 && self.scroll() > 240)) && !document.body.classList.contains("menu-open");
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
      scrollTrigger: { trigger: "#aboutText", start: "top 82%", end: "bottom 55%", scrub: 0.8 },
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
      scrollTrigger: { trigger: "#timeline", start: "top 70%", end: "bottom 65%", scrub: 0.8 },
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
          end: () => "+=" + dist() * 1.8,
          pin: true,
          scrub: 1.2,
          anticipatePin: 1,
          fastScrollEnd: true,
          preventOverlaps: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            countEl.textContent = Math.min(total, Math.floor(self.progress * (total - 0.001)) + 1);
            bar.style.transform = `scaleX(${self.progress})`;
          },
        },
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
