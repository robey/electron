import { Action, ElectronAction, NEXT_CLOCKWISE, Orientation, Tile } from "../models";
import { TileResources } from "./resources";

export class Switch implements Tile {
  static resources = new TileResources();

  variant = 0;
  element: HTMLElement = Switch.resources.getClone(this.variant, this);
  x = 0;
  y = 0;

  static async load(): Promise<void> {
    const cross = this.resources.byId("tile-wire-cross");
    const switchOff = this.resources.byId("tile-switch-off");
    const switchOn = this.resources.byId("tile-switch-on");

    await Promise.all([
      this.resources.addImage(0, this.resources.stack(Promise.all([ cross, switchOff ]))),
      this.resources.addImage(1, this.resources.stack(Promise.all([ cross, switchOn ]))),
    ]);
  }

  rotate(variant?: number): Tile {
    this.variant = variant === undefined ? -this.variant + 1 : variant;
    this.element = Switch.resources.getClone(this.variant, this);
    return this;
  }

  onElectron(orientation: Orientation): ElectronAction {
    return this.variant == 1 ? ElectronAction.move(orientation) : ElectronAction.die;
  }

  hasLink(orientation: Orientation): boolean {
    return true;
  }
}
