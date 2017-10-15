// some browsers don't support "once" yet.
export function once(element: Element, name: string, f: EventListener): Promise<void> {
  return new Promise((resolve, reject) => {
    const wrapper: EventListener = (event: Event) => {
      element.removeEventListener(name, wrapper);
      try {
        f(event);
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    element.addEventListener(name, wrapper);
  });
}

export const FRAME_MSEC = 1000 / 60;

// usage: await nextFrame();
export function nextFrame(): Promise<void> {
  return new Promise(resolve => waitUntil(Date.now() + FRAME_MSEC, resolve));
}

// requestAnimationFrame is unreliable. :( it often waits only a msec or two.
export function waitUntil(target: number, resolve: () => void) {
  const now = Date.now();
  if (now >= target) return resolve();
  setTimeout(() => waitUntil(target, resolve), target - now);
}
