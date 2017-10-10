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
  images: { [orientation: number]: HTMLImageElement } = {};

  load(id: string) {
    this.primaryImage = document.getElementById(id) as HTMLImageElement;
  }

  getClone(orientation: number, tile: Tile) {
    const rv = this.images[orientation].cloneNode(true) as HTMLElement;
    rv.removeAttribute("id");
    rv.classList.add("tile");
    rv.classList.add("tile-placed");
    rv.addEventListener("dragstart", event => globalDragStartHandler(event, tile));
    rv.addEventListener("dragend", event => globalDragEndHandler(event, tile));
    return rv;
  }

  // build the various rotations, given an initial image
  async buildRotations(originalOrientation: Orientation, count: number, ...ids: string[]): Promise<void> {
    const firstImage = document.getElementById(ids[0]) as HTMLImageElement;
    const layers = ids.slice(1).map(id => document.getElementById(id) as HTMLImageElement);
    const rotatedFirst = {
      [originalOrientation]: firstImage,
      [NEXT_CLOCKWISE[originalOrientation]]: rotateImage(firstImage, Math.PI / 2),
      [OPPOSITE[originalOrientation]]: rotateImage(firstImage, Math.PI),
      [NEXT_MATHWISE[originalOrientation]]: rotateImage(firstImage, -Math.PI / 2),
    };

    this.images[originalOrientation] = await stackImages([ firstImage ].concat(layers));
    if (count > 1) {
      const orient = NEXT_CLOCKWISE[originalOrientation];
      this.images[orient] = await stackImages([ rotatedFirst[orient] ].concat(layers));
    }
    if (count > 2) {
      const orient1 = NEXT_MATHWISE[originalOrientation];
      const orient2 = OPPOSITE[originalOrientation];
      this.images[orient1] = await stackImages([ rotatedFirst[orient1] ].concat(layers));
      this.images[orient2] = await stackImages([ rotatedFirst[orient2] ].concat(layers));
    }
  }
}


export function moveTile(tile: Tile, xPixel: number, yPixel: number) {
  const element = tile.element;
  element.style.left = `${xPixel}px`;
  element.style.top = `${yPixel}px`;
  return element;
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
(document as any).rotateImage = rotateImage;

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
