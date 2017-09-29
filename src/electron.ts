import { once } from "./events";
import { Orientation } from "./tiles";

export class Electron {
  static baseElement: HTMLElement;

  static load() {
    Electron.baseElement = document.getElementById("tile-electron") as HTMLElement;
  }

  element: HTMLElement;
  orientation: Orientation = Orientation.EAST;

  constructor(public x: number, public y: number) {
    this.element = Electron.baseElement.cloneNode(true) as HTMLElement;
    this.element.removeAttribute("id");
    this.element.classList.add("tile", "tile-placed", "electron-pulsing");
  }

  draw(x: number, y: number): HTMLElement {
    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
    return this.element;
  }

  /*
   * chrome may take an entire frame to "recover" from the animation, so you
   * can't do any new transition until this promise resolves.
   */
  async setPulsing(pulsing: boolean): Promise<void> {
    if (pulsing) {
      this.element.classList.add("electron-pulsing");
    } else {
      await waitForAnimationToEnd(this.element);
      this.element.classList.remove("electron-pulsing");
      // looks like chrome (at least) requires two frames to recover from removing an animation.
      await nextFrame();
      await nextFrame();
    }
  }

  async pushTo(x: number, y: number, speed: number): Promise<void> {
    this.element.style.transition = `transform ${speed / 1000}s`;
    this.element.style.transform = `translate(${x}px, ${y}px)`;
    await once(this.element, "transitionend", (event: TransitionEvent) => {
      this.element.style.transition = null;
      this.element.style.transform = null;
    });
  }

  async vanish(speed: number): Promise<void> {
    this.element.style.transition = `transform ${speed / 1000}s`;
    this.element.style.transform = `scale(0)`;
    await once(this.element, "transitionend", (event: TransitionEvent) => {
      this.element.style.transition = null;
      this.element.style.transform = null;
    });
  }
}

function nextFrame(): Promise<void> {
  return new Promise((resolve, reject) => requestAnimationFrame(() => resolve()));
}

function waitForAnimationToEnd(element: HTMLElement): Promise<void> {
  return new Promise((resolve, reject) => {
    const f = () => {
      element.removeEventListener("animationiteration", f);
      resolve();
    };

    element.addEventListener("animationiteration", f);
  });
}
