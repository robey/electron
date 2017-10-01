import { Action, FLIP, NEXT_CLOCKWISE, NEXT_MATHWISE, OPPOSITE, Orientation, Tile } from "./models";

// total HACK
let globalDragStartHandler: (event: DragEvent, tile: Tile) => void;
let globalDragEndHandler: (event: DragEvent, tile: Tile) => void;

/*
 * load any tile images into cache: we promise that all resource loading is
 * complete. also, set a HACK HACK HACK handler where dragstart events can
 * be sent. i hate the web.
 */
export function loadTiles(
  dragStartHandler: (event: DragEvent, tile: Tile) => void,
  dragEndHandler: (event: DragEvent, tile: Tile) => void,
) {
  TileWire.load();
  TileWireOneWay.load();
  TileWireCorner.load();
  TileWireCross.load();
  globalDragStartHandler = dragStartHandler;
  globalDragEndHandler = dragEndHandler;
}


export class TileWire implements Tile {
  static elements: { [orientation: number]: HTMLImageElement };

  orientation = Orientation.EAST;
  element: HTMLElement = cloneTile(TileWire.elements[this.orientation], this);

  static load() {
    const image = document.getElementById("tile-wire-h") as HTMLImageElement;
    TileWire.elements = {
      [Orientation.NORTH]: rotateImage(image, Math.PI / 2),
      [Orientation.EAST]: rotateImage(image, 0)
    };
  }

  drawAt(x: number, y: number): HTMLElement {
    const element = this.element;
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    return element;
  }

  rotate(): Tile {
    this.orientation = FLIP[this.orientation];
    this.element = cloneTile(TileWire.elements[this.orientation], this);
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
  static elements: { [orientation: number]: HTMLImageElement };

  orientation = Orientation.EAST;
  element: HTMLElement = cloneTile(TileWireOneWay.elements[this.orientation], this);

  static load() {
    const image = document.getElementById("tile-wire-oneway") as HTMLImageElement;
    TileWireOneWay.elements = {
      [Orientation.NORTH]: rotateImage(image, -Math.PI / 2),
      [Orientation.EAST]: rotateImage(image, 0),
      [Orientation.SOUTH]: rotateImage(image, Math.PI / 2),
      [Orientation.WEST]: rotateImage(image, Math.PI),
    };
  }

  drawAt(x: number, y: number): HTMLElement {
    const element = this.element;
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    return element;
  }

  rotate(): Tile {
    this.orientation = NEXT_CLOCKWISE[this.orientation];
    this.element = cloneTile(TileWireOneWay.elements[this.orientation], this);
    return this;
  }

  action(orientation: Orientation): Action {
    if (this.orientation == orientation) return Action.move(orientation);
    return Action.die;
  }
}

export class TileWireCorner implements Tile {
  static elements: { [orientation: number]: HTMLImageElement };

  // south-to-west
  orientation = Orientation.SOUTH;
  element: HTMLElement = cloneTile(TileWireCorner.elements[this.orientation], this);

  static load() {
    const image = document.getElementById("tile-wire-corner") as HTMLImageElement;
    TileWireCorner.elements = {
      [Orientation.NORTH]: rotateImage(image, Math.PI),
      [Orientation.EAST]: rotateImage(image, -Math.PI / 2),
      [Orientation.SOUTH]: rotateImage(image, 0),
      [Orientation.WEST]: rotateImage(image, Math.PI / 2),
    };
  }

  drawAt(x: number, y: number): HTMLElement {
    const element = this.element;
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    return element;
  }

  rotate(): Tile {
    this.orientation = NEXT_CLOCKWISE[this.orientation];
    this.element = cloneTile(TileWireCorner.elements[this.orientation], this);
    return this;
  }

  action(orientation: Orientation): Action {
    if (orientation == OPPOSITE[this.orientation]) return Action.move(NEXT_MATHWISE[orientation]);
    if (orientation == NEXT_MATHWISE[this.orientation]) return Action.move(this.orientation);
    return Action.die;
  }
}

export class TileWireCross implements Tile {
  static image: HTMLImageElement;

  orientation = Orientation.EAST;
  element: HTMLElement = cloneTile(TileWireCross.image, this);

  static load() {
    TileWireCross.image = document.getElementById("tile-wire-cross") as HTMLImageElement;
  }

  drawAt(x: number, y: number): HTMLElement {
    const element = this.element;
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    return element;
  }

  rotate(): Tile {
    return this;
  }

  action(orientation: Orientation): Action {
    return Action.move(orientation);
  }
}


// ----- helpers

function cloneTile(element: HTMLElement, tile: Tile): HTMLElement {
  const rv = element.cloneNode(true) as HTMLElement;
  rv.removeAttribute("id");
  rv.classList.add("tile");
  rv.classList.add("tile-placed");
  rv.addEventListener("dragstart", event => globalDragStartHandler(event, tile));
  rv.addEventListener("dragend", event => globalDragEndHandler(event, tile));
  return rv;
}

// assumes a square image.
function rotateImage(original: HTMLImageElement, rotation: number): HTMLImageElement {
  const canvas = document.createElement("canvas");
	canvas.width = original.width;
	canvas.height = original.height;
	const context = canvas.getContext("2d") as CanvasRenderingContext2D;

  const center = original.width / 2;
  context.save();
  context.translate(center, center);
  context.rotate(rotation);
  context.drawImage(original, -center, -center, original.width, original.height);
  context.restore();

  const image = new Image(original.width, original.height);
  image.src = canvas.toDataURL("image/png");
  image.classList.add("tile");
  return image;
}
