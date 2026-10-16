# Sai Balkawade | Portfolio

Personal portfolio built with plain HTML, CSS and GSAP (ScrollTrigger). No framework and no build step.

## What's in it

- Greeting loader, hand-drawn underline, rotating headline and a spinning "open to internships" badge
- About, experience timeline and education, all taken from my resume
- Pinned horizontal project gallery with a details dialog for every project
- Skills, open source (20 merged Music Blocks PRs shown as squares that fill in), hackathon and chess results
- Mango, an orange cat with ten expressions (happy, love, curious, sleepy, sad, annoyed, surprised, dizzy and more) that react to what you do: his eyes follow your cursor, he comments on each section, yawns and falls asleep when you go idle, gets grumpy if you pet him too much and dizzy if you scroll too fast
- A loader that greets you in a few languages and ends with a cat's "Meow"
- Paw prints that walk between sections, a paw trail behind the cursor (with an off switch in the footer), and a hidden surprise if you type "meow"
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
