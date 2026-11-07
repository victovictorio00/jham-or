"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** One shared observer; the HTML stays visible when JS or animations are unavailable. */
export function ScrollReveal() {
  const pathname = usePathname();
  useEffect(() => {
    const root = document.getElementById("contenido");
    if (!root || !window.IntersectionObserver || !Element.prototype.animate)
      return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const seen = new WeakSet<Element>();
    const active = new Set<Animation>();
    const selector =
      ".product-card, .category-card, .section-heading, .home-essence > div, .design-notes > div:first-child, .design-note-list article, .page-intro";
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const element = entry.target as HTMLElement;
          observer.unobserve(element);
          if (!element.isConnected || preference.matches) continue;
          const siblings = [...(element.parentElement?.children || [])];
          const order = Math.max(0, siblings.indexOf(element)) % 3;
          const animation = element.animate(
            [
              { opacity: 0, transform: "translate3d(0, 36px, 0) scale(.985)" },
              { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
            ],
            {
              duration: 850,
              delay: order * 85,
              easing: "cubic-bezier(.16,1,.3,1)",
              fill: "backwards",
            },
          );
          element.dataset.revealed = "true";
          active.add(animation);
          animation.finished
            .catch(() => {})
            .finally(() => active.delete(animation));
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -24px 0px" },
    );
    const discover = (container: Element) => {
      const candidates = [...container.querySelectorAll(selector)];
      if (container.matches(selector)) candidates.unshift(container);
      for (const element of candidates) {
        if (seen.has(element) || preference.matches) continue;
        seen.add(element);
        observer.observe(element);
      }
    };
    const reduce = () => {
      if (preference.matches) {
        observer.disconnect();
        active.forEach((animation) => animation.cancel());
      }
    };
    discover(root);
    const mutations = new MutationObserver((records) => {
      for (const record of records)
        for (const node of record.addedNodes) {
          if (node instanceof Element) discover(node);
        }
    });
    mutations.observe(root, { childList: true, subtree: true });
    preference.addEventListener("change", reduce);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      preference.removeEventListener("change", reduce);
      active.forEach((animation) => animation.cancel());
    };
  }, [pathname]);
  return null;
}
