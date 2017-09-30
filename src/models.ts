export enum Orientation {
  NORTH, EAST, SOUTH, WEST
}

export enum ActionType {
  DIE,
  MOVE,
}

export class Action {
  constructor(
    public type: ActionType,
    public orientation: Orientation = Orientation.NORTH
  ) {
    // pass
  }

  static die = new Action(ActionType.DIE);

  static move(orientation: Orientation) {
    return new Action(ActionType.MOVE, orientation);
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
  // change to the next orientation (by user request).
  // this implicitly invalidates 'element'.
  rotate(): Tile;

  // set the position and transform of your tile image and return it.
  drawAt(x: number, y: number): HTMLElement;

  // what should happen if an electron enters?
  action(orientation: Orientation): Action;

  // the current HTML element to draw.
  element: HTMLElement;
}
