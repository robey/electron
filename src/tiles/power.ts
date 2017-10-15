import { Action, ElectronAction, NEXT_CLOCKWISE, Orientation, Tile } from "../models";
import { TileResources } from "./resources";

export class PowerOnce implements Tile {
  static resources = new TileResources();

  orientation = Orientation.NORTH;
  element: HTMLElement = PowerOnce.resources.getClone(this.orientation, this);
  x = 0;
  y = 0;

  activated = true;

  static async load(): Promise<void> {
    const stub = this.resources.byId("tile-wire-stub-north");
    const orientations = await this.resources.buildRotations(stub, Orientation.NORTH);
    const stack = await this.resources.stackRotations(orientations, this.resources.byIds("tile-power"));
    this.resources.fillOrientations(stack);
  }

  rotate(variant?: number): Tile {
    this.orientation = variant === undefined ? NEXT_CLOCKWISE[this.orientation] : variant as Orientation;
    this.element = PowerOnce.resources.getClone(this.orientation, this);
    return this;
  }

  get variant(): number {
    return this.orientation;
  }

  onElectron(orientation: Orientation): ElectronAction {
    return ElectronAction.move(orientation);
  }

  onTick(): Action {
    this.activated = false;
    return Action.spawn(this.orientation);
  }

  reset() {
    this.activated = true;
  }

  hasLink(orientation: Orientation): boolean {
    return orientation == this.orientation;
  }

  placementHint(orientation: Orientation) {
    this.rotate(orientation);
  }
}
