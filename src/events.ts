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

// usage: await nextFrame();
export function nextFrame(): Promise<void> {
  return new Promise((resolve, reject) => requestAnimationFrame(() => resolve()));
}
