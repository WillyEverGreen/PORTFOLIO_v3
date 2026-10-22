/* If a project screenshot fails to load (a stale cache, a renamed file, a flaky network),
   swap the broken image for a plain card with the project's name instead of the browser's
   broken-image icon. Loaded early on every page that shows screenshots. */
(() => {
  "use strict";

  const label = (img) => (img.dataset.title || img.alt || "").replace(/\s*screenshot$/i, "").trim();

  const fallBack = (img) => {
    const host = img.parentElement;
    if (!host || host.classList.contains("img-missing")) return;
    host.classList.add("img-missing");
    host.setAttribute("data-fallback", label(img) || "Preview unavailable");
    img.style.display = "none"; // the stylesheet sets display on images, which would beat the hidden attribute
  };

  /* image errors do not bubble, so listen in the capture phase */
  document.addEventListener("error", (e) => {
    if (e.target instanceof HTMLImageElement) fallBack(e.target);
  }, true);

  /* catch any image that already failed before this script ran */
  const sweep = () => document.querySelectorAll("img").forEach((img) => {
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) fallBack(img);
  });
  if (document.readyState === "complete") sweep();
  else window.addEventListener("load", sweep);
})();
