// some browsers don't support "once" yet.

export function once(element: Element, name: string, f: EventListener) {
  const wrapper: EventListener = (event: Event) => {
    element.removeEventListener(name, wrapper);
    f(event);
  };
  element.addEventListener(name, wrapper);
}
