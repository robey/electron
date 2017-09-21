import { Tile, TileCorner, TileWire } from "./tiles";
import { TileGrid } from "./tile_grid";
import { Toolbox } from "./toolbox";

const DEFAULT_TILE_SIZE = 50;


window.addEventListener("DOMContentLoaded", async () => {
});

window.addEventListener("load", async () => {
  TileWire.load();
  TileCorner.load();

  (document as any).board = new Board();
});

export class Board {
  tileSize = DEFAULT_TILE_SIZE;

  cursorX = 0;
  cursorY = 0;
  viewLeft = -2;
  viewTop = -2;
  viewWidth = 0;
  viewHeight = 0;
  xOffset = 0;
  yOffset = 0;

  tileGrid: TileGrid;
  toolbox: Toolbox;

  canvasElement: HTMLCanvasElement;
  canvas: CanvasRenderingContext2D;
  cursor: HTMLImageElement;

  tileStyle: CSSStyleDeclaration;

  constructor() {
    this.canvasElement = document.getElementById("board") as HTMLCanvasElement;
    this.canvas = this.canvasElement.getContext("2d") as CanvasRenderingContext2D;
    this.cursor = document.getElementById("cursor") as HTMLImageElement;

    // CSS + canvas bug: a canvas is always "300 x 150" regardless of its
    // size. fix by telling it how big it is.
    this.canvasElement.width = this.canvasElement.clientWidth;
    this.canvasElement.height = this.canvasElement.clientHeight;

    const cssRules = ([] as CSSRule[]).concat(...Array.from(document.styleSheets).map(sheet => {
      if (sheet instanceof CSSStyleSheet) return Array.from(sheet.cssRules);
      return [] as CSSRule[];
    })) as CSSStyleRule[];

    this.tileStyle = cssRules.filter(x => x.selectorText == ".tile")[0].style;

    this.tileGrid = new TileGrid();
    this.toolbox = new Toolbox(this);

    // FIXME
    const x1 = new TileWire();
    x1.rotate();
    this.tileGrid.setAt(3, 1, x1);
    this.tileGrid.setAt(4, 1, new TileCorner());
    this.tileGrid.setAt(4, 2, new TileWire());

    // support for "keypress" appears to have been silently removed from chrome.
    document.addEventListener("keydown", event => this.keypress(event));
    document.addEventListener("click", event => this.click(event));
    document.addEventListener("dblclick", event => this.doubleClick(event));



    this.resize();
  }

  resize() {
    this.tileStyle.width = `${this.tileSize}px`;
    const width = this.canvasElement.clientWidth;
    const height = this.canvasElement.clientHeight;
    this.viewWidth = Math.floor(width / this.tileSize);
    this.viewHeight = Math.floor(height / this.tileSize);
    this.xOffset = (width - this.viewWidth * this.tileSize) / 2;
    this.yOffset = (height - this.viewHeight * this.tileSize) / 2;

    this.redraw();
  }

  redraw() {
    this.canvas.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

    // overlap by 1 on each side, to make it bleed the margins.
    for (let y = this.viewTop - 1; y <= this.viewTop + this.viewHeight; y++) {
      for (let x = this.viewLeft - 1; x <= this.viewLeft + this.viewWidth; x++) {
        this.drawTile(x, y);
      }
    }
    this.positionCursor();
  }

  drawTile(x?: number, y?: number) {
    if (x === undefined) x = this.cursorX;
    if (y === undefined) y = this.cursorY;
    const [ xPixel, yPixel ] = this.tileToPixel(x, y);
    this.canvas.clearRect(xPixel, yPixel, this.tileSize, this.tileSize);
    const tile = this.tileGrid.getAt(x, y);
    if (tile) tile.draw(this.canvas, xPixel, yPixel, this.tileSize);
  }

  positionCursor(x?: number, y?: number) {
    if (x !== undefined) this.cursorX = x;
    if (y !== undefined) this.cursorY = y;
    const [ xPixel, yPixel ] = this.tileToPixel(this.cursorX, this.cursorY);
    this.cursor.style.left = `${xPixel}px`;
    this.cursor.style.top = `${yPixel}px`;
    this.cursor.style.visibility = "visible";
  }

  keypress(event: KeyboardEvent) {
    event.preventDefault();
    console.log(event);
    switch (event.key) {
      case "ArrowUp":
        this.cursorY--;
        this.positionCursor();
        if (event.ctrlKey || this.cursorY < this.viewTop) {
          this.viewTop--;
          this.redraw();
        }
        break;
      case "ArrowDown":
        this.cursorY++;
        this.positionCursor();
        if (event.ctrlKey || this.cursorY >= this.viewTop + this.viewHeight) {
          this.viewTop++;
          this.redraw();
        }
        break;
      case "ArrowLeft":
        this.cursorX--;
        this.positionCursor();
        if (event.ctrlKey || this.cursorX < this.viewLeft) {
          this.viewLeft--;
          this.redraw();
        }
        break;
      case "ArrowRight":
        this.cursorX++;
        this.positionCursor();
        if (event.ctrlKey || this.cursorX >= this.viewLeft + this.viewWidth) {
          this.viewLeft++;
          this.redraw();
        }
        break;
      case " ":
        this.rotate();
        break;
      case "Backspace":
      case "Delete":
        this.removeTile();
        break;
    }

  }


  // ----- events for mouse people

  click(event: MouseEvent) {
    console.log("click", event);
    let [ x, y ] = this.pixelToTile(event.x, event.y);
    this.positionCursor(x, y);
    event.preventDefault();
  }

  doubleClick(event: MouseEvent) {
    console.log("doubleclick", event);
    // "click" event already moved the cursor.
    this.rotate();
  }



  rotate() {
    const tile = this.tileGrid.getAt(this.cursorX, this.cursorY);
    if (!tile) return;
    tile.rotate();
    this.drawTile();
  }

  removeTile() {
    this.tileGrid.setAt(this.cursorX, this.cursorY, undefined);
    this.drawTile();
  }

  tileToPixel(x: number, y: number): [ number, number ] {
    return [
      this.xOffset + (x - this.viewLeft) * this.tileSize,
      this.yOffset + (y - this.viewTop) * this.tileSize
    ];
  }

  pixelToTile(x: number, y: number): [ number, number ] {
    return [
      this.viewLeft + Math.floor((x - this.xOffset) / this.tileSize),
      this.viewTop + Math.floor((y - this.yOffset) / this.tileSize)
    ];
  }
}
