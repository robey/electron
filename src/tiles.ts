
enum Orientation {
  NORTH, EAST, SOUTH, WEST
}

// for each orientation, how many degrees clockwise from north?
const NORTH_DEGREES = {
  [Orientation.NORTH]: 0,
  [Orientation.EAST]: 90,
  [Orientation.SOUTH]: 180,
  [Orientation.WEST]: 270,
};

// for each orientation, next clockwise direction?
const NEXT_CLOCKWISE = {
  [Orientation.NORTH]: Orientation.EAST,
  [Orientation.EAST]: Orientation.SOUTH,
  [Orientation.SOUTH]: Orientation.WEST,
  [Orientation.WEST]: Orientation.NORTH,
};

// flip orientation, if only north and east are valid:
const FLIP = {
  [Orientation.NORTH]: Orientation.EAST,
  [Orientation.EAST]: Orientation.NORTH,
};

export interface Tile {
  // change to the next orientation (by user request)
  rotate(): Tile;

  // set the position and transform of your tile image and return it.
  // if you don't have a tile image, create one.
  drawAt(x: number, y: number): HTMLElement;

  // throw away your cache image and return it.
  // this tile is being erased or has scrolled off-screen.
  hide(): HTMLElement | null;
}



export class TileWire implements Tile {
  element: HTMLImageElement | null = null;
  orientation = Orientation.EAST;

  drawAt(x: number, y: number): HTMLElement {
    if (this.element == null) this.element = cloneTile("tile-wire-h");
    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
    this.element.style.transform = `rotate(${this.orientation == Orientation.EAST ? 0 : 90}deg)`;
    return this.element;
  }

  rotate(): Tile {
    this.orientation = FLIP[this.orientation];
    return this;
  }

  hide(): HTMLElement | null {
    const rv = this.element;
    this.element = null;
    return rv;
  }
}

export class TileCorner implements Tile {
  element: HTMLElement | null = null;

  // south-to-west
  orientation = Orientation.SOUTH;

  drawAt(x: number, y: number): HTMLElement {
    if (this.element == null) this.element = cloneTile("tile-wire-corner");
    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
    this.element.style.transform = `rotate(${180 + NORTH_DEGREES[this.orientation]}deg)`;
    return this.element;
  }

  rotate(): Tile {
    this.orientation = NEXT_CLOCKWISE[this.orientation];
    return this;
  }

  hide(): HTMLElement | null {
    const rv = this.element;
    this.element = null;
    return rv;
  }
}


// ----- helpers

function cloneTile(id: string): HTMLImageElement {
  const image = document.getElementById(id) as HTMLImageElement;
  const rv = image.cloneNode(false) as HTMLImageElement;

  // set some basic common CSS
  rv.removeAttribute("id");
  rv.style.position = "absolute";

  return rv;
}
