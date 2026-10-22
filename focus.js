/* Focus outlines only for keyboard users. Pressing Tab adds .kb to <html>; any mouse or touch
   input removes it, so clicking or tapping never leaves an outline box on anything. */
(() => {
  "use strict";
  const root = document.documentElement;
  window.addEventListener("keydown", (e) => { if (e.key === "Tab") root.classList.add("kb"); }, true);
  window.addEventListener("pointerdown", () => root.classList.remove("kb"), true);
})();
