import type { MotionEnv } from "../env";

export function mountReveal(section: HTMLElement, env: MotionEnv): () => void {
  if (env.reduced) return () => {};
  const rect = section.getBoundingClientRect();
  if (rect.top < window.innerHeight * 0.85) return () => {};
  section.dataset.reveal = "armed";
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      section.dataset.reveal = "in";
      io.disconnect();
    },
    { rootMargin: "0px 0px -30% 0px" },
  );
  io.observe(section);
  return () => {
    io.disconnect();
    delete section.dataset.reveal;
  };
}
