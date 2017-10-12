export enum Orientation {
  NORTH, EAST, SOUTH, WEST
}

export enum ElectronActionType {
  DIE,
  MOVE,
}

export class ElectronAction {
  action?: Action;

  constructor(
    public type: ElectronActionType,
    public orientation: Orientation = Orientation.NORTH
  ) {
    // pass
  }

  static die = new ElectronAction(ElectronActionType.DIE);

  static move(orientation: Orientation) {
    return new ElectronAction(ElectronActionType.MOVE, orientation);
  }

  withAction(action: Action): ElectronAction {
    const rv = new ElectronAction(this.type, this.orientation);
    rv.action = action;
    return rv;
  }
}

export enum ActionType {
  IDLE,
  SPAWN,
  CHANGE_IMAGE
}

export class Action {
  constructor(
    public type: ActionType,
    public orientation: Orientation = Orientation.NORTH,
    public oldImage?: HTMLElement,
    public newImage?: HTMLElement
  ) {
    // pass
  }

  static idle = new Action(ActionType.IDLE);

  static spawn(orientation: Orientation): Action {
    return new Action(ActionType.SPAWN, orientation);
  }

  static changeImage(oldImage: HTMLElement, newImage: HTMLElement): Action {
    return new Action(ActionType.CHANGE_IMAGE, undefined, oldImage, newImage);
  }
}

export const ORIENTATION_NAME = {
  [Orientation.NORTH]: "north",
  [Orientation.EAST]: "east",
  [Orientation.SOUTH]: "south",
  [Orientation.WEST]: "west",
};

// for each orientation, how many degrees clockwise from north?
export const CLOCK_DEGREES = {
  [Orientation.NORTH]: 0,
  [Orientation.EAST]: 90,
  [Orientation.SOUTH]: 180,
  [Orientation.WEST]: 270,
};

// for each orientation, how many degrees couter-clockwise from east?
export const MATH_DEGREES = {
  [Orientation.NORTH]: 90,
  [Orientation.EAST]: 0,
  [Orientation.SOUTH]: 270,
  [Orientation.WEST]: 180,
};

// for each orientation, next clockwise direction?
export const NEXT_CLOCKWISE = {
  [Orientation.NORTH]: Orientation.EAST,
  [Orientation.EAST]: Orientation.SOUTH,
  [Orientation.SOUTH]: Orientation.WEST,
  [Orientation.WEST]: Orientation.NORTH,
};

// for each orientation, next mathwise direction?
export const NEXT_MATHWISE = {
  [Orientation.EAST]: Orientation.NORTH,
  [Orientation.NORTH]: Orientation.WEST,
  [Orientation.WEST]: Orientation.SOUTH,
  [Orientation.SOUTH]: Orientation.EAST,
};

export const OPPOSITE = {
  [Orientation.EAST]: Orientation.WEST,
  [Orientation.NORTH]: Orientation.SOUTH,
  [Orientation.WEST]: Orientation.EAST,
  [Orientation.SOUTH]: Orientation.NORTH,
};

// flip orientation, if only north and east are valid:
export const FLIP = {
  [Orientation.NORTH]: Orientation.EAST,
  [Orientation.EAST]: Orientation.NORTH,
};

export interface Tile {
  // change to the next orientation, either by user request, or to a specific
  // variant because we're loading from storage.
  // this implicitly invalidates 'element'.
  rotate(variant?: number): Tile;

  // current variant, for saving to storage.
  variant: number;

  // what should happen if an electron enters?
  onElectron?: (orientation: Orientation) => ElectronAction;

  // if we should check for an action on every cycle:
  activated?: boolean;
  onTick?: () => Action;

  // if some internal state should be cleared before each animation:
  reset?: () => void;

  // the current HTML element to draw.
  element: HTMLElement;

  // location on the board, if any.
  x: number;
  y: number;
}
