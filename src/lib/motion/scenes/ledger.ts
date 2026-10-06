import type { MotionEnv } from "../env";

export function mountLedger(section: HTMLElement, env: MotionEnv): () => void {
  const diagrams = Array.from(section.querySelectorAll<SVGSVGElement>("svg")).filter((svg) => svg.querySelector("animate, animateMotion, animateTransform, set"));
  if (diagrams.length === 0) return () => {};
  const still = (svg: SVGSVGElement) => {
    svg.pauseAnimations();
    const at = Number(svg.dataset.still ?? section.dataset.still);
    if (Number.isFinite(at)) svg.setCurrentTime(at);
  };
  if (env.reduced) {
    diagrams.forEach(still);
    return () => {};
  }
  diagrams.forEach((svg) => svg.pauseAnimations());
  const io = new IntersectionObserver((entries) => {
    const on = entries.some((e) => e.isIntersecting) && !document.hidden;
    for (const svg of diagrams) {
      if (on) svg.unpauseAnimations();
      else svg.pauseAnimations();
    }
  });
  io.observe(section);
  const onVisibility = () => {
    if (document.hidden) diagrams.forEach((svg) => svg.pauseAnimations());
  };
  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    io.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    diagrams.forEach((svg) => svg.unpauseAnimations());
  };
}
