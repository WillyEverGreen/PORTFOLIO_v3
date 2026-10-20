/* All projects shown on projects.html. Order here is the order on the page.
   cats: ai | web | security | tools | games. code is null when there is no public repo.
   embed is false when the live site blocks being shown in an iframe (or is down), so the viewer falls back to the screenshot. */
window.PROJECTS = [
  {
    "id": "clip",
    "title": "Clip",
    "kicker": "Zero-knowledge pastebin and real-time collab pad",
    "desc": "Share text and files with expiring links. Everything is encrypted in your browser before it leaves, so the server never sees your data.",
    "stack": "React, TypeScript, Cloudflare Workers, Hono",
    "image": "img/clip.jpg",
    "cats": [
      "web",
      "tools",
      "security"
    ],
    "live": "https://clip.foo.ng/about",
    "code": "https://github.com/WillyEverGreen/clip",
    "points": [
      "Architecture. An ephemeral file and text sharing platform with a real-time collaborative Live Pad, synchronised over WebSockets.",
      "Security. Client-side zero-knowledge encryption using PBKDF2 and AES-256-GCM. Plaintext and keys never touch the server.",
      "Edge infrastructure. Backend handlers on Cloudflare Workers with Hono, custom TTLs, ZIP archiving and CLI or curl support."
    ]
  },
  {
    "id": "campus",
    "title": "Campus Circular",
    "kicker": "Peer-to-peer resource sharing for campuses",
    "desc": "Borrow what someone nearby already has. Escrow-secured deposits, a nine-stage borrowing lifecycle and AI bundles for what you need. 1st Runner Up at Thakur Web Fusion 2.0.",
    "stack": "Next.js, React, TypeScript, Tailwind CSS",
    "image": "img/campus-circular.jpg",
    "cats": [
      "web"
    ],
    "live": "https://webfusion20.vercel.app",
    "code": "https://github.com/SC136/Web_Fusion_2.0",
    "points": [
      "Product. A marketplace where students lend and borrow cameras, calculators, laptops and more from people on the same campus. 1st Runner Up at Thakur Web Fusion 2.0.",
      "Trust and payments. Refundable security deposits held in a simulated escrow vault, a mock payment gateway (UPI, card, NetBanking) and a wallet with a full ledger.",
      "Lifecycle. A nine-stage tracker from request to settlement, with itemised invoices, a carbon impact dashboard and AI that bundles the gear you need."
    ]
  },
  {
    "id": "capital",
    "title": "CapitalAI",
    "kicker": "Portfolio optimizer with autonomous risk safeguards",
    "desc": "Builds portfolios that minimise tail risk, then watches live market data and trips a three-tier circuit breaker when limits are breached.",
    "stack": "Next.js, FastAPI, Python, CVXPY",
    "image": "img/capital-ai.jpg",
    "cats": [
      "ai",
      "web"
    ],
    "live": "https://sentinelcap.vercel.app",
    "code": "https://github.com/TSROW-Studio/Capital-AI",
    "points": [
      "Optimisation. Mean-CVaR linear programming with CVXPY and Hierarchical Risk Parity to build portfolios that penalise tail losses and limit turnover.",
      "Safeguards. A three-tier circuit breaker (normal, amber, red, frozen) driven by live market feeds, with an append-only audit log of every intervention.",
      "Stack. A FastAPI quant engine in Python, and a Next.js dashboard with efficient frontier charts, a crisis stress-test simulator and an execution blotter."
    ]
  },
  {
    "id": "legal",
    "title": "LegalAI",
    "kicker": "AI legal research engine",
    "desc": "Ask a question about Indian criminal law and get an answer that names the exact IPC and BNS sections it relies on.",
    "stack": "React, Node.js, ChromaDB, Llama 3.1",
    "image": "img/legal-ai.jpg",
    "cats": [
      "ai"
    ],
    "live": "https://legal-ai-gateway-xlmv.onrender.com/",
    "code": "https://github.com/WillyEverGreen/LEGAL_AI",
    "points": [
      "Product. An AI research platform covering IPC and BNS statutes that gives citation-backed analysis and names the exact sections.",
      "RAG pipeline. Semantic retrieval across 850+ statutory sections using ChromaDB vector embeddings and Sentence Transformers.",
      "API gateway. Llama 3.1 70B and 8B models orchestrated through a Node.js gateway with tiered rate limiting and route optimisation."
    ],
    "embed": false
  },
  {
    "id": "loop",
    "title": "Loop",
    "kicker": "Autonomous SRE dashboard",
    "desc": "A dashboard that watches services, spots incidents early and suggests fixes. A demo of how an autonomous ops tool could work.",
    "stack": "TypeScript, React",
    "image": "img/loop.jpg",
    "cats": [
      "ai",
      "web"
    ],
    "live": "https://loopsre.vercel.app/",
    "code": "https://github.com/WillyEverGreen/Loop",
    "points": [
      "An overview of service health with CPU, memory, latency and error-rate charts.",
      "Incident timeline, deployments, audit log and remediation views in one place.",
      "Runs on demo data and is meant to show how an autonomous ops tool could look and feel."
    ]
  },
  {
    "id": "geoclash",
    "title": "GeoClash",
    "kicker": "Territory game for runners",
    "desc": "Run or walk a GPS loop and claim the streets inside it on a live shared map. Built with a friend.",
    "stack": "Next.js, React, GPS, Live map",
    "image": "img/geoclash.jpg",
    "cats": [
      "games",
      "web"
    ],
    "live": "https://geoclash.vercel.app/",
    "code": "https://github.com/SC136/GeoClash",
    "points": [
      "Run or walk a loop and the ground inside it becomes your territory on a shared live map.",
      "Your GPS trail is drawn as you move, and a closed loop is the only thing that counts.",
      "Earn XP, use shields to defend what you hold, and climb the rankings against rivals."
    ],
    "embed": false
  },
  {
    "id": "recode",
    "title": "ReCode",
    "kicker": "AI DSA companion",
    "desc": "A revision app that schedules spaced repetition for the topics you're weakest at, with hints that unlock one step at a time.",
    "stack": "React, TypeScript, Node.js, MongoDB, Redis",
    "image": "img/recode.jpg",
    "cats": [
      "ai",
      "web"
    ],
    "live": "https://recode.sbs/",
    "code": "https://github.com/WillyEverGreen/ReCode",
    "points": [
      "Platform. A full-stack DSA revision web app with automated spaced-repetition schedules that resurface weak topics.",
      "AI integration. A tiered hint generator that gives a hint, then the approach, then a full walkthrough, so you can solve at your own pace.",
      "Performance and auth. Frequent lookups are cached in Redis to cut latency. Auth uses JWT and OTP verification."
    ]
  },
  {
    "id": "space",
    "title": "SpaceScope",
    "kicker": "Satellite tracker and sky viewer",
    "desc": "Follow the ISS and satellites live, check space weather, or point your phone at the sky to see what's overhead.",
    "stack": "React, public space APIs",
    "image": "img/spacescope.jpg",
    "cats": [
      "web"
    ],
    "live": "https://space-scope-sb.vercel.app/",
    "code": "https://github.com/WillyEverGreen/Space_Scope",
    "points": [
      "Live ISS tracking, space weather and the NASA picture of the day.",
      "An AR mode that uses your phone's sensors to show what is in the sky above you.",
      "Built on public space APIs with a fast, mobile-friendly interface."
    ]
  },
  {
    "id": "journi",
    "title": "JourniAI",
    "kicker": "AI trip planner",
    "desc": "Say where you're going and for how long. It plans each day and gives you a rough budget.",
    "stack": "React, Firebase, LLMs",
    "image": "img/journi.jpg",
    "cats": [
      "ai",
      "web"
    ],
    "live": "https://journi-ai-ai-trip-planner-anzy.vercel.app",
    "code": "https://github.com/WillyEverGreen/JOURNI-AI",
    "points": [
      "Generates a personalised day-by-day itinerary with activities, restaurants and stays.",
      "Location search and place photos, plus a rough budget for the trip.",
      "Sign-in handled with Firebase."
    ]
  },
  {
    "id": "crypto",
    "title": "Cryptography Lab",
    "kicker": "Hands-on security course lab",
    "desc": "Run classic and modern ciphers, hashes and a man in the middle attack, all in the browser.",
    "stack": "JavaScript, Web Crypto API",
    "image": "img/crypto.jpg",
    "cats": [
      "security"
    ],
    "live": "https://virtual-cryptography-lab.vercel.app",
    "code": "https://github.com/WillyEverGreen/css-virtual-lab",
    "points": [
      "Interactive simulations of classic and modern ciphers, hashes and MACs.",
      "A live man in the middle scenario with a packet flow visualiser.",
      "Everything runs client-side using the browser's Web Crypto API, with no backend."
    ]
  },
  {
    "id": "headlock",
    "title": "HeadLock",
    "kicker": "Private headless browser API",
    "desc": "A hosted headless browser you call over HTTP. Send a URL and get back rendered HTML, element text, a screenshot, a PDF or the result of your own JavaScript.",
    "stack": "Express, Playwright, Docker",
    "image": "img/headlock.jpg",
    "cats": [
      "tools"
    ],
    "live": "https://willyevergreen-headlock.hf.space",
    "code": null,
    "points": [
      "Endpoints for rendered HTML, element text, base64 PNG screenshots, print-ready PDFs and custom JS evaluation.",
      "A public health endpoint reports uptime, active browser slots and queue length.",
      "Runs on Express, Playwright and Docker, hosted on Hugging Face Spaces."
    ]
  },
  {
    "id": "firewall",
    "title": "Firewall Simulator",
    "kicker": "Stateful packet filtering, visualised",
    "desc": "PacketGuard lets you craft requests from three clients, push them through a stateful firewall and watch every packet get allowed or blocked.",
    "stack": "Web app, networking",
    "image": "img/firewall.jpg",
    "cats": [
      "security",
      "web"
    ],
    "live": "https://cnmini-project.vercel.app",
    "code": null,
    "points": [
      "A live network topology with three clients and three servers behind a gateway router and firewall.",
      "A first-match rule engine you can edit and reorder, with a packet flow timeline and gateway console.",
      "One-click presets for HTTP, SSH, DNS and a rogue database connection to show attacks being stopped."
    ],
    "embed": false
  },
  {
    "id": "acon",
    "title": "acon",
    "kicker": "A crawler brain for scrapers",
    "desc": "A Python package that gives scrapers and crawlers a brain, published on PyPI as acon-intel.",
    "stack": "Python, PyPI",
    "image": "img/acon.jpg",
    "cats": [
      "tools"
    ],
    "live": "https://pypi.org/project/acon-intel",
    "code": null,
    "points": [
      "Install it with pip install acon-intel.",
      "Published on PyPI so any Python scraper can pull it in."
    ],
    "liveLabel": "PyPI",
    "embed": false
  }
];
