<p align="center">
  <img src="favicon.svg" alt="Sai Balkawade Logo" width="96" height="96" />
</p>

<h1 align="center">Sai Balkawade — Interactive Portfolio</h1>

<p align="center">
  <b>A tactile, high-performance personal portfolio built with zero framework overhead.</b><br />
  Featuring scroll-driven GSAP choreography, an interactive rigid-body physics toybox (Matter.js), procedural Web Audio SFX, and Mango the cat.
</p>

<p align="center">
  <a href="https://github.com/WillyEverGreen/PORTFOLIO_v3"><img src="https://img.shields.io/badge/Status-Production--Ready-brightgreen?style=for-the-badge&logo=git" alt="Status" /></a>
  <a href="https://vercel.com"><img src="https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel" alt="Vercel" /></a>
  <a href="https://greensock.com/gsap/"><img src="https://img.shields.io/badge/Animations-GSAP%203-88CE02?style=for-the-badge&logo=greensock" alt="GSAP" /></a>
  <a href="https://brm.io/matter-js/"><img src="https://img.shields.io/badge/Physics-Matter.js-222?style=for-the-badge" alt="Matter.js" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" /></a>
</p>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [✨ Key Highlights & Interactive Features](#-key-highlights--interactive-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📂 Project Organization](#-project-organization)
- [🚀 Quick Start (Local Development)](#-quick-start-local-development)
- [☁️ Vercel Deployment](#️-vercel-deployment)
- [🎯 Performance & Accessibility](#-performance--accessibility)
- [📬 Connect with Me](#-connect-with-me)

---

## 🌟 Overview

This portfolio is an artisanal, ultra-fast web experience designed to showcase full-stack engineering, open-source work, and creative frontend craftsmanship without relying on bulky frontend frameworks or build steps.

Every element is handcrafted using semantic HTML5, modern CSS3 with fluid design tokens, and lightweight JavaScript modularized by purpose.

---

## ✨ Key Highlights & Interactive Features

### 🐱 1. Mango the Companion Cat
- **10+ Expressive States**: Dynamically switches expressions (happy, curious, sleepy, surprised, annoyed, dizzy, in-love) based on user interaction.
- **Pupil Cursor Tracking**: Realistic trigonometry calculations compute eye angles to follow the user's cursor across the viewport.
- **Scroll Momentum & Idle Detection**: Mango gets dizzy when you scroll at high velocity, yawns and naps when idle, and purrs or gets grumpy if over-petted.
- **Secret Easter Egg**: Type `meow` anywhere on the page to trigger an animated feline surprise!

### 🎮 2. Rigid-Body Physics Toybox (Matter.js)
- Nested inside Mango’s bed nook on the `/projects` page.
- Real-time 2D rigid-body simulation with bouncing balls, swinging bell pendulums on elastic ropes, sliding mice, and fluttery feathers.
- Drag, throw, or tap toys to interact, with physical bounds and friction tuned to perfection.

### 🔊 3. Procedural Web Audio Engine (`sfx.js`)
- **Zero External Audio Files**: 100% of the sound effects (meows, purrs, bounces, bell rings, squeaks, thuds) are synthesized programmatically in real time using the native browser Web Audio API.
- **Global Control**: A dedicated audio toggle in the navigation bar with local persistence (`localStorage`).

### 🎞️ 4. Pinned Horizontal Work Showcase
- Powered by GSAP ScrollTrigger with pinning and smooth horizontal scrub.
- Project cards with live preview images, interactive tags, and custom modal dialogues (`<dialog>`) detailing architecture, security models, and tech stacks.

### 🗂️ 5. Dedicated Projects Directory (`/projects`)
- Filterable archive spanning **AI**, **Web**, **Security**, **Tools**, and **Games**.
- Instant layout switcher supporting **Index View** (compact tabular data) and **Gallery View** (rich visual cards).

### ♟️ 6. Playable Knight Puzzle
- Integrated mini-chess experience powered by `chessboard-element` and `chess.js` directly on the homepage.

### 🌓 7. View Transition Theme Ripple
- Seamless toggle between parchment light mode and obsidian dark mode utilizing the modern View Transitions API with circular ripple animations.

---

## 🛠️ Tech Stack

| Domain | Technology | Description |
|---|---|---|
| **Structure & Semantics** | Semantic HTML5 | Clean accessibility-first markup with `<dialog>` and `<template>` |
| **Styling & Themes** | Vanilla CSS3 | Custom properties, clamp-based fluid typography, View Transitions |
| **Animation Engine** | GSAP 3.12 + ScrollTrigger | Pinning, timeline triggers, parallax effects, and smooth reveals |
| **Physics Simulation** | Matter.js | 2D rigid-body dynamics for Mango's interactive toybox |
| **Sound Synthesis** | Web Audio API | Zero-asset procedural oscillator and noise synthesis |
| **Chess Engine** | Chess.js + Chessboard-Element | Interactive board state and knight puzzle validation |
| **Hosting & CI/CD** | Vercel | Clean URLs, edge caching, and security header integration |

---

## 📂 Project Organization

```
sai-dipak-portfolio/
├── 📄 index.html            # Main portfolio landing page (Hero, About, Work, Skills, Contact)
├── 📄 projects.html         # Projects archive page (Filterable catalog & toy nook)
├── 🎨 style.css             # Core design tokens, light/dark themes, and layout rules
├── 🎨 projects.css          # Archive page styles, gallery grids, and toy nook layout
├── ⚡ main.js               # GSAP animations, horizontal scroll gallery, and interactive cat
├── ⚡ projects.js           # Archive filtering, layout toggle, and detail modal logic
├── ⚡ projects-data.js      # Structured project dataset and category metadata
├── ⚡ toys.js               # Matter.js physics sandbox for Mango's toy box
├── ⚡ theme.js              # View Transition circular reveal theme switch
├── ⚡ sfx.js                # Procedural Web Audio API sound generator
├── ⚙️ vercel.json           # Vercel deployment config (clean URLs, caching, security headers)
├── 📦 package.json          # Development scripts and project metadata
├── 🔒 package-lock.json     # Dependency lockfile
├── 🛡️ .gitignore            # Git exclusion rules for node_modules, logs, and OS caches
├── 🖼️ favicon.svg           # High-resolution vector brand icon
├── 📁 assets/               # Static documents (Sai_Balkawade_Resume.pdf)
├── 📁 img/                  # High-resolution project screenshots and assets
├── 📁 lib/                  # Bundled chess libraries (chess.js, chessboard-element)
└── 📁 vendor/               # Local production vendor libraries (GSAP, ScrollTrigger, Matter.js)
```

---

## 🚀 Quick Start (Local Development)

Because there is zero build step required, you can launch the site instantly using any local HTTP server:

### Option 1: Node.js (Recommended)
```bash
npm run dev
# or
npx serve .
```

### Option 2: Python
```bash
python -m http.server 8765
```

Navigate to `http://localhost:3000` (or `http://localhost:8765`) in your web browser.

---

## ☁️ Vercel Deployment

This repository is pre-configured and optimized for Vercel out of the box:

### Automatic CI/CD (GitHub Integration)
1. Push this repository to GitHub:
   ```bash
   git remote set-url origin https://github.com/WillyEverGreen/PORTFOLIO_v3.git
   git branch -M main
   git push -u origin main
   ```
2. Import the repository in your [Vercel Dashboard](https://vercel.com/new).
3. Vercel will automatically detect the static configuration and deploy with zero manual setup.

### Command Line Deployment (Vercel CLI)
```bash
# Preview build
vercel

# Production deployment
vercel --prod
```

### Included Vercel Optimizations
- **Clean URLs**: Access `/projects` directly without appending `.html`.
- **Immutable Asset Caching**: `Cache-Control: public, max-age=31536000, immutable` applied to `/vendor/*`, `/lib/*`, `/img/*`, and `/assets/*`.
- **Hardened HTTP Security Headers**: Configured with `nosniff`, `SAMEORIGIN`, and modern referrer policies.

---

## 🎯 Performance & Accessibility

- ⚡ **Zero Framework Overhead**: Fast Time-To-Interactive (TTI) and low initial bundle footprint.
- ♿ **Accessible**: Proper ARIA landmarks, `role` attributes, `<dialog>` modals with focus trapping, and keyboard navigation.
- 🎛️ **Respects Motion Preferences**: Fully honours `prefers-reduced-motion` by reducing or disabling animations for users with vestibular sensitivities.
- 📱 **Fluid & Responsive**: Seamless scaling from mobile screens up to 4K ultra-wide monitors.

---

## 📬 Connect with Me

- **Portfolio**: [saibalkawade.vercel.app](https://sentinelcap.vercel.app)
- **GitHub**: [@WillyEverGreen](https://github.com/WillyEverGreen)
- **LinkedIn**: [Sai Balkawade](https://www.linkedin.com)
- **Email**: [sai@example.com](mailto:sai@example.com)

---

<p align="center">
  Crafted with precision, passion, and lots of pets for Mango 🐾
</p>
