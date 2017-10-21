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

  byIds(...ids: string[]): Promise<HTMLImageElement[]> {
    return Promise.all(ids.map(id => this.byId(id)));
  }

  stack(images: Promise<HTMLImageElement[]>): Promise<HTMLImageElement> {
    return images.then(x => stackImages(x));
  }

  flipY(image: Promise<HTMLImageElement>): Promise<HTMLImageElement> {
    return image.then(x => flipImageY(x));
  }

  /*
   * given a map of image rotations, draw each one over a stack of other
   * images, returning a new map.
   */
  async stackRotations(
    orientations: Promise<Map<Orientation, HTMLImageElement>>,
    images: Promise<HTMLImageElement[]>
  ): Promise<Map<Orientation, HTMLImageElement>> {
    const oldMap = await orientations;
    const stack = await images;
    return new Map(await Promise.all([...oldMap.entries()].map(async ([ key, originalImage ]) => {
      return [ key, await stackImages([ originalImage ].concat(stack)) ] as [ Orientation, HTMLImageElement ];
    })));
  }

  /*
   * given one image, and its initial orientation, generate a map of all four
   * possible rotations.
   */
  async buildRotations(
    originalImage: Promise<HTMLImageElement>,
    originalOrientation: Orientation
  ): Promise<Map<Orientation, HTMLImageElement>> {
    const rv = new Map<Orientation, HTMLImageElement>();
    const original = await originalImage;
    const images = await Promise.all([
      rotateImage(original, 0),
      rotateImage(original, -Math.PI / 2),
      rotateImage(original, Math.PI),
      rotateImage(original, Math.PI / 2),
    ]);
    rv.set(originalOrientation, images[0]);
    rv.set(NEXT_CLOCKWISE[originalOrientation], images[1]);
    rv.set(OPPOSITE[originalOrientation], images[2]);
    rv.set(NEXT_MATHWISE[originalOrientation], images[3]);
    return rv;
  }

  async fillOrientations(orientations: Promise<Map<Orientation, HTMLImageElement>>): Promise<void> {
    for (const [ key, image ] of (await orientations)) {
      this.images[key] = image;
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
