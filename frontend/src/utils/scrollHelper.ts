/**
 * Advanced smooth scrolling engine with cubic-bezier easing curve
 * and sticky topbar offset accommodation.
 */
export function autoScrollTo(target?: HTMLElement | string | null, offset: number = 85, duration: number = 550) {
  try {
    if (typeof window === 'undefined') return;

    let element: HTMLElement | null = null;
    if (!target) {
      element = document.documentElement;
    } else if (typeof target === 'string') {
      element = document.querySelector(target) as HTMLElement;
    } else if (target instanceof HTMLElement) {
      element = target;
    }

    const start = window.pageYOffset || document.documentElement.scrollTop;
    let targetY = 0;

    if (element && element !== document.documentElement) {
      const rect = element.getBoundingClientRect();
      targetY = rect.top + start - offset;
    }

    // Clamp within valid document scrolling bounds
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    targetY = Math.max(0, Math.min(targetY, maxScroll));

    const distance = targetY - start;
    if (Math.abs(distance) < 4) return;

    let startTime: number | null = null;

    // Cubic ease-in-out curve for liquid smooth 60fps scrolling
    function cubicEaseInOut(t: number): number {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function step(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = cubicEaseInOut(progress);

      window.scrollTo(0, start + distance * easedProgress);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    }

    window.requestAnimationFrame(step);
  } catch (err) {
    console.warn('Smooth autoScrollTo error:', err);
  }
}
