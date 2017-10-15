import { moveToPixel } from "./common/dom";
import { once, nextFrame } from "./common/events";
import { Orientation, ORIENTATION_NAME } from "./models";

export class Electron {
  static baseElement: HTMLElement;

  static load() {
    Electron.baseElement = document.getElementById("tile-electron") as HTMLElement;
  }

  element: HTMLElement;
  orientation: Orientation = Orientation.EAST;
  alive = true;

  constructor(public x: number, public y: number) {
    this.element = Electron.baseElement.cloneNode(true) as HTMLElement;
    this.element.removeAttribute("id");
    this.element.classList.add("tile", "tile-placed");
  }

  toString(): string {
    const alive = this.alive ? "alive" : "DEAD";
    return `Electron(${alive}, (${this.x}, ${this.y}), ${ORIENTATION_NAME[this.orientation]})`;
  }

  draw(x: number, y: number): HTMLElement {
    moveToPixel(this.element, x, y);
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
      await once(this.element, "animationiteration", () => null);
      this.element.classList.remove("electron-pulsing");
      await nextFrame();
    }
  }
}
