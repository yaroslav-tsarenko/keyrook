import type { MotionEnv } from "../env";

export function mountPlates(root: Document, env: MotionEnv): () => void {
  if (env.reduced) return () => {};
  const fold = window.innerHeight;
  const plates = Array.from(root.querySelectorAll<HTMLElement>('[data-anim="plate"]')).filter((el) => el.getBoundingClientRect().top > fold);
  if (plates.length === 0) return () => {};
  for (const el of plates) el.dataset.plate = "armed";
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.plate = "in";
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.2 },
  );
  for (const el of plates) io.observe(el);
  return () => {
    io.disconnect();
    for (const el of plates) delete el.dataset.plate;
  };
}
