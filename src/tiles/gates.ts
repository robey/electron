import { Action, ElectronAction, NEXT_CLOCKWISE, NEXT_MATHWISE, OPPOSITE, Orientation, Tile } from "../models";
import { TileResources } from "./resources";

const GATE_DELAY = 2;

export class GateOr implements Tile {
  static resources = new TileResources();
  static flippedResources = new TileResources();

  // west + south to east, unless flipped, then west + north
  orientation = Orientation.EAST;
  flipped = false;

  element: HTMLElement = GateOr.resources.getClone(this.orientation, this);
  x = 0;
  y = 0;

  activated = false;
  cycles = 0;
  primary = false;
  secondary = false;

  static async load(): Promise<void> {
    const wse = this.resources.byId("tile-wire-t");
    const wne = this.resources.flipY(wse);
    const homeplate = this.resources.byId("tile-homeplate");
    const gate = this.resources.byId("tile-gate-or");

    await Promise.all([
      this.resources.fillOrientations(
        this.resources.buildRotations(this.resources.stack([ wse, homeplate, gate ]), Orientation.EAST)
      ),
      this.flippedResources.fillOrientations(
        this.resources.buildRotations(this.resources.stack([ wne, homeplate, gate ]), Orientation.EAST)
      ),
    ]);
  }

  toString() {
    return `gate(activated=${this.activated}, cycles=${this.cycles}, status=${this.primary},${this.secondary})`;
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

    this.element = (this.flipped ? GateOr.flippedResources : GateOr.resources).getClone(this.orientation, this);
    return this;
  }

  get variant(): number {
    return this.orientation + (this.flipped ? 4 : 0);
  }

  onElectron(orientation: Orientation): ElectronAction {
    if (!this.activated) {
      this.activated = true;
      this.cycles = 0;
      this.primary = this.secondary = false;
    }

    if (orientation == this.orientation) {
      this.primary = true;
      return this.cycles < GATE_DELAY - 1 ? ElectronAction.absorb : ElectronAction.die;
    }
    if (orientation == (this.flipped ? NEXT_CLOCKWISE[this.orientation] : NEXT_MATHWISE[this.orientation])) {
      this.secondary = true;
      return this.cycles < GATE_DELAY - 1 ? ElectronAction.absorb : ElectronAction.die;
    }
    // oh, the electron came from some random direction.
    if (this.cycles == 0) this.activated = false;
    return ElectronAction.die;
  }

  onTick(): Action {
    this.cycles++;
    if (this.cycles < GATE_DELAY) return Action.idle;
    this.activated = false;
    return (this.primary || this.secondary) ? Action.spawn(this.orientation) : Action.idle;
  }

  hasLink(orientation: Orientation): boolean {
    return orientation != (this.flipped ? NEXT_CLOCKWISE[this.orientation] : NEXT_MATHWISE[this.orientation]);
  }

  placementHint(orientation: Orientation) {
    // don't lose flippedness.
    this.rotate(OPPOSITE[orientation] + (this.flipped ? 4 : 0));
  }
}
