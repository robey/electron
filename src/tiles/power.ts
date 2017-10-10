import { Action, NEXT_CLOCKWISE, Orientation, TickAction, Tile } from "../models";
import { TileResources } from "./common";

export class PowerOnce implements Tile {
  static resources = new TileResources();

  orientation = Orientation.NORTH;
  element: HTMLElement = PowerOnce.resources.getClone(this.orientation, this);
  x = 0;
  y = 0;

  triggered = false;

  static async load(): Promise<void> {
    await PowerOnce.resources.buildRotations(Orientation.NORTH, 4, "tile-wire-stub-north", "tile-power");
  }

  rotate(variant?: number): Tile {
    this.orientation = variant === undefined ? NEXT_CLOCKWISE[this.orientation] : variant as Orientation;
    this.element = PowerOnce.resources.getClone(this.orientation, this);
    return this;
  }

  get variant(): number {
    return this.orientation;
  }

  action(orientation: Orientation): Action {
    return Action.move(orientation);
  }

  onTick(): TickAction {
    if (this.triggered) return TickAction.stopPolling;
    this.triggered = true;
    return TickAction.spawn(this.orientation);
  }

  reset() {
    this.triggered = false;
  }
}
