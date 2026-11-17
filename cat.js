(() => {
  const wrap = document.getElementById("catWrap");
  const catBtn = document.getElementById("cat");
  const bubble = document.getElementById("catBubble");
  const pupils = document.querySelectorAll(".cat__pupil");
  const head = document.querySelector(".cat__head");
  let speakingUntil = 0;
  let bubbleTimer, sleepTimer, sleepyTimer, moodTimer, purrTimer, asleep = false, idleSleepy = false;

  const triggerPurr = () => {
    wrap.classList.remove("is-purr");
    void wrap.offsetWidth;
    wrap.classList.add("is-purr");
    clearTimeout(purrTimer);
    purrTimer = setTimeout(() => wrap.classList.remove("is-purr"), 850);
  };

  const setMood = (mood, ms = 1800) => {
    if (asleep && mood !== "surprised") return;
    idleSleepy = false;
    wrap.dataset.mood = mood;
    clearTimeout(moodTimer);
    if (mood !== "neutral") moodTimer = setTimeout(() => { wrap.dataset.mood = "neutral"; }, ms);
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

  catBtn.addEventListener("mouseenter", () => { if (!asleep) setMood("happy", 1400); });

  const lines = [
    ["purrrrr... that's the good spot!", "love"],
    ["mrrp! Sai gives good scratches too.", "happy"],
    ["*headbutt* feed me some tuna?", "love"],
    ["*kneading biscuits on screen*", "excited"],
    ["meow! you're officially my favorite human.", "happy"],
    ["purrrrr... again, again!", "love"],
  ];
  let li = 0;
  catBtn.addEventListener("click", () => {
    asleep = false;
    wrap.classList.remove("is-asleep");
    armSleep();
    triggerPurr();
    const activeQuips = (window.MangoWardrobe && window.MangoWardrobe.getQuips()) || lines;
    const line = activeQuips[li % activeQuips.length];
    li++;
    say(line[0], 2800, line[1]);
  });

  armSleep();
})();
