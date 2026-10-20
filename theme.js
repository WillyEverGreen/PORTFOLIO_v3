/* Light / dark switch, shared by the portfolio and the projects page.
   The new theme grows out of the toggle as a circle (View Transitions API),
   and a "themechange" event tells other scripts (Mango) once it has applied. */
(() => {
  "use strict";

  const root = document.documentElement;
  const btn = document.getElementById("themeBtn");
  if (!btn) return;

  const meta = document.querySelector('meta[name="theme-color"]');
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const sync = () => {
    const dark = root.getAttribute("data-theme") === "dark";
    btn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    if (meta) meta.setAttribute("content", dark ? "#151412" : "#f3ede2");
  };
  sync();

  btn.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    const apply = () => {
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) { /* storage can be blocked */ }
      sync();
      window.dispatchEvent(new CustomEvent("themechange", { detail: next }));
    };
    if (!document.startViewTransition || reduceMotion) return apply();

    const r = btn.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.add("theme-switching");
    const transition = document.startViewTransition(apply);
    transition.ready
      .then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 750, easing: "cubic-bezier(.65, 0, .25, 1)", pseudoElement: "::view-transition-new(root)" }
        );
      })
      .catch(() => {});
    transition.finished.finally(() => root.classList.remove("theme-switching"));
  });
})();
