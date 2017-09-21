
enum Orientation {
  NORTH, EAST, SOUTH, WEST
}

export interface Tile {
  rotate(): Tile;
  draw(canvas: CanvasRenderingContext2D, x: number, y: number, size: number): void;
}

// mixin for tiles that can rotate
class RotatingTile {
  orientation: Orientation = Orientation.NORTH;

  // if all 4 orientations are valid
  rotate90() {
    switch (this.orientation) {
      case Orientation.NORTH:
        this.orientation = Orientation.EAST;
        break;
      case Orientation.EAST:
        this.orientation = Orientation.SOUTH;
        break;
      case Orientation.SOUTH:
        this.orientation = Orientation.WEST;
        break;
      case Orientation.WEST:
        this.orientation = Orientation.NORTH;
        break;
    }
  }

  // if only north & east are valid
  rotateFlip() {
    if (this.orientation == Orientation.EAST) {
      this.orientation = Orientation.NORTH;
    } else {
      this.orientation = Orientation.EAST;
    }
  }
}

export class TileWire extends RotatingTile implements Tile {
  static image: HTMLImageElement;

  orientation = Orientation.EAST;

  static load() {
    TileWire.image = document.getElementById("tile-wire-h") as HTMLImageElement;
  }

  rotate(): Tile {
    this.rotateFlip();
    return this;
  }

  draw(canvas: CanvasRenderingContext2D, x: number, y: number, size: number) {
    if (this.orientation == Orientation.EAST) {
      canvas.drawImage(TileWire.image, x, y, size, size);
    } else {
      drawRotatedAt(canvas, TileWire.image, Math.PI / 2, x, y, size);
    }
  }
}

export class TileCorner extends RotatingTile implements Tile {
  static image: HTMLImageElement;

  orientation = Orientation.SOUTH;

  static load() {
    TileCorner.image = document.getElementById("tile-wire-corner") as HTMLImageElement;
  }

  rotate(): Tile {
    this.rotate90();
    return this;
  }

  draw(canvas: CanvasRenderingContext2D, x: number, y: number, size: number) {
    // image is normally oriented south-to-west ("south").
    switch (this.orientation) {
      case Orientation.NORTH:
        drawRotatedAt(canvas, TileCorner.image, Math.PI, x, y, size);
        break;
      case Orientation.EAST:
        drawRotatedAt(canvas, TileCorner.image, -Math.PI / 2, x, y, size);
        break;
      case Orientation.SOUTH:
        drawRotatedAt(canvas, TileCorner.image, 0, x, y, size);
        break;
      case Orientation.WEST:
        drawRotatedAt(canvas, TileCorner.image, Math.PI / 2, x, y, size);
        break;
    }
  }
}


// ----- helpers

function drawRotatedAt(
  canvas: CanvasRenderingContext2D,
  image: HTMLImageElement,
  rotation: number,
  x: number,
  y: number,
  size: number
) {
  const center = size / 2;
  canvas.save();
  canvas.translate(x + center, y + center);
  canvas.rotate(rotation);
  canvas.drawImage(image, -center, -center, size, size);
  canvas.restore();
}
