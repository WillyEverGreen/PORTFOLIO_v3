/* ================================================================
   Mango the Cat – Festival Wardrobe Engine
   Applies custom festival dresses based on festival dates:
   - Standard occasions: Active from 5 days before to 5 days after
   - Longer occasions (Ganpati, Navratri, Diwali, Christmas season):
     extended to cover the full celebration period plus 5 days!
     * Ganpati (Ganeshotsav): 5 days before + 10 days of festival + 5 days after
     * Navratri: 5 days before + 9 nights of festival through Dussehra
     * Diwali: 5 days before Dhanteras through 5 days after Bhai Dooj
     * Christmas season: Dec 20 through Jan 5 (Christmas & New Year)
   - On all other days: Normal everyday Mango (no festival dress)
   - Interactive In-Page Wardrobe Picker (persisted via localStorage)
   - Dynamic URL override support: ?festival=<id> or ?date=YYYY-MM-DD
   ================================================================ */

(() => {
  // SVG Defs needed by festival outfits
  const SVG_DEFS = `
    <defs>
      <clipPath id="bodyClip"><path d="M38 232C38 160 66 126 100 126s62 34 62 106z"/></clipPath>
      <clipPath id="phetaClip"><path d="M54 60C42 40 60 8 100 8C140 8 158 40 146 60Q100 76 54 60Z"/></clipPath>
      <clipPath id="kufiClip"><path d="M59 62C53 40 72 29 100 29C128 29 147 40 141 62Q100 72 59 62Z"/></clipPath>
      <clipPath id="headClip"><circle cx="100" cy="90" r="46"/><path d="M64 76L54 20l42 26z"/><path d="M136 76l10-56-42 26z"/></clipPath>
      <clipPath id="eidClip"><path d="M56 68C48 40 68 24 100 24C132 24 152 40 144 68Q100 76 56 68Z"/></clipPath>
      <clipPath id="cheekClip"><rect x="0" y="0" width="14" height="12" rx="3"/></clipPath>
      <linearGradient id="gHoli" gradientUnits="userSpaceOnUse" x1="60" y1="0" x2="146" y2="0">
        <stop offset="0" stop-color="#ff4fa3"/>
        <stop offset=".25" stop-color="#9b5de5"/>
        <stop offset=".5" stop-color="#2ec4f1"/>
        <stop offset=".75" stop-color="#7ed957"/>
        <stop offset="1" stop-color="#ffd23f"/>
      </linearGradient>
    </defs>
  `;

  const ensureDefs = () => {
    if (!document.getElementById("cat-festival-defs")) {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.id = "cat-festival-defs";
      svg.setAttribute("width", "0");
      svg.setAttribute("height", "0");
      svg.style.position = "absolute";
      svg.style.width = "0";
      svg.style.height = "0";
      svg.style.overflow = "hidden";
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");
      svg.innerHTML = SVG_DEFS;
      document.body.insertBefore(svg, document.body.firstChild);
    }
  };

  /* Outfit math & drawing helpers */
  const q = (p0, c, p1, t) => {
    const u = 1 - t;
    return [
      u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0],
      u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]
    ];
  };

  const dots = (p0, c, p1, n, fn) =>
    Array.from({ length: n }, (_, i) => {
      const [x, y] = q(p0, c, p1, (i + 0.5) / n);
      return fn(x.toFixed(1), y.toFixed(1), i);
    }).join("");

  const GD = (x, y, c = "#f4b942", s = 1) =>
    `<path transform="translate(${x} ${y}) scale(${s})" d="M0-3.6L3.6 0L0 3.6L-3.6 0Z" fill="${c}"/>`;

  const CLIP = (s) => `<g clip-path="url(#bodyClip)">${s}</g>`;

  const band = (d, gold, main, w = 22, gw = 4) =>
    `<path d="${d}" fill="none" stroke="${gold}" stroke-width="${w + gw}"/><path d="${d}" fill="none" stroke="${main}" stroke-width="${w}"/>`;

  const SHADE = 'stroke="rgba(0,0,0,.2)" stroke-width="1" stroke-linejoin="round"';

  const TILAK =
    `<path d="M93.5 57V65Q93.5 72 100 72Q106.5 72 106.5 65V57" fill="none" stroke="#fff1cf" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M100 58V71" fill="none" stroke="#d81f3a" stroke-width="3.4" stroke-linecap="round"/>`;

  const EID_CAP = "M56 68C48 40 68 24 100 24C132 24 152 40 144 68Q100 76 56 68Z";
  const CAP_EDGE = "M59 62C53 40 72 29 100 29C128 29 147 40 141 62Q100 72 59 62Z";

  const rng = (a) => () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const blob = (cx, cy, r, seed, n = 9, stretch = 1) => {
    const R = rng(seed);
    const rot = R() * 6.28;
    const pts = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + (R() - 0.5) * 0.5;
      const rr = r * (0.55 + R() * 0.8) * (R() < 0.22 ? 1.5 : 1);
      const x = Math.cos(a) * rr * stretch, y = Math.sin(a) * rr / stretch;
      return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)];
    });
    const f = (v) => v.toFixed(1);
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let d = "M" + mid(pts[n - 1], pts[0]).map(f).join(" ");
    for (let i = 0; i < n; i++) {
      const m = mid(pts[i], pts[(i + 1) % n]);
      d += "Q" + pts[i].map(f).join(" ") + " " + m.map(f).join(" ");
    }
    return d + "Z";
  };

  const splat = (cx, cy, r, color, seed, op = 0.9) => {
    const R = rng(seed * 7 + 3);
    let out = `<path d="${blob(cx, cy, r, seed, 9, 1 + R() * 0.35)}" fill="${color}" opacity="${op}"/>`;
    const k = 3 + Math.floor(R() * 3);
    for (let i = 0; i < k; i++) {
      const a = R() * 6.28, dist = r * (1.3 + R() * 0.9);
      out += `<path d="${blob(cx + Math.cos(a) * dist, cy + Math.sin(a) * dist, r * (0.13 + R() * 0.2), seed + i * 11 + 1, 6)}" fill="${color}" opacity="${op}"/>`;
    }
    return out;
  };

  const TILAK_LOW = `<g transform="translate(100 77) scale(.8) translate(-100 -64.5)">${TILAK}</g>`;

  const scarf = (fill, deco = "") =>
    `<path d="M66 126Q100 156 134 126L140 138Q100 170 60 138Z" fill="${fill}" ${SHADE}/>` +
    `<path d="M112 150L136 144L144 192Q133 200 122 195Z" fill="${fill}" ${SHADE}/>` + deco;

  const kurta = (fill, trim) =>
    `<path d="M76 132Q100 146 124 132L134 150L150 232H50L66 150Z" fill="${fill}" ${SHADE}/>` +
    `<path d="M76 133Q100 148 124 133L125 143Q100 158 75 143Z" fill="${fill}" stroke="${trim}" stroke-width="1.6"/>` +
    `<path d="M100 150V232" stroke="${trim}" stroke-width="2.4"/>` +
    [166, 184, 202].map((y) => `<circle cx="100" cy="${y}" r="2.6" fill="${trim}"/>`).join("") +
    [172, 190, 208].map((y) => GD(92, y, trim, 0.8) + GD(108, y, trim, 0.8)).join("") +
    `<path d="M72 170Q76 200 68 228M128 170Q124 200 132 228" fill="none" stroke="rgba(0,0,0,.08)" stroke-width="2"/>` +
    `<path d="M49 224Q100 234 151 224" fill="none" stroke="${trim}" stroke-width="2"/>`;

  const raisedFlag = () => {
    const px = 22, top = 27, w = 46, h = 30, n = 14, amp = 3.2;
    const X = (u) => px - w * u;
    const Y = (u, v) => top + h * v + Math.sin(u * 6.8) * amp * u;
    const pt = (u, v) => X(u).toFixed(1) + " " + Y(u, v).toFixed(1);
    const edge = (v) => Array.from({ length: n + 1 }, (_, i) => pt(i / n, v));
    const stripe = (v0, v1, c) =>
      `<path d="M${edge(v0).join("L")}L${edge(v1).reverse().join("L")}Z" fill="${c}" stroke="${c}" stroke-width=".5"/>`;
    const cx = X(0.5), cy = Y(0.5, 0.5), r = 4;
    const spokes = Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return `M${cx.toFixed(1)} ${cy.toFixed(1)}L${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`;
    }).join("");
    return (
      `<path d="M60 164Q22 164 22 114" fill="none" stroke="#f08a24" stroke-width="21" stroke-linecap="round"/>` +
      `<path d="M13 146q8 3 17 0M13 133q8 3 17 0" fill="none" stroke="#c9631a" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M22 112V25" stroke="#7a4a1f" stroke-width="3.6" stroke-linecap="round"/>` +
      `<path d="M21.2 110V27" stroke="#c48a4a" stroke-width="1" stroke-linecap="round"/>` +
      `<circle cx="22" cy="23" r="3.4" fill="#f4b942" stroke="#b8801a" stroke-width=".8"/>` +
      stripe(0, 1 / 3, "#ff9933") + stripe(1 / 3, 2 / 3, "#ffffff") + stripe(2 / 3, 1, "#138808") +
      `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="none" stroke="#1b3a8c" stroke-width=".9"/>` +
      `<path d="${spokes}" stroke="#1b3a8c" stroke-width=".55"/>` +
      `<path d="M${edge(0).join("L")}L${edge(1).reverse().join("L")}Z" fill="none" stroke="rgba(0,0,0,.28)" stroke-width=".8" stroke-linejoin="round"/>` +
      `<circle cx="22" cy="106" r="11" fill="#fbe3c0"/>` +
      `<path d="M17.5 100v-3.5M22 99v-4.5M26.5 100v-3.5" stroke="#e5c9a3" stroke-width="1.6" stroke-linecap="round"/>`
    );
  };

  /* ================================================================
     Outfits Catalogue (12 festivals + normal)
     ================================================================ */
  const OUTFITS = {
    normal: {
      id: "normal",
      icon: "🐱",
      name: "Normal Mango",
      note: "Everyday look",
      hideEars: false,
      preDays: 0,
      postDays: 0,
      behind: "",
      body: "",
      head: "",
      tail: "",
      quips: [
        ["purrrrr... that's the good spot!", "love"],
        ["mrrp! Sai gives good scratches too.", "happy"],
        ["*headbutt* feed me some tuna?", "love"],
        ["*kneading biscuits on screen*", "excited"],
        ["meow! you're officially my favorite human.", "happy"],
        ["purrrrr... again, again!", "love"]
      ],
      nookQuips: [
        ["purrrr... that's the spot.", "love"],
        ["mrrp! Five more minutes.", "happy"],
        ["*kneads the blanket*", "excited"],
        ["feed me, then pick a project.", "love"]
      ]
    },

    diwali: {
      id: "diwali",
      icon: "🪔",
      name: "Diwali",
      note: "Maroon & gold shawl, tilak",
      hideEars: false,
      preDays: 7,
      postDays: 7,
      behind: "",
      body:
        CLIP(
          `<path d="M30 118H170V174Q135 190 100 178Q65 190 30 174Z" fill="#9b1b30"/>` +
          `<path d="M30 167Q65 183 100 171Q135 183 170 167" fill="none" stroke="#f4b942" stroke-width="1.5"/>` +
          `<path d="M30 174Q65 190 100 178Q135 190 170 174" fill="none" stroke="#f4b942" stroke-width="5"/>` +
          `<path d="M30 174Q65 190 100 178Q135 190 170 174" fill="none" stroke="#9b1b30" stroke-width="1.6" stroke-dasharray="2 4"/>` +
          band("M40 123L170 225", "#f4b942", "#b3203a", 16, 6) +
          GD(84, 157) + GD(108, 176) + GD(132, 195) + GD(66, 162) + GD(134, 162)
        ) +
        `<path d="M72 140Q100 164 128 140" fill="none" stroke="#ffd36b" stroke-width="2.2" stroke-linecap="round"/>` +
        `<circle cx="100" cy="154.5" r="3.8" fill="#e0455a" stroke="#ffd36b" stroke-width="1.4"/>`,
      head: TILAK,
      tail: "",
      quips: [
        ["Happy Diwali! ✨ Wishing you joy, warmth & prosperity!", "happy"],
        ["Purrrrr! Don't I look dapper in my maroon & gold shawl?", "love"],
        ["*staying cozy inside* Pet me while the fireworks sparkle!", "happy"],
        ["Shubh Deepavali! May your life be filled with sweet treats!", "excited"]
      ],
      nookQuips: [
        ["Happy Diwali! ✨ Even from my cozy bed, I'm wearing my finest shawl!", "happy"],
        ["Purrrrr... warm blankets and Diwali sweets! Feed me a ladoo?", "love"],
        ["Shubh Deepavali! The sparklers look so pretty from my reading corner!", "excited"],
        ["*curls up in maroon & gold* Five more minutes of festive dreaming...", "happy"]
      ]
    },

    holi: {
      id: "holi",
      icon: "🎨",
      name: "Holi",
      note: "Rainbow scarf, colour-splashed",
      hideEars: false,
      preDays: 5,
      postDays: 5,
      behind: "",
      body:
        CLIP(
          splat(66, 188, 13, "#ff4fa3", 11) +
          splat(152, 178, 8, "#2ec4f1", 22) +
          splat(110, 220, 9, "#7ed957", 33) +
          splat(134, 212, 7, "#ffd23f", 44) +
          splat(50, 156, 7, "#9b5de5", 55) +
          splat(90, 166, 5, "#ff8c1a", 66) +
          splat(76, 222, 5, "#2ec4f1", 77) +
          splat(124, 194, 4.5, "#ff4fa3", 88)
        ) + scarf("url(#gHoli)"),
      head:
        `<g clip-path="url(#headClip)">` +
        splat(66, 66, 9, "#ff4fa3", 101) +
        splat(136, 66, 8, "#2ec4f1", 102) +
        splat(104, 52, 6, "#7ed957", 103) +
        splat(120, 58, 5.5, "#ffd23f", 104) +
        splat(72, 54, 5, "#9b5de5", 105) +
        splat(138, 100, 5.5, "#ff8c1a", 106) +
        splat(62, 96, 4.5, "#2ec4f1", 107) +
        `</g>`,
      tail: "",
      quips: [
        ["Happy Holi! 🎨 Look at all the colours on my fur!", "excited"],
        ["Bura na mano, Holi hai! Gulal splashes everywhere!", "happy"],
        ["*shakes rainbow dust off tail* Purrrrr!", "love"],
        ["Celebrating vibrancy, joy and full-stack creativity!", "happy"]
      ],
      nookQuips: [
        ["Happy Holi! 🎨 Don't splash any wet gulal on my cat bed!", "excited"],
        ["Look at my rainbow scarf, even while having a cozy nap!", "happy"],
        ["*kneads the blanket with colourful paws* Purrrrr!", "love"],
        ["Dreaming of bright spring colours and sweet festive treats!", "happy"]
      ]
    },

    ganesh: {
      id: "ganesh",
      icon: "🐘",
      name: "Ganesh Chaturthi",
      note: "White & gold angavastram, tilak",
      hideEars: false,
      preDays: 5,
      postDays: 15,
      behind: "",
      body: CLIP(
        band("M46 122L166 222", "#d9a233", "#fdfbf3", 26, 6) +
        `<path d="M46 122L166 222" fill="none" stroke="#e8c777" stroke-width="1.3" stroke-dasharray="3 3" transform="translate(-5 6)"/>` +
        `<path d="M46 122L166 222" fill="none" stroke="#e8c777" stroke-width="1.3" stroke-dasharray="3 3" transform="translate(5 -6)"/>` +
        `<path d="M60 150Q74 160 70 176M96 178Q112 186 108 202" fill="none" stroke="rgba(0,0,0,.07)" stroke-width="3" stroke-linecap="round"/>`
      ),
      head: TILAK,
      tail: "",
      quips: [
        ["Ganpati Bappa Morya! 🙏 Dressed in my festive angavastram!", "happy"],
        ["*sniffs around curiously for ukadiche modaks*", "curious"],
        ["May Lord Ganesha bless your projects and remove all bugs!", "excited"],
        ["Purrrrr... Ganeshotsav is the sweetest time of year!", "love"]
      ],
      nookQuips: [
        ["Ganpati Bappa Morya! 🙏 Modak delivery directly to my bed, please?", "love"],
        ["Dressed in my white & gold angavastram for Bappa's stay!", "happy"],
        ["*purring happily to the sound of dhol-tasha outside*", "excited"],
        ["May Bappa bring grand success to all these projects!", "happy"]
      ]
    },

    navratri: {
      id: "navratri",
      icon: "🪘",
      name: "Navratri",
      note: "Garba cap & mirror-work vest",
      hideEars: true,
      preDays: 5,
      postDays: 14,
      behind: "",
      body: CLIP(
        `<path d="M30 126H93L86 232H30Z" fill="#2a4fb0"/>` +
        `<path d="M30 150H91.4L90.3 166H30Z" fill="#d63a6e"/><path d="M30 182H89.4L88.7 190H30Z" fill="#f4b942"/><path d="M30 206H87.6L86.6 222H30Z" fill="#2fa58a"/>` +
        `<path d="M170 126H107L114 232H170Z" fill="#b3203a"/>` +
        `<path d="M108.6 150H170V166H109.7Z" fill="#f4b942"/><path d="M110.6 182H170V190H111.2Z" fill="#2fa58a"/><path d="M112.3 206H170V222H113.3Z" fill="#2a4fb0"/>` +
        [[60, 158], [75, 174], [55, 194], [70, 214], [140, 158], [125, 174], [145, 194], [130, 214]]
          .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#fff" stroke="#f4b942" stroke-width=".9"/>`).join("") +
        `<path d="M93 126L86 232M107 126L114 232" fill="none" stroke="#f4b942" stroke-width="3"/>`
      ),
      head:
        `<path d="M143 56Q161 70 157 96M57 56Q39 70 43 96" fill="none" stroke="#f4b942" stroke-width="2.2" stroke-linecap="round"/>` +
        `<path d="M154 96h6l1 11h-8zM40 96h6l1 11h-8z" fill="#d63a6e"/>` +
        `<circle cx="157" cy="96" r="2.4" fill="#f4b942"/><circle cx="43" cy="96" r="2.4" fill="#f4b942"/>` +
        `<path d="${CAP_EDGE}" fill="#d63a6e"/>` +
        `<g clip-path="url(#kufiClip)"><path d="M50 66Q100 76 150 66L150 53Q100 63 50 53Z" fill="#f4b942"/></g>` +
        dots([62, 57.5], [100, 67.5], [138, 57.5], 6, (x, y) => `<circle cx="${x}" cy="${y}" r="2.3" fill="#fff" stroke="#b8801a" stroke-width=".8"/>`) +
        dots([72, 44], [100, 36], [128, 44], 5, (x, y) => GD(x, y, "#f4b942", 0.7)) +
        `<path d="${CAP_EDGE}" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1" stroke-linejoin="round"/>` +
        `<circle cx="100" cy="28" r="5" fill="#f4b942"/>` + TILAK_LOW,
      tail: "",
      quips: [
        ["Happy Navratri! 🪘 Ready for dandiya & garba all night!", "excited"],
        ["Look at the mirror work on my garba vest! Sparkling!", "happy"],
        ["*dancing small cat steps with paws*", "love"],
        ["Chalo garba ramva! Pet me to the rhythm!", "happy"]
      ],
      nookQuips: [
        ["Happy Navratri! 🪘 My vest mirrors reflect the cozy lamp light!", "happy"],
        ["Napping during the day so I can stay up for garba tonight!", "excited"],
        ["*tapping paws to the dandiya beat under the blanket*", "love"],
        ["Nine nights of festive energy! Pet me for good luck!", "happy"]
      ]
    },

    sankranti: {
      id: "sankranti",
      icon: "🪁",
      name: "Makar Sankranti",
      note: "Cool shades & blue muffler",
      hideEars: false,
      preDays: 5,
      postDays: 5,
      behind: "",
      body: scarf(
        "#2a63c6",
        dots([63, 132], [100, 163], [137, 132], 6, (x, y) => `<circle cx="${x}" cy="${y}" r="1.7" fill="#fff"/>`) +
        `<circle cx="125" cy="160" r="1.7" fill="#fff"/><circle cx="132" cy="172" r="1.7" fill="#fff"/><circle cx="128" cy="184" r="1.7" fill="#fff"/>` +
        `<path d="M124 196l-1 6M129 198v6M134 196l1 6M139 193l2 6" stroke="#2a63c6" stroke-width="1.6" stroke-linecap="round"/>`
      ),
      head:
        `<path d="M54 84L69 86M146 84L131 86" stroke="#1c1b18" stroke-width="3" stroke-linecap="round"/>` +
        `<path d="M94 86Q100 81 106 86" fill="none" stroke="#1c1b18" stroke-width="3"/>` +
        `<rect x="66" y="76" width="28" height="22" rx="9" fill="#1c1b18"/><rect x="106" y="76" width="28" height="22" rx="9" fill="#1c1b18"/>` +
        `<path d="M70 83l8-3M110 83l8-3" stroke="#fff" stroke-opacity=".38" stroke-width="2.4" stroke-linecap="round"/>`,
      tail: "",
      quips: [
        ["Happy Makar Sankranti! 🪁 Tilgul ghya, god god bola!", "happy"],
        ["Cool shades on! Watching all the kites soar high in the sky!", "curious"],
        ["Kai po che! Mango is the most stylish cat on the terrace!", "excited"],
        ["Sweet jaggery sesame bites and warm winter sun! Purrrrr!", "love"]
      ],
      nookQuips: [
        ["Happy Makar Sankranti! 🪁 Cool shades on, even in bed!", "happy"],
        ["Tilgul ghya, god god bola! Sweet treats for my nook!", "love"],
        ["Watching the colorful kites through the window while staying cozy!", "curious"],
        ["Kai po che! Warm muffler on, napping like a champ!", "excited"]
      ]
    },

    christmas: {
      id: "christmas",
      icon: "🎄",
      name: "Christmas",
      note: "Santa hat & snowflake scarf",
      hideEars: true,
      preDays: 5,
      postDays: 11,
      behind: "",
      body: scarf(
        "#c62833",
        dots([63, 132], [100, 163], [137, 132], 5, (x, y) =>
          `<path transform="translate(${x} ${y})" d="M-2.2 0H2.2M0-2.2V2.2M-1.5-1.5L1.5 1.5M-1.5 1.5L1.5-1.5" stroke="#fff" stroke-width=".9" stroke-linecap="round"/>`) +
        `<path transform="translate(129 166)" d="M-2.2 0H2.2M0-2.2V2.2M-1.5-1.5L1.5 1.5M-1.5 1.5L1.5-1.5" stroke="#fff" stroke-width=".9" stroke-linecap="round"/>` +
        `<path transform="translate(134 182)" d="M-2.2 0H2.2M0-2.2V2.2M-1.5-1.5L1.5 1.5M-1.5 1.5L1.5-1.5" stroke="#fff" stroke-width=".9" stroke-linecap="round"/>` +
        `<path d="M124 196l-1 6M129 198v6M134 196l1 6M139 193l2 6" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`
      ),
      head:
        `<path d="M54 66C52 42 74 16 110 3C136 -4 156 18 158 46C150 32 138 28 128 32C138 42 146 54 146 66Z" fill="#d62839" ${SHADE}/>` +
        `<path d="M63 48C72 32 90 15 112 8" fill="none" stroke="rgba(255,255,255,.26)" stroke-width="3" stroke-linecap="round"/>` +
        `<path d="M131 36C139 44 144 54 145 63" fill="none" stroke="rgba(90,0,10,.28)" stroke-width="4" stroke-linecap="round"/>` +
        `<path d="M57 63Q100 76 143 63" fill="none" stroke="#d6d6e2" stroke-width="15" stroke-linecap="round"/>` +
        `<path d="M57 63Q100 76 143 63" fill="none" stroke="#ffffff" stroke-width="13" stroke-linecap="round"/>` +
        dots([62, 63], [100, 76], [138, 63], 7, (x, y) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#dedee9"/>`) +
        `<circle cx="160" cy="52" r="10" fill="#d6d6e2"/><circle cx="160" cy="52" r="8.8" fill="#fff"/>` +
        `<circle cx="157" cy="49" r="1.5" fill="#dedee9"/><circle cx="163" cy="55" r="1.5" fill="#dedee9"/>`,
      tail: "",
      quips: [
        ["Merry Christmas! 🎄 Santa Mango is here with cuddles!", "happy"],
        ["Ho ho ho! Did Santa leave any catnip or treats under the tree?", "love"],
        ["Snowflakes on my warm scarf! Wishing you cosy holidays!", "happy"],
        ["May your holidays be merry, bright and bug-free!", "excited"]
      ],
      nookQuips: [
        ["Merry Christmas! 🎄 Santa Mango is resting before deliveries!", "happy"],
        ["My snowflake scarf keeps me extra warm in my bed!", "love"],
        ["Ho ho ho! Did Santa leave a can of tuna in my stocking?", "excited"],
        ["Cozy holiday vibes in my reading bed... Purrrrr!", "happy"]
      ]
    },

    eid: {
      id: "eid",
      icon: "🌙",
      name: "Eid",
      note: "White kurta & embroidered cap",
      hideEars: true,
      preDays: 5,
      postDays: 5,
      behind: "",
      body: kurta("#f8f3e4", "#d8a63a"),
      head:
        `<path d="${EID_CAP}" fill="#ffffff"/>` +
        `<path d="M128 30C144 40 150 54 144 68Q138 69 132 68C136 56 134 42 128 30Z" fill="rgba(60,40,0,.055)"/>` +
        `<path d="M100 25V62M100 25Q92 44 84 61M100 25Q108 44 116 61M100 25Q82 38 70 58M100 25Q118 38 130 58" fill="none" stroke="#e6dcc4" stroke-width="1.3" stroke-linecap="round"/>` +
        dots([66, 50], [100, 42], [134, 50], 5, (x, y) => GD(x, y, "#d8a63a", 0.7)) +
        dots([80, 36], [100, 31], [120, 36], 3, (x, y) => GD(x, y, "#d8a63a", 0.6)) +
        `<g clip-path="url(#eidClip)"><path d="M40 58Q100 66 160 58L160 90L40 90Z" fill="#f6e7bb"/>` +
        `<path d="M40 58Q100 66 160 58" fill="none" stroke="#c9a24a" stroke-width="1.3"/></g>` +
        dots([58, 63], [100, 71], [142, 63], 9, (x, y) => GD(x, y, "#c9962a", 0.8)) +
        `<path d="${EID_CAP}" fill="none" stroke="#b9ae93" stroke-width="1.7" stroke-linejoin="round"/>`,
      tail: "",
      quips: [
        ["Eid Mubarak! 🌙 Wishing you peace, health and joy!", "happy"],
        ["All dressed up in my finest white embroidered kurta!", "love"],
        ["*smells delicious sheer khurma from the kitchen* Purrrr!", "curious"],
        ["May this blessed festival bring boundless happiness!", "happy"]
      ],
      nookQuips: [
        ["Eid Mubarak! 🌙 Embroidered cap on, feeling peaceful and festive!", "happy"],
        ["Waking up from my bed just for some sweet sheer khurma!", "love"],
        ["Wishing you and your loved ones peace and blessings!", "happy"],
        ["*soft purrs of gratitude and celebration*", "love"]
      ]
    },

    gudipadwa: {
      id: "gudipadwa",
      icon: "🚩",
      name: "Gudi Padwa",
      note: "Saffron pheta, kurta & dupatta",
      hideEars: true,
      preDays: 5,
      postDays: 5,
      behind: "",
      body: kurta("#fbf2dc", "#d8a63a") + CLIP(band("M136 122L44 226", "#f4b942", "#c8283b", 15, 6)),
      head:
        `<g clip-path="url(#phetaClip)"><rect x="30" y="0" width="140" height="82" fill="#c8341a"/>` +
        [[52, "#e2491f"], [40, "#c8341a"], [28, "#e2491f"], [16, "#c8341a"], [4, "#e2491f"]]
          .map(([y, c]) =>
            `<path d="M30 ${y}Q100 ${y + 14} 170 ${y - 6}" fill="none" stroke="${c}" stroke-width="13"/>` +
            `<path d="M30 ${y + 6.5}Q100 ${y + 20.5} 170 ${y + 0.5}" fill="none" stroke="#f4b942" stroke-width="1.7"/>`).join("") +
        `<path d="M134 12C154 28 160 46 150 60" fill="none" stroke="rgba(80,10,0,.22)" stroke-width="9"/></g>` +
        `<path d="M54 60C42 40 60 8 100 8C140 8 158 40 146 60" fill="none" stroke="#a82314" stroke-width="1.2" opacity=".55"/>` +
        `<path d="M54 60Q100 76 146 60" fill="none" stroke="#f4b942" stroke-width="7" stroke-linecap="round"/>` +
        `<path d="M54 60Q100 76 146 60" fill="none" stroke="#c9962a" stroke-width="1" stroke-dasharray="1.5 3"/>` +
        dots([56, 60], [100, 76], [144, 60], 7, (x, y) => GD(x, y, "#c8283b", 0.75)) +
        `<g transform="translate(120 26) rotate(20) scale(.85)">` +
        `<path d="M-6 8L-19 -30Q0 -44 19 -30L6 8Z" fill="#d63a1b" stroke="#f4b942" stroke-width="1.8" stroke-linejoin="round"/>` +
        [-0.8, -0.4, 0, 0.4, 0.8].map((t) => `<path d="M${t * 4} 6L${(t * 16).toFixed(1)} ${(-33 - (1 - Math.abs(t)) * 5).toFixed(1)}" stroke="#a82314" stroke-width="1.4" stroke-linecap="round"/>`).join("") +
        `<path d="M-19 -30Q0 -44 19 -30" fill="none" stroke="#f4b942" stroke-width="3" stroke-linecap="round"/>` +
        `<circle cx="0" cy="2" r="4.2" fill="#f4b942" stroke="#c9962a" stroke-width=".8"/><circle cx="0" cy="2" r="1.9" fill="#c8283b"/>` +
        `</g>` + TILAK_LOW,
      tail: "",
      quips: [
        ["Happy Gudi Padwa! 🚩 Auspicious beginnings for the new year!", "happy"],
        ["Look at my saffron pheta! Maharashtrian pride right here!", "excited"],
        ["Sweet shrikhand and hot puris today! Purrrrr!", "love"],
        ["Nutan Varshachya Hardik Shubhechha from Mango!", "happy"]
      ],
      nookQuips: [
        ["Happy Gudi Padwa! 🚩 Saffron pheta on, ready for the new year!", "happy"],
        ["Dreaming of shrikhand-puri feast from my cozy nook! Purrrrr!", "love"],
        ["New year, new goals, and lots of cozy naps in between!", "excited"],
        ["Nutan varshachya hardik shubhechha from Mango's reading bed!", "happy"]
      ]
    },

    raksha: {
      id: "raksha",
      icon: "🧵",
      name: "Raksha Bandhan",
      note: "Rakhi on the tail, tilak",
      hideEars: false,
      preDays: 5,
      postDays: 5,
      behind: "",
      body: "",
      head: TILAK,
      tail:
        `<g transform="translate(188 191) scale(1.3)">` +
        `<path d="M-13 3L13 -3" stroke="#d81f3a" stroke-width="5"/>` +
        `<path d="M-13 3L13 -3" stroke="#f4b942" stroke-width="1.4" stroke-dasharray="2 2"/>` +
        `<path d="M-3 8Q-4 14 -3 19M3 8Q4 14 3 19" fill="none" stroke="#f4b942" stroke-width="1.4"/>` +
        `<circle cx="-3" cy="19.5" r="1.8" fill="#d81f3a"/><circle cx="3" cy="19.5" r="1.8" fill="#d81f3a"/>` +
        `<circle r="8.5" fill="#d81f3a" stroke="#f4b942" stroke-width="2"/><circle r="4.6" fill="#f4b942"/><circle r="2.2" fill="#2a63c6"/>` +
        `</g>`,
      quips: [
        ["Happy Raksha Bandhan! 🧵 Look at the pretty rakhi on my tail!", "love"],
        ["A bond of pure love, protection and endless treats!", "happy"],
        ["I solemnly vow to protect all the keyboards and yarn!", "excited"],
        ["Purrrrr... Sai tied a tiny rakhi just for me!", "love"]
      ],
      nookQuips: [
        ["Happy Raksha Bandhan! 🧵 Look at the little rakhi on my tail!", "love"],
        ["I solemnly swear to protect this bed and all the project code!", "happy"],
        ["Purrrrr... the sweetest sibling bond in the house!", "love"],
        ["Petting me counts as a festival gift! More scratches please!", "excited"]
      ]
    },

    janmashtami: {
      id: "janmashtami",
      icon: "🦚",
      name: "Janmashtami",
      note: "Mor-pankh crown, pearls & flute",
      hideEars: false,
      preDays: 5,
      postDays: 5,
      behind: "",
      body:
        CLIP(
          band("M142 124L48 214", "#f4b942", "#2d4fb5", 20, 5) +
          `<path d="M38 190Q100 206 162 190V206Q100 222 38 206Z" fill="#f2b632"/>` +
          `<path d="M38 206Q100 222 162 206" fill="none" stroke="#c98a1a" stroke-width="1.6"/>`
        ) +
        dots([70, 138], [100, 178], [130, 138], 11, (x, y) => `<circle cx="${x}" cy="${y}" r="3.1" fill="#fffaf0" stroke="#cfc4b0" stroke-width=".7"/>`) +
        `<path d="M50 206L152 176" stroke="#b8792f" stroke-width="6" stroke-linecap="round"/>` +
        `<path d="M50 205L152 175" stroke="#e0a85c" stroke-width="1.6" stroke-linecap="round"/>` +
        [[112, 187.8], [120, 185.4], [128, 183.1], [136, 180.7]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.3" fill="#4a2a0e"/>`).join(""),
      head:
        `<path d="M84 46C60 40 56 14 68 4C84 14 92 32 84 46Z" fill="#1f8f7a"/>` +
        `<path d="M80 44Q70 26 68 10" fill="none" stroke="#8be0c0" stroke-width=".9"/>` +
        `<ellipse cx="72" cy="17" rx="5.2" ry="6.4" fill="#2b52b8" stroke="#f4b942" stroke-width="1"/><ellipse cx="72" cy="17" rx="2.3" ry="3.2" fill="#0e2a6b"/>` +
        `<path d="M64 54Q100 32 136 54L136 60Q100 38 64 60Z" fill="#f2b632" stroke="#b8801a" stroke-width=".8"/>` +
        `<circle cx="100" cy="46" r="3.2" fill="#d81f3a"/>` +
        dots([66, 57], [100, 35], [134, 57], 7, (x, y) => (Math.abs(x - 100) < 4 ? "" : `<circle cx="${x}" cy="${y}" r="1.4" fill="#fff6c8"/>`)) +
        TILAK,
      tail: "",
      quips: [
        ["Happy Krishna Janmashtami! 🦚 Peacock feather crown on!", "love"],
        ["Who stole the fresh white butter? Wasn't me! *licks whiskers*", "curious"],
        ["Govinda aala re! Little flute ready for sweet melodies!", "excited"],
        ["May your life overflow with love, laughter and sweetness!", "happy"]
      ],
      nookQuips: [
        ["Happy Janmashtami! 🦚 Little peacock crown & flute ready in bed!", "love"],
        ["Makhan chor? I'm just an innocent cat napping in a bed!", "curious"],
        ["Govinda aala re! Sweet flute dreams and fluffy blankets!", "happy"],
        ["Purrrrr... feeling peaceful and blessed this Janmashtami!", "love"]
      ]
    },

    dussehra: {
      id: "dussehra",
      icon: "🏹",
      name: "Dussehra",
      note: "Royal cape, gold mukut, arrows",
      hideEars: false,
      preDays: 5,
      postDays: 5,
      behind: [[36, 102, -30], [46, 98, -20], [28, 108, -38]]
        .map(([x, y, a]) =>
          `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 0V60" stroke="#8b5a2b" stroke-width="2.2"/>` +
          `<path d="M0 2L-3.4 11L0 13ZM0 2L3.4 11L0 13Z" fill="#d81f3a"/><path d="M0 8L-3.4 17L0 19ZM0 8L3.4 17L0 19Z" fill="#fff"/></g>`
        ).join(""),
      body:
        CLIP(
          `<path d="M30 118H170V176Q135 190 100 180Q65 190 30 176Z" fill="#a3182b"/>` +
          `<path d="M30 176Q65 190 100 180Q135 190 170 176" fill="none" stroke="#f2b632" stroke-width="4.5"/>` +
          dots([30, 176], [100, 202], [170, 176], 6, (x, y) => GD(x, (+y - 5).toFixed(1), "#f2b632", 0.7)) +
          `<path d="M58 132L148 216" stroke="#6b3a1d" stroke-width="7"/>` +
          dots([58, 132], [103, 174], [148, 216], 6, (x, y) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#f2b632"/>`) +
          `<path d="M40 202Q100 214 160 202V212Q100 224 40 212Z" fill="#6b3a1d"/><rect x="92" y="206" width="16" height="13" rx="3" fill="#f2b632" stroke="#9a6a14" stroke-width=".8"/>`
        ) +
        `<path d="M80 146Q100 156 120 146L116 182Q100 190 84 182Z" fill="#e2a634" stroke="#9a6a14" stroke-width="1"/>` +
        `<path d="M86 160Q100 168 114 160M87 172Q100 180 113 172" fill="none" stroke="#9a6a14" stroke-width=".9"/>` +
        `<circle cx="100" cy="162" r="4.2" fill="#d81f3a" stroke="#fff1b8" stroke-width="1"/>` +
        `<circle cx="66" cy="148" r="4" fill="#e2a634" stroke="#9a6a14" stroke-width=".9"/><circle cx="134" cy="148" r="4" fill="#e2a634" stroke="#9a6a14" stroke-width=".9"/>`,
      head:
        `<path d="M72 54L74 30L87 41L100 16L113 41L126 30L128 54Q100 46 72 54Z" fill="#f2b632" stroke="#a8741a" stroke-width=".9" stroke-linejoin="round"/>` +
        `<path d="M73 50Q100 42 127 50" fill="none" stroke="#c98a1a" stroke-width="1.4"/>` +
        `<circle cx="100" cy="36" r="3.4" fill="#d81f3a"/><circle cx="85" cy="46" r="2.1" fill="#2b52b8"/><circle cx="115" cy="46" r="2.1" fill="#2b52b8"/>` +
        TILAK,
      tail: "",
      quips: [
        ["Happy Dussehra! 🏹 Triumph of righteousness over evil!", "excited"],
        ["Royal cape and golden mukut ready! Looking majestic!", "happy"],
        ["May all obstacles and tricky bugs be defeated today!", "excited"],
        ["Sending you golden apta leaves and warm purrs!", "love"]
      ],
      nookQuips: [
        ["Happy Dussehra! 🏹 Royal cape and golden mukut in my reading nook!", "happy"],
        ["Defeating all difficult coding bugs with my golden arrows!", "excited"],
        ["Sending gold leaves and royal purrs straight from my bed!", "love"],
        ["May every project you build achieve grand victory!", "happy"]
      ]
    },

    independence: {
      id: "independence",
      icon: "🇮🇳",
      name: "Independence Day",
      note: "Waving tiranga & cheek paint",
      hideEars: false,
      preDays: 5,
      postDays: 5,
      behind: "",
      body: raisedFlag(),
      head:
        [57, 129].map((x) =>
          `<g transform="translate(${x} 95)" clip-path="url(#cheekClip)"><rect width="14" height="4" fill="#ff9933"/><rect y="4" width="14" height="4" fill="#fff"/><rect y="8" width="14" height="4" fill="#138808"/></g><rect x="${x}" y="95" width="14" height="12" rx="3" fill="none" stroke="#fff6e0" stroke-width="1.3"/>`).join(""),
      tail: "",
      quips: [
        ["Happy Independence Day! 🇮🇳 Waving our Tiranga with pride!", "excited"],
        ["Tricolour painted proudly on my cheeks! Jai Hind!", "happy"],
        ["Saluting freedom, resilience and progress today!", "love"],
        ["Proud Indian cat right here! Purrrrr!", "excited"]
      ],
      nookQuips: [
        ["Happy Independence Day! 🇮🇳 Holding the Tiranga high from my bed!", "excited"],
        ["Tricolour whiskers and patriotic purrs! Jai Hind!", "happy"],
        ["Saluting our nation and celebrating all our builders!", "love"],
        ["Purrrrr... freedom to code, create and dream!", "excited"]
      ]
    }
  };

  /* ================================================================
     Multi-year Festival Calendar (2024 to 2035)
     ================================================================ */
  const CALENDAR = {
    2024: {
      sankranti: "2024-01-14",
      holi: "2024-03-25",
      gudipadwa: "2024-04-09",
      eid: "2024-04-10",
      independence: "2024-08-15",
      raksha: "2024-08-19",
      janmashtami: "2024-08-26",
      ganesh: "2024-09-07",
      navratri: "2024-10-03",
      dussehra: "2024-10-12",
      diwali: "2024-11-01",
      christmas: "2024-12-25"
    },
    2025: {
      sankranti: "2025-01-14",
      holi: "2025-03-14",
      gudipadwa: "2025-03-30",
      eid: "2025-03-31",
      independence: "2025-08-15",
      raksha: "2025-08-09",
      janmashtami: "2025-08-16",
      ganesh: "2025-08-27",
      navratri: "2025-09-22",
      dussehra: "2025-10-02",
      diwali: "2025-10-20",
      christmas: "2025-12-25"
    },
    2026: {
      sankranti: "2026-01-14",
      holi: "2026-03-04",
      gudipadwa: "2026-03-19",
      eid: "2026-03-20",
      independence: "2026-08-15",
      raksha: "2026-08-28",
      janmashtami: "2026-09-04",
      ganesh: "2026-09-14",
      navratri: "2026-10-11",
      dussehra: "2026-10-21",
      diwali: "2026-11-08",
      christmas: "2026-12-25"
    },
    2027: {
      sankranti: "2027-01-14",
      holi: "2027-03-22",
      gudipadwa: "2027-04-07",
      eid: "2027-03-10",
      independence: "2027-08-15",
      raksha: "2027-08-17",
      janmashtami: "2027-08-25",
      ganesh: "2027-09-04",
      navratri: "2027-09-30",
      dussehra: "2027-10-10",
      diwali: "2027-10-29",
      christmas: "2027-12-25"
    },
    2028: {
      sankranti: "2028-01-14",
      holi: "2028-03-11",
      gudipadwa: "2028-03-27",
      eid: "2028-02-27",
      independence: "2028-08-15",
      raksha: "2028-08-05",
      janmashtami: "2028-08-13",
      ganesh: "2028-08-24",
      navratri: "2028-10-19",
      dussehra: "2028-10-29",
      diwali: "2028-10-17",
      christmas: "2028-12-25"
    },
    2029: {
      sankranti: "2029-01-14",
      holi: "2029-03-30",
      gudipadwa: "2029-04-14",
      eid: "2029-02-15",
      independence: "2029-08-15",
      raksha: "2029-08-24",
      janmashtami: "2029-09-01",
      ganesh: "2029-09-12",
      navratri: "2029-10-08",
      dussehra: "2029-10-18",
      diwali: "2029-11-05",
      christmas: "2029-12-25"
    },
    2030: {
      sankranti: "2030-01-14",
      holi: "2030-03-20",
      gudipadwa: "2030-04-04",
      eid: "2030-02-05",
      independence: "2030-08-15",
      raksha: "2030-08-13",
      janmashtami: "2030-08-21",
      ganesh: "2030-09-01",
      navratri: "2030-09-27",
      dussehra: "2030-10-07",
      diwali: "2030-10-26",
      christmas: "2030-12-25"
    },
    2031: {
      sankranti: "2031-01-14",
      holi: "2031-03-09",
      gudipadwa: "2031-03-24",
      eid: "2031-01-25",
      independence: "2031-08-15",
      raksha: "2031-08-02",
      janmashtami: "2031-08-10",
      ganesh: "2031-09-20",
      navratri: "2031-10-16",
      dussehra: "2031-10-26",
      diwali: "2031-11-14",
      christmas: "2031-12-25"
    },
    2032: {
      sankranti: "2032-01-14",
      holi: "2032-03-27",
      gudipadwa: "2032-04-11",
      eid: "2032-01-14",
      independence: "2032-08-15",
      raksha: "2032-08-21",
      janmashtami: "2032-08-28",
      ganesh: "2032-09-08",
      navratri: "2032-10-05",
      dussehra: "2032-10-14",
      diwali: "2032-11-02",
      christmas: "2032-12-25"
    },
    2033: {
      sankranti: "2033-01-14",
      holi: "2033-03-15",
      gudipadwa: "2033-03-31",
      eid: "2033-01-03",
      independence: "2033-08-15",
      raksha: "2033-08-10",
      janmashtami: "2033-08-18",
      ganesh: "2033-08-29",
      navratri: "2033-09-24",
      dussehra: "2033-10-03",
      diwali: "2033-10-23",
      christmas: "2033-12-25"
    },
    2034: {
      sankranti: "2034-01-14",
      holi: "2034-03-05",
      gudipadwa: "2034-03-20",
      eid: "2034-12-12",
      independence: "2034-08-15",
      raksha: "2034-08-29",
      janmashtami: "2034-09-06",
      ganesh: "2034-09-16",
      navratri: "2034-10-12",
      dussehra: "2034-10-22",
      diwali: "2034-11-10",
      christmas: "2034-12-25"
    },
    2035: {
      sankranti: "2035-01-14",
      holi: "2035-03-25",
      gudipadwa: "2035-04-09",
      eid: "2035-12-02",
      independence: "2035-08-15",
      raksha: "2035-08-18",
      janmashtami: "2035-08-26",
      ganesh: "2035-09-06",
      navratri: "2035-10-02",
      dussehra: "2035-10-11",
      diwali: "2035-10-31",
      christmas: "2035-12-25"
    }
  };

  const DEFAULT_DATE_SUFFIXES = {
    sankranti: "-01-14",
    holi: "-03-20",
    gudipadwa: "-04-05",
    eid: "-04-10",
    independence: "-08-15",
    raksha: "-08-18",
    janmashtami: "-08-25",
    ganesh: "-09-07",
    navratri: "-10-05",
    dussehra: "-10-15",
    diwali: "-11-01",
    christmas: "-12-25"
  };

  /* Helper to normalize a date to midnight local */
  const normalizeDate = (d) => {
    if (!d) return null;
    if (typeof d === "string") {
      const parts = d.split("-").map(Number);
      if (parts.length === 3) return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  /* Check whether a date is within the active festival window */
  const getActiveFestival = (targetDate = new Date()) => {
    const d = normalizeDate(targetDate) || normalizeDate(new Date());
    const year = d.getFullYear();

    const candidates = [];
    const checkYears = [year - 1, year, year + 1];

    checkYears.forEach((y) => {
      const yearEvents = CALENDAR[y] || {};
      Object.keys(OUTFITS).forEach((key) => {
        if (key === "normal") return;
        const outfit = OUTFITS[key];
        let dateStr = yearEvents[key];
        if (!dateStr && DEFAULT_DATE_SUFFIXES[key]) {
          dateStr = y + DEFAULT_DATE_SUFFIXES[key];
        }
        if (dateStr) {
          const festDate = normalizeDate(dateStr);
          const diffDays = Math.round((d.getTime() - festDate.getTime()) / 86400000);

          const pre = outfit.preDays !== undefined ? outfit.preDays : 5;
          const post = outfit.postDays !== undefined ? outfit.postDays : 5;

          if (diffDays >= -pre && diffDays <= post) {
            candidates.push({
              id: key,
              name: outfit.name,
              note: outfit.note,
              outfit: outfit,
              festivalDate: dateStr,
              diffDays,
              absDiff: Math.abs(diffDays),
              preDays: pre,
              postDays: post
            });
          }
        }
      });
    });

    if (candidates.length === 0) {
      return {
        id: "normal",
        name: OUTFITS.normal.name,
        note: OUTFITS.normal.note,
        outfit: OUTFITS.normal,
        festivalDate: null,
        diffDays: null,
        isActive: false
      };
    }

    candidates.sort((a, b) => a.absDiff - b.absDiff);
    const chosen = candidates[0];
    return {
      ...chosen,
      isActive: true
    };
  };

  /* Ensure the target SVG has the necessary outfit slot groups */
  const ensureSlots = (svg) => {
    if (!svg) return;

    // Tail slot
    const tail = svg.querySelector(".cat__tail");
    if (tail && !tail.querySelector(".slot-tail")) {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "slot-tail");
      tail.appendChild(g);
    }

    // Body slots
    const body = svg.querySelector(".cat__body");
    if (body) {
      if (!body.querySelector(".slot-behind")) {
        const gBehind = document.createElementNS("http://www.w3.org/2000/svg", "g");
        gBehind.setAttribute("class", "slot-behind");
        body.insertBefore(gBehind, body.firstChild);
      }
      if (!body.querySelector(".slot-body")) {
        const gBody = document.createElementNS("http://www.w3.org/2000/svg", "g");
        gBody.setAttribute("class", "slot-body");
        body.appendChild(gBody);
      }
    }

    // Head slot & inner ear class
    const head = svg.querySelector(".cat__head");
    if (head) {
      if (!head.querySelector(".slot-head")) {
        const gHead = document.createElementNS("http://www.w3.org/2000/svg", "g");
        gHead.setAttribute("class", "slot-head");
        head.appendChild(gHead);
      }

      const earPaths = head.querySelectorAll("path");
      earPaths.forEach((p) => {
        const d = p.getAttribute("d") || "";
        if (d.includes("M66 54l-3-21") || d.includes("M134 54l3-21")) {
          p.classList.add("earin");
        }
      });
    }
  };

  /* Apply an outfit onto a given SVG element */
  const applyOutfitToSvg = (svg, outfitInput) => {
    if (!svg) return;
    ensureDefs();
    ensureSlots(svg);

    const outfit = typeof outfitInput === "string" ? (OUTFITS[outfitInput.toLowerCase()] || OUTFITS.normal) : (outfitInput || OUTFITS.normal);

    const sTail = svg.querySelector(".slot-tail");
    const sBehind = svg.querySelector(".slot-behind");
    const sBody = svg.querySelector(".slot-body");
    const sHead = svg.querySelector(".slot-head");

    if (outfit.id === "normal") {
      svg.classList.remove("no-ears");
      svg.dataset.outfit = "normal";
      if (sTail) sTail.innerHTML = "";
      if (sBehind) sBehind.innerHTML = "";
      if (sBody) sBody.innerHTML = "";
      if (sHead) sHead.innerHTML = "";
      return;
    }

    if (outfit.hideEars) {
      svg.classList.add("no-ears");
    } else {
      svg.classList.remove("no-ears");
    }

    svg.dataset.outfit = outfit.id;
    if (sTail) sTail.innerHTML = outfit.tail || "";
    if (sBehind) sBehind.innerHTML = outfit.behind || "";
    if (sBody) sBody.innerHTML = outfit.body || "";
    if (sHead) sHead.innerHTML = outfit.head || "";
  };

  /* Global state and controllers */
  let currentDateOverride = null;
  let currentOutfitOverride = null;

  const loadStoredOutfit = () => {
    try {
      const stored = sessionStorage.getItem("mango_active_outfit") || localStorage.getItem("mango_active_outfit");
      if (stored) {
        if (stored === "auto") {
          currentOutfitOverride = null;
        } else if (OUTFITS[stored.toLowerCase()] || stored === "normal") {
          currentOutfitOverride = stored.toLowerCase();
        }
      }
    } catch (e) { }
  };

  // Cross-page and cross-tab synchronization
  try {
    window.addEventListener("storage", (e) => {
      if (e.key === "mango_active_outfit") {
        const val = e.newValue;
        if (!val || val === "auto") {
          currentOutfitOverride = null;
        } else if (OUTFITS[val.toLowerCase()] || val === "normal") {
          currentOutfitOverride = val.toLowerCase();
        }
        updateAllCats();
        updateStatusPill();
      }
    });
  } catch (e) { }

  const updateAllCats = () => {
    let active;
    if (currentOutfitOverride) {
      const o = OUTFITS[currentOutfitOverride.toLowerCase()] || OUTFITS.normal;
      active = {
        id: o.id,
        name: o.name,
        note: o.note,
        outfit: o,
        isActive: o.id !== "normal",
        diffDays: 0,
        festivalDate: null
      };
    } else {
      active = getActiveFestival(currentDateOverride || new Date());
    }

    const svgs = document.querySelectorAll(".cat__svg");
    svgs.forEach((svg) => {
      if (svg.dataset.fixedOutfit) return;
      applyOutfitToSvg(svg, active.outfit);
    });

    updateUIBadges(active);
    return active;
  };

  const updateUIBadges = (active) => {
    document.querySelectorAll(".wardrobe-card, .wardrobe-mode-btn").forEach((btn) => {
      const optId = btn.dataset.outfitId;
      if (currentOutfitOverride) {
        btn.classList.toggle("is-selected", optId === currentOutfitOverride);
      } else {
        btn.classList.toggle("is-selected", optId === "auto");
      }
    });
  };

  /* ================================================================
     In-Page Wardrobe UI Modal (Editorial Armoire Design)
     ================================================================ */
  const updateStatusPill = () => {
    const pill = document.getElementById("wardrobeStatusPill");
    if (!pill) return;
    const active = getActiveFestival(currentDateOverride || new Date());
    if (currentOutfitOverride) {
      const o = OUTFITS[currentOutfitOverride.toLowerCase()] || OUTFITS.normal;
      pill.innerHTML = `<span class="status-dot is-override"></span><span>Preview Mode: <strong>${o.name}</strong> &middot; Click &ldquo;Auto (Calendar)&rdquo; to follow dates</span>`;
    } else if (active.isActive) {
      pill.innerHTML = `<span class="status-dot"></span><span>Celebrating: <strong>${active.name}</strong> (${active.diffDays === 0 ? "Today!" : (active.diffDays > 0 ? "+" + active.diffDays + "d" : active.diffDays + "d")})</span>`;
    } else {
      pill.innerHTML = `<span class="status-dot"></span><span>Today: <strong>Natural Everyday Fur</strong> &middot; Active automatically on festival dates</span>`;
    }
  };

  const openModal = () => {
    let modal = document.getElementById("mangoWardrobeModal");
    if (!modal) {
      injectModal();
      modal = document.getElementById("mangoWardrobeModal");
    }
    if (modal) {
      modal.classList.add("is-open");
      updateStatusPill();
      updateAllCats();
    }
  };

  const closeModal = () => {
    const modal = document.getElementById("mangoWardrobeModal");
    if (modal) modal.classList.remove("is-open");
  };

  const selectOutfit = (outfitId) => {
    if (outfitId === "auto") {
      currentOutfitOverride = null;
      try {
        sessionStorage.removeItem("mango_active_outfit");
        localStorage.removeItem("mango_active_outfit");
      } catch (e) { }
    } else if (OUTFITS[outfitId]) {
      currentOutfitOverride = outfitId;
      try {
        sessionStorage.setItem("mango_active_outfit", outfitId);
        localStorage.setItem("mango_active_outfit", outfitId);
      } catch (e) { }
    }
    const active = updateAllCats();
    updateStatusPill();

    // Trigger cat purr & speech bubble
    try {
      const isNook = !!document.getElementById("nookCat");
      const quips = isNook ? window.MangoWardrobe.getNookQuips() : window.MangoWardrobe.getQuips();
      const firstLine = quips[0] || ["Purrrrr!", "love"];

      if (window.mangoNook && typeof window.mangoNook.say === "function") {
        window.mangoNook.say(firstLine[0], 3200, firstLine[1] || "happy", { force: true });
      } else {
        const bubble = document.getElementById("catBubble") || document.getElementById("nookBubble");
        const wrap = document.getElementById("catWrap") || document.getElementById("nookCat");
        if (bubble && wrap) {
          bubble.textContent = firstLine[0];
          bubble.classList.remove("is-on");
          void bubble.offsetWidth;
          bubble.classList.add("is-on");
          wrap.classList.add("is-up");
          wrap.classList.remove("is-asleep");
          setTimeout(() => {
            bubble.classList.remove("is-on");
            wrap.classList.remove("is-up");
          }, 3200);
        }
      }
    } catch (e) { }

    closeModal();
  };

  const injectModal = () => {
    if (document.getElementById("mangoWardrobeModal")) return;

    const modal = document.createElement("div");
    modal.id = "mangoWardrobeModal";
    modal.className = "wardrobe-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-label", "Mango's Festival Wardrobe");

    const keys = [
      "diwali", "holi", "ganesh", "navratri", "sankranti", "christmas",
      "eid", "gudipadwa", "raksha", "janmashtami", "dussehra", "independence"
    ];

    let cardsHtml = "";
    keys.forEach((k) => {
      const o = OUTFITS[k];
      const span = (o.postDays && o.postDays > 5) ? `${o.postDays} Days` : "±5 Days";
      cardsHtml += `
        <button class="wardrobe-card" type="button" data-outfit-id="${k}">
          <div class="wardrobe-card__swatch">${o.icon || "✨"}</div>
          <div class="wardrobe-card__info">
            <div class="wardrobe-card__head">
              <h4 class="wardrobe-card__name">${o.name}</h4>
              <span class="wardrobe-card__tag">${span}</span>
            </div>
            <p class="wardrobe-card__desc">${o.note}</p>
          </div>
        </button>
      `;
    });

    modal.innerHTML = `
      <div class="wardrobe-modal__card">
        <button class="wardrobe-modal__close" id="wardrobeCloseBtn" type="button" aria-label="Close wardrobe">
          <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
        <div class="wardrobe-modal__head">
          <span class="wardrobe-kicker">Secret Wardrobe · Mango's Atelier</span>
          <h3>Mango's <em>Festival Wardrobe</em></h3>
          <p>Costumes handcrafted for celebrations across India. Automatically active on festival dates (±5 days; Ganpati &amp; Navratri extended), and rests in everyday fur on normal days.</p>
          <div class="wardrobe-status-pill" id="wardrobeStatusPill">
            <span class="status-dot"></span>
            <span>Today: <strong>Natural Everyday Fur</strong> &middot; Follows festival dates automatically</span>
          </div>
        </div>
        <div class="wardrobe-modal__body">
          <div class="wardrobe-modes">
            <button class="wardrobe-mode-btn" type="button" data-outfit-id="auto">
              <span class="mode-icon">🗓️</span>
              <div>
                <strong>Auto (Calendar)</strong>
                <small>Festivals by date · Normal fur today</small>
              </div>
            </button>
            <button class="wardrobe-mode-btn" type="button" data-outfit-id="normal">
              <span class="mode-icon">🐱</span>
              <div>
                <strong>Normal Fur</strong>
                <small>Clean everyday soft fur</small>
              </div>
            </button>
          </div>

          <div class="wardrobe-section-label">
            <span>Celebration Collection (12 Outfits)</span>
            <span class="hint">Click any outfit to dress Mango</span>
          </div>

          <div class="wardrobe-opt-grid">
            ${cardsHtml}
          </div>
        </div>
        <div class="wardrobe-modal__foot">
          <span>Click any outfit to preview live on Mango</span>
          <a href="wardrobe.html" target="_blank" rel="noopener">Full 12-Card Showcase &rarr;</a>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector(".wardrobe-modal__close");
    if (closeBtn) {
      closeBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
      };
    }

    modal.addEventListener("click", (e) => {
      if (e.target === modal || (e.target.closest && e.target.closest(".wardrobe-modal__close"))) {
        closeModal();
        return;
      }
      const btn = e.target.closest(".wardrobe-card, .wardrobe-mode-btn");
      if (btn) selectOutfit(btn.dataset.outfitId);
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  };

  /* ================================================================
     Hidden Easter Egg: 5-click trigger on "that circle" (.badge)
     Removes all visible wardrobe buttons from navbar, cat, and bed!
     Keeps the circle completely stealth (default cursor, zero size change,
     silent on clicks 1-4, pops wardrobe on 5th click).
     Mango makes ZERO comments so the hidden easter egg stays hidden!
     ================================================================ */
  let badgeClicks = 0;
  let badgeTimer = null;
  let lastBadgeClick = 0;

  const triggerSecretWardrobe = () => {
    // Open the wardrobe modal directly with ZERO comments or bubbles on Mango
    openModal();
  };

  const handleBadgeClick = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const now = Date.now();
    // Guard against rapid double events within 200ms
    if (now - lastBadgeClick < 200) return;
    lastBadgeClick = now;

    badgeClicks++;
    clearTimeout(badgeTimer);
    badgeTimer = setTimeout(() => {
      badgeClicks = 0;
    }, 4000);

    // Clicks 1 through 4 are completely stealth:
    // No size change, no audio, no speech bubble counting.
    if (badgeClicks >= 5) {
      badgeClicks = 0;
      triggerSecretWardrobe();
    }
  };

  const setupSecretTriggers = () => {
    // 1. Clean up any leftover buttons or pills
    document.querySelectorAll(".nav__wardrobe, .cat__wardrobe-pill, .nook-wardrobe-pill").forEach((el) => el.remove());

    // 2. Secret trigger on the rotating circle badge (stealth cursor, exactly one click listener)
    const badge = document.querySelector(".badge");
    if (badge) {
      badge.style.cursor = "default";
      badge.onclick = handleBadgeClick;
    }

    // 3. Fallback easter egg: 5 clicks on Mango himself also unlocks wardrobe
    const cat = document.getElementById("cat") || document.getElementById("catWrap");
    if (cat) {
      let catClicks = 0, catTimer = null;
      cat.addEventListener("click", () => {
        catClicks++;
        clearTimeout(catTimer);
        catTimer = setTimeout(() => { catClicks = 0; }, 4000);
        if (catClicks >= 5) {
          catClicks = 0;
          triggerSecretWardrobe();
        }
      });
    }

    const nookCat = document.getElementById("nookCat") || document.getElementById("nookBtn");
    if (nookCat) {
      let nookClicks = 0, nookTimer = null;
      nookCat.addEventListener("click", () => {
        nookClicks++;
        clearTimeout(nookTimer);
        nookTimer = setTimeout(() => { nookClicks = 0; }, 4000);
        if (nookClicks >= 5) {
          nookClicks = 0;
          triggerSecretWardrobe();
        }
      });
    }

    // 4. Secret keyboard shortcut: press 'w' anywhere on the page
    window.addEventListener("keydown", (e) => {
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
      if (e.key === "w" || e.key === "W") {
        triggerSecretWardrobe();
      }
    });
  };

  /* Parse URL search parameters: ?festival=diwali or ?date=2026-11-08 or ?wardrobe=1 */
  const checkUrlParams = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has("festival")) {
        const f = params.get("festival").toLowerCase();
        if (OUTFITS[f] || f === "normal") {
          currentOutfitOverride = f;
          try {
            sessionStorage.setItem("mango_active_outfit", f);
            localStorage.setItem("mango_active_outfit", f);
          } catch (e) { }
        }
      }
      if (params.has("date")) {
        const d = params.get("date");
        if (d) currentDateOverride = d;
      }
      if (params.has("wardrobe")) {
        setTimeout(openModal, 400);
      }
    } catch (e) { }
  };

  const init = () => {
    ensureDefs();
    loadStoredOutfit();
    checkUrlParams();
    setupSecretTriggers();
    updateAllCats();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* Public API exposed on window */
  window.MangoWardrobe = {
    OUTFITS,
    CALENDAR,
    getActiveFestival,
    applyOutfit: applyOutfitToSvg,
    update: updateAllCats,
    openWardrobe: openModal,
    closeWardrobe: closeModal,
    setOutfit: (outfitId) => {
      selectOutfit(outfitId);
      return updateAllCats();
    },
    setDate: (d) => {
      currentDateOverride = d;
      currentOutfitOverride = null;
      return updateAllCats();
    },
    reset: () => {
      currentDateOverride = null;
      currentOutfitOverride = null;
      try {
        sessionStorage.removeItem("mango_active_outfit");
        localStorage.removeItem("mango_active_outfit");
        localStorage.removeItem("mango_user_outfit");
      } catch (e) { }
      updateStatusPill();
      return updateAllCats();
    },
    getCurrentOutfit: () => {
      if (currentOutfitOverride) return OUTFITS[currentOutfitOverride] || OUTFITS.normal;
      return getActiveFestival(currentDateOverride || new Date()).outfit;
    },
    getQuips: () => {
      const active = window.MangoWardrobe.getCurrentOutfit();
      return (active && active.quips) || OUTFITS.normal.quips;
    },
    getNookQuips: () => {
      const active = window.MangoWardrobe.getCurrentOutfit();
      return (active && active.nookQuips) || OUTFITS.normal.nookQuips;
    }
  };
})();
