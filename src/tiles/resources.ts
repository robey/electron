import { once } from "../common/events";
import { NEXT_CLOCKWISE, NEXT_MATHWISE, OPPOSITE, Orientation, Tile } from "../models";

// total HACK
let globalDragStartHandler: (event: DragEvent, tile: Tile) => void;
let globalDragEndHandler: (event: DragEvent, tile: Tile) => void;

export function setTileDragEvents(
  dragStartHandler: (event: DragEvent, tile: Tile) => void,
  dragEndHandler: (event: DragEvent, tile: Tile) => void,
) {
  globalDragStartHandler = dragStartHandler;
  globalDragEndHandler = dragEndHandler;
}


export class TileResources {
  primaryImage: HTMLImageElement;
  images: { [variant: number]: HTMLImageElement } = {};

  load(id: string) {
    this.primaryImage = document.getElementById(id) as HTMLImageElement;
  }

  getClone(variant: number, tile: Tile): HTMLElement {
    const rv = this.images[variant].cloneNode(true) as HTMLElement;
    rv.removeAttribute("id");
    rv.classList.add("tile");
    rv.classList.add("tile-placed");
    rv.addEventListener("dragstart", event => globalDragStartHandler(event, tile));
    rv.addEventListener("dragend", event => globalDragEndHandler(event, tile));
    return rv;
  }

  // return a promise, just to make chaining easier.
  byId(id: string): Promise<HTMLImageElement> {
    return Promise.resolve(document.getElementById(id) as HTMLImageElement);
  }

  byIds(...ids: string[]): Promise<HTMLImageElement>[] {
    return ids.map(id => this.byId(id));
  }

  stack(images: Promise<HTMLImageElement>[]): Promise<HTMLImageElement> {
    return Promise.all(images).then(x => stackImages(x));
  }

  flipY(image: Promise<HTMLImageElement>): Promise<HTMLImageElement> {
    return image.then(x => flipImageY(x));
  }

  /*
   * given a map of image rotations, draw each one over a stack of other
   * images, returning a new map.
   */
  stackRotations(
    orientations: Map<Orientation, Promise<HTMLImageElement>>,
    images: Promise<HTMLImageElement>[]
  ): Map<Orientation, Promise<HTMLImageElement>> {
    return new Map([...orientations.entries()].map(([ orientation, image ]) => {
      return [
        orientation,
        Promise.all([ image ].concat(images)).then(stack => stackImages(stack))
      ] as [ Orientation, Promise<HTMLImageElement> ];
    }));
  }

  /*
   * given one image, and its initial orientation, generate a map of all four
   * possible rotations.
   */
  buildRotations(
    image: Promise<HTMLImageElement>,
    orientation: Orientation
  ): Map<Orientation, Promise<HTMLImageElement>> {
    return new Map([
      [ orientation, image.then(original => rotateImage(original, 0)) ],
      [ NEXT_CLOCKWISE[orientation], image.then(original => rotateImage(original, -Math.PI / 2)) ],
      [ OPPOSITE[orientation], image.then(original => rotateImage(original, Math.PI)) ],
      [ NEXT_MATHWISE[orientation], image.then(original => rotateImage(original, Math.PI / 2)) ],
    ]);
  }

  async fillOrientations(orientations: Map<Orientation, Promise<HTMLImageElement>>): Promise<void> {
    for (const [ key, image ] of orientations) {
      this.images[key] = await image;
    }
  }

  // use only one orientation
  async addImage(variant: number, image: Promise<HTMLImageElement>): Promise<void> {
    this.images[variant] = await image;
  }
}


// assumes a square image.
async function rotateImage(original: HTMLImageElement, rotation: number): Promise<HTMLImageElement> {
  const canvas = document.createElement("canvas");
	canvas.width = original.width;
	canvas.height = original.height;
	const context = canvas.getContext("2d") as CanvasRenderingContext2D;

  const center = original.width / 2;
  context.save();
  context.translate(center, center);
  context.rotate(-rotation);
  context.drawImage(original, -center, -center, original.width, original.height);
  context.restore();

  const image = new Image(original.width, original.height);
  image.classList.add("tile");
  image.src = canvas.toDataURL("image/png");
  await once(image, "load", () => null);
  return image;
}

async function flipImageY(original: HTMLImageElement): Promise<HTMLImageElement> {
  const canvas = document.createElement("canvas");
	canvas.width = original.width;
	canvas.height = original.height;
	const context = canvas.getContext("2d") as CanvasRenderingContext2D;

  context.save();
  context.translate(0, original.height);
  context.scale(1, -1);
  context.drawImage(original, 0, 0, original.width, original.height);
  context.restore();

  const image = new Image(original.width, original.height);
  image.classList.add("tile");
  image.src = canvas.toDataURL("image/png");
  await once(image, "load", () => null);
  return image;
}

async function stackImages(images: HTMLImageElement[]): Promise<HTMLImageElement> {
  const canvas = document.createElement("canvas");
  canvas.width = images[0].width;
  canvas.height = images[0].height;
  const context = canvas.getContext("2d") as CanvasRenderingContext2D;
  images.forEach(image => {
    context.drawImage(image, 0, 0, image.width, image.height);
  });

  const image = new Image(images[0].width, images[0].height);
  image.classList.add("tile");
  image.src = canvas.toDataURL("image/png");
  await once(image, "load", () => null);
  return image;
}
