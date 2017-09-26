
export class Electron {
  static baseElement: HTMLElement;

  static load() {
    Electron.baseElement = document.getElementById("tile-electron") as HTMLElement;
  }

  element: HTMLElement;

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
    }
    await nextFrame();
  }

  pushTo(x: number, y: number, speed: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        const f = (event: TransitionEvent) => {
          this.element.removeEventListener("transitionend", f);
          this.element.style.transition = null;
          this.element.style.transform = null;
          resolve();
        };

        setTimeout(() => {
          this.element.style.transition = `transform ${speed / 1000}s`;
          this.element.style.transform = `translate(${x}px, ${y}px)`;
          console.log(`translate(${x}, ${y})`);
          console.log(this.element.style.transform);
        }, 16);
        this.element.addEventListener("transitionend", f);
      } catch (error) {
        console.log(error);
      }
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
