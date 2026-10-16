# Sai Balkawade | Portfolio

Personal portfolio built with plain HTML, CSS and GSAP (ScrollTrigger). No framework and no build step.

## What's in it

- Greeting loader, hand-drawn underline, rotating headline and a spinning "open to internships" badge
- About, experience timeline and education, all taken from my resume
- Pinned horizontal project gallery with a details dialog for every project
- Skills, open source (20 merged Music Blocks PRs shown as squares that fill in), hackathon and chess results
- A small playable knight board, copy-email button with confetti, light and dark themes
- Responsive, keyboard friendly, and respects `prefers-reduced-motion`

## Run locally

```bash
python -m http.server 8765
```

Then open http://localhost:8765.

## Structure

- `index.html` markup and content (project details live in `<template>` tags)
- `style.css` styles, with light and dark themes
- `main.js` GSAP animations and interactions
- `vendor/` GSAP and ScrollTrigger 3.12.5, served locally
- `img/` project screenshots
- `assets/` resume PDF

## Deploying

It is a static site, so any static host works. On Vercel, run `vercel --prod` in this folder.
