import { Action, FLIP, NEXT_CLOCKWISE, NEXT_MATHWISE, OPPOSITE, Orientation, Tile } from "../models";
import { TileResources } from "./common";

export class Wire implements Tile {
  static resources = new TileResources();

  orientation = Orientation.EAST;
  element: HTMLElement = Wire.resources.getClone(this.orientation, this);
  x = 0;
  y = 0;

  static async load(): Promise<void> {
    await Wire.resources.buildRotations(Orientation.EAST, 4, "tile-wire-h");
  }

  rotate(variant?: number): Tile {
    this.orientation = variant === undefined ? FLIP[this.orientation] : variant as Orientation;
    this.element = Wire.resources.getClone(this.orientation, this);
    return this;
  }

  get variant(): number {
    return this.orientation;
  }

  action(orientation: Orientation): Action {
    if (this.orientation == Orientation.NORTH) {
      return (orientation == Orientation.NORTH || orientation == Orientation.SOUTH) ?
        Action.move(orientation) : Action.die;
    } else {
      return (orientation == Orientation.EAST || orientation == Orientation.WEST) ?
        Action.move(orientation) : Action.die;
    }
  }
}


export class WireOneWay implements Tile {
  static resources = new TileResources();

  orientation = Orientation.EAST;
  element: HTMLElement = WireOneWay.resources.getClone(this.orientation, this);
  x = 0;
  y = 0;

  static async load(): Promise<void> {
    await WireOneWay.resources.buildRotations(Orientation.EAST, 4, "tile-wire-oneway");
  }

  rotate(variant?: number): Tile {
    this.orientation = variant === undefined ? NEXT_CLOCKWISE[this.orientation] : variant as Orientation;
    this.element = WireOneWay.resources.getClone(this.orientation, this);
    return this;
  }

  get variant(): number {
    return this.orientation;
  }

  action(orientation: Orientation): Action {
    if (this.orientation == orientation) return Action.move(orientation);
    return Action.die;
  }
}


export class WireCorner implements Tile {
  static resources = new TileResources();

  // south-to-west
  orientation = Orientation.SOUTH;
  element: HTMLElement = WireCorner.resources.getClone(this.orientation, this);
  x = 0;
  y = 0;

  static async load(): Promise<void> {
    await WireCorner.resources.buildRotations(Orientation.SOUTH, 4, "tile-wire-corner");
  }

  rotate(variant?: number): Tile {
    this.orientation = variant === undefined ? NEXT_CLOCKWISE[this.orientation] : variant as Orientation;
    this.element = WireCorner.resources.getClone(this.orientation, this);
    return this;
  }

  get variant(): number {
    return this.orientation;
  }

  action(orientation: Orientation): Action {
    if (orientation == OPPOSITE[this.orientation]) return Action.move(NEXT_MATHWISE[orientation]);
    if (orientation == NEXT_MATHWISE[this.orientation]) return Action.move(this.orientation);
    return Action.die;
  }
}


export class WireCross implements Tile {
  static resources = new TileResources();

  orientation = Orientation.EAST;
  element: HTMLElement = WireCross.resources.getClone(this.orientation, this);
  x = 0;
  y = 0;

  static async load(): Promise<void> {
    await WireCross.resources.buildRotations(Orientation.EAST, 1, "tile-wire-cross");
  }

  rotate(variant?: number): Tile {
    return this;
  }

  get variant(): number {
    return 0;
  }

  action(orientation: Orientation): Action {
    return Action.move(orientation);
  }
}
