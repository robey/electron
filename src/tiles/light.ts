import { range } from "../common/arrays";
import { Action, ElectronAction, NEXT_CLOCKWISE, Orientation, Tile } from "../models";
import { TileResources } from "./resources";

const DEFAULT_POWER = 20;

export class Light implements Tile {
  static resources = new TileResources();

  power = 0;
  element: HTMLElement = Light.resources.getClone(this.power, this);
  x = 0;
  y = 0;
  activated = false;

  static async load(): Promise<void> {
    const cross = this.resources.byId("tile-wire-cross");
    const lightOn = this.resources.byId("tile-light-on");
    const lightOff = this.resources.byId("tile-light-off");
    this.resources.addImage(0, this.resources.stack(Promise.all([ cross, lightOff ])));
    await Promise.all(range(1, DEFAULT_POWER + 1).map(async i => {
      this.resources.addImage(i, this.resources.stack(Promise.all([ cross, lightOn ])));
    }));
  }

  rotate(variant?: number): Tile {
    return this;
  }

  get variant(): number {
    return this.power;
  }

  onElectron(orientation: Orientation): ElectronAction {
    this.activated = true;
    this.power = DEFAULT_POWER;
    return ElectronAction.die.withAction(this.morphImage());
  }

  onTick(): Action {
    if (this.power > 0) this.power--;
    if (this.power == 0) this.activated = false;
    return this.morphImage();
  }

  reset() {
    this.activated = false;
    this.power = 0;
    this.element = Light.resources.getClone(0, this);
  }

  morphImage(): Action {
    const oldImage = this.element;
    this.element = Light.resources.getClone(this.power, this);
    return Action.changeImage(oldImage, this.element);
  }
}
