import {
  Action, ElectronAction, FLIP, NEXT_CLOCKWISE, NEXT_MATHWISE, OPPOSITE, Orientation, Tile, TO_NE
} from "../models";
import { TileResources } from "./resources";


export class Wire implements Tile {
  static resources = new TileResources();

  orientation = Orientation.EAST;
  element: HTMLElement = Wire.resources.getClone(this.orientation, this);
  x = 0;
  y = 0;

  static async load(): Promise<void> {
    const wire = this.resources.byId("tile-wire-h");
    const orientations = await this.resources.buildRotations(wire, Orientation.EAST);
    this.resources.fillOrientations(orientations);
  }

  rotate(variant?: number): Tile {
    this.orientation = variant === undefined ? FLIP[this.orientation] : variant as Orientation;
    this.element = Wire.resources.getClone(this.orientation, this);
    return this;
  }

  get variant(): number {
    return this.orientation;
  }

  onElectron(orientation: Orientation): ElectronAction {
    if (this.orientation == Orientation.NORTH) {
      return (orientation == Orientation.NORTH || orientation == Orientation.SOUTH) ?
        ElectronAction.move(orientation) : ElectronAction.die;
    } else {
      return (orientation == Orientation.EAST || orientation == Orientation.WEST) ?
        ElectronAction.move(orientation) : ElectronAction.die;
    }
  }

  hasLink(orientation: Orientation): boolean {
    return this.orientation == TO_NE[orientation];
  }

  placementHint(orientation: Orientation) {
    this.rotate(TO_NE[orientation]);
  }

  canCollide(a: Orientation, b: Orientation): boolean {
    return true;
  }
}


export class WireOneWay implements Tile {
  static resources = new TileResources();

  orientation = Orientation.EAST;
  element: HTMLElement = WireOneWay.resources.getClone(this.orientation, this);
  x = 0;
  y = 0;

  static async load(): Promise<void> {
    const wire = this.resources.byId("tile-wire-oneway");
    const orientations = await this.resources.buildRotations(wire, Orientation.EAST);
    this.resources.fillOrientations(orientations);
  }

  rotate(variant?: number): Tile {
    this.orientation = variant === undefined ? NEXT_CLOCKWISE[this.orientation] : variant as Orientation;
    this.element = WireOneWay.resources.getClone(this.orientation, this);
    return this;
  }

  get variant(): number {
    return this.orientation;
  }

  onElectron(orientation: Orientation): ElectronAction {
    if (this.orientation == orientation) return ElectronAction.move(orientation);
    return ElectronAction.die;
  }

  hasLink(orientation: Orientation): boolean {
    return this.orientation == TO_NE[orientation];
  }

  placementHint(orientation: Orientation) {
    this.rotate(OPPOSITE[orientation]);
  }

  canCollide(a: Orientation, b: Orientation): boolean {
    return true;
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
    const wire = this.resources.byId("tile-wire-corner");
    const orientations = await this.resources.buildRotations(wire, Orientation.SOUTH);
    this.resources.fillOrientations(orientations);
  }

  rotate(variant?: number): Tile {
    this.orientation = variant === undefined ? NEXT_CLOCKWISE[this.orientation] : variant as Orientation;
    this.element = WireCorner.resources.getClone(this.orientation, this);
    return this;
  }

  get variant(): number {
    return this.orientation;
  }

  onElectron(orientation: Orientation): ElectronAction {
    if (orientation == OPPOSITE[this.orientation]) return ElectronAction.move(NEXT_MATHWISE[orientation]);
    if (orientation == NEXT_MATHWISE[this.orientation]) return ElectronAction.move(this.orientation);
    return ElectronAction.die;
  }

  hasLink(orientation: Orientation): boolean {
    return orientation == this.orientation || orientation == NEXT_CLOCKWISE[this.orientation];
  }

  placementHint(orientation: Orientation) {
    this.rotate(orientation);
  }

  canCollide(a: Orientation, b: Orientation): boolean {
    return true;
  }
}


export class WireCross implements Tile {
  static resources = new TileResources();

  orientation = Orientation.EAST;
  element: HTMLElement = WireCross.resources.getClone(this.orientation, this);
  x = 0;
  y = 0;

  static async load(): Promise<void> {
    const wire = this.resources.byId("tile-wire-cross");
    this.resources.fillOrientations(new Map([ [ Orientation.EAST, wire ] ]));
  }

  rotate(variant?: number): Tile {
    return this;
  }

  get variant(): number {
    return 0;
  }

  onElectron(orientation: Orientation): ElectronAction {
    return ElectronAction.move(orientation);
  }

  canCollide(a: Orientation, b: Orientation): boolean {
    return a == OPPOSITE[b];
  }
}


export class WireSplit implements Tile {
  static resources = new TileResources();
  static flippedResources = new TileResources();

  // west to south+east, unless flipped, then north+east
  orientation = Orientation.WEST;
  flipped = false;

  element: HTMLElement = WireSplit.resources.getClone(this.orientation, this);
  x = 0;
  y = 0;

  static async load(): Promise<void> {
    const wse = this.resources.byId("tile-wire-split-wse");
    const wne = await this.resources.flipY(wse);
    this.resources.fillOrientations(await this.resources.buildRotations(wse, Orientation.WEST));
    this.flippedResources.fillOrientations(await this.resources.buildRotations(wne, Orientation.WEST));
  }

  rotate(variant?: number): Tile {
    if (variant !== undefined) {
      if (variant >= 4) {
        this.flipped = true;
        this.orientation = variant - 4;
      } else {
        this.flipped = false;
        this.orientation = variant;
      }
    } else {
      if (this.flipped) {
        this.orientation = NEXT_CLOCKWISE[this.orientation];
        this.flipped = false;
      } else {
        this.flipped = true;
      }
    }

    this.element = (this.flipped ? WireSplit.flippedResources : WireSplit.resources).getClone(this.orientation, this);
    return this;
  }

  get variant(): number {
    return this.orientation + (this.flipped ? 4 : 0);
  }

  onElectron(orientation: Orientation): ElectronAction {
    const branch = this.flipped ? NEXT_MATHWISE[orientation] : NEXT_CLOCKWISE[orientation]
    if (orientation == OPPOSITE[this.orientation]) {
      const action = Action.spawn(branch);
      return ElectronAction.move(orientation).withAction(action);
    }
    if (orientation == branch || orientation == this.orientation) {
      return ElectronAction.move(this.orientation);
    }
    return ElectronAction.die;
  }

  canCollide(a: Orientation, b: Orientation): boolean {
    return true;
  }
}
