import { Action, FLIP, NEXT_CLOCKWISE, NEXT_MATHWISE, OPPOSITE, Orientation, Tile } from "../models";
import { TileResources } from "./common";

export class TileWire implements Tile {
  static resources = new TileResources();

  orientation = Orientation.EAST;
  element: HTMLElement = TileWire.resources.getClone(this.orientation, this);

  static async load(): Promise<void> {
    await TileWire.resources.buildRotations(Orientation.EAST, 4, "tile-wire-h");
  }

  rotate(): Tile {
    this.orientation = FLIP[this.orientation];
    this.element = TileWire.resources.getClone(this.orientation, this);
    return this;
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


export class TileWireOneWay implements Tile {
  static resources = new TileResources();

  orientation = Orientation.EAST;
  element: HTMLElement = TileWireOneWay.resources.getClone(this.orientation, this);

  static async load(): Promise<void> {
    await TileWireOneWay.resources.buildRotations(Orientation.EAST, 4, "tile-wire-oneway");
  }

  rotate(): Tile {
    this.orientation = NEXT_CLOCKWISE[this.orientation];
    this.element = TileWireOneWay.resources.getClone(this.orientation, this);
    return this;
  }

  action(orientation: Orientation): Action {
    if (this.orientation == orientation) return Action.move(orientation);
    return Action.die;
  }
}


export class TileWireCorner implements Tile {
  static resources = new TileResources();

  // south-to-west
  orientation = Orientation.SOUTH;
  element: HTMLElement = TileWireCorner.resources.getClone(this.orientation, this);

  static async load(): Promise<void> {
    await TileWireCorner.resources.buildRotations(Orientation.SOUTH, 4, "tile-wire-corner");
  }

  rotate(): Tile {
    this.orientation = NEXT_CLOCKWISE[this.orientation];
    this.element = TileWireCorner.resources.getClone(this.orientation, this);
    return this;
  }

  action(orientation: Orientation): Action {
    if (orientation == OPPOSITE[this.orientation]) return Action.move(NEXT_MATHWISE[orientation]);
    if (orientation == NEXT_MATHWISE[this.orientation]) return Action.move(this.orientation);
    return Action.die;
  }
}


export class TileWireCross implements Tile {
  static resources = new TileResources();

  orientation = Orientation.EAST;
  element: HTMLElement = TileWireCross.resources.getClone(this.orientation, this);

  static async load(): Promise<void> {
    await TileWireCross.resources.buildRotations(Orientation.EAST, 1, "tile-wire-cross");
  }

  rotate(): Tile {
    return this;
  }

  action(orientation: Orientation): Action {
    return Action.move(orientation);
  }
}
