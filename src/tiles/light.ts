import { Action, ElectronAction, NEXT_CLOCKWISE, Orientation, Tile } from "../models";
import { TileResources } from "./resources";

export class Light implements Tile {
  static resources = new TileResources();

  power = 0;
  element: HTMLElement = Light.resources.getClone(this.power, this);
  x = 0;
  y = 0;

  static async load(): Promise<void> {
    const cross = this.resources.byId("tile-wire-cross");
    const lightOn = this.resources.byId("tile-light-on");
    const lightOff = this.resources.byId("tile-light-off");
    this.resources.images[0] = await this.resources.stack([ cross, lightOff ]);
    this.resources.images[1] = await this.resources.stack([ cross, lightOn ]);
  }

  rotate(variant?: number): Tile {
    return this;
  }

  get variant(): number {
    return this.power;
  }

  // onTick(): TickAction {
  //   if (this.triggered) return TickAction.stopPolling;
  //   this.triggered = true;
  //   return TickAction.spawn(this.orientation);
  // }

  reset() {
    this.power = 0;
  }
}
