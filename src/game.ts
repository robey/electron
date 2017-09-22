import { Tile, TileCorner, TileWire } from "./tiles";
import { TileGrid } from "./tile_grid";
import { Toolbox } from "./toolbox";

const DEFAULT_TILE_SIZE = 50;

window.addEventListener("DOMContentLoaded", async () => {
});

window.addEventListener("load", async () => {
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

  // padding from canvas corner to page
  xOffset = 0;
  yOffset = 0;

  tileGrid: TileGrid;
  toolbox: Toolbox;

  board: HTMLElement;
  cursor: HTMLImageElement;

  tileStyle: CSSStyleDeclaration;

  constructor() {
    this.board = document.getElementById("board") as HTMLElement;
    this.cursor = document.getElementById("cursor") as HTMLImageElement;

    const cssRules = ([] as CSSRule[]).concat(...Array.from(document.styleSheets).map(sheet => {
      if (sheet instanceof CSSStyleSheet) return Array.from(sheet.cssRules);
      return [] as CSSRule[];
    })) as CSSStyleRule[];

    this.tileStyle = cssRules.filter(x => x.selectorText == ".tile")[0].style;

    this.tileGrid = new TileGrid();
    this.toolbox = new Toolbox(this);

    // FIXME
    this.tileGrid.setAt(3, 1, new TileWire().rotate());
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
    const width = this.board.clientWidth;
    const height = this.board.clientHeight;
    this.viewWidth = Math.floor(width / this.tileSize);
    this.viewHeight = Math.floor(height / this.tileSize);
    this.xOffset = (width - this.viewWidth * this.tileSize) / 2;
    this.yOffset = (height - this.viewHeight * this.tileSize) / 2;

    this.redraw();
  }

  redraw() {
    while (this.board.firstChild) this.board.removeChild(this.board.firstChild);

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
    const tile = this.tileGrid.getAt(x, y);
    if (tile) {
      this.board.appendChild(tile.drawAt(xPixel, yPixel));
    }
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
    console.log(event);
    switch (event.key) {
      case "ArrowUp":
        this.cursorY--;
        this.positionCursor();
        if (event.ctrlKey || this.cursorY < this.viewTop) {
          this.viewTop--;
          this.redraw();
        }
        event.preventDefault();
        break;
      case "ArrowDown":
        this.cursorY++;
        this.positionCursor();
        if (event.ctrlKey || this.cursorY >= this.viewTop + this.viewHeight) {
          this.viewTop++;
          this.redraw();
        }
        event.preventDefault();
        break;
      case "ArrowLeft":
        this.cursorX--;
        this.positionCursor();
        if (event.ctrlKey || this.cursorX < this.viewLeft) {
          this.viewLeft--;
          this.redraw();
        }
        event.preventDefault();
        break;
      case "ArrowRight":
        this.cursorX++;
        this.positionCursor();
        if (event.ctrlKey || this.cursorX >= this.viewLeft + this.viewWidth) {
          this.viewLeft++;
          this.redraw();
        }
        event.preventDefault();
        break;
      case " ":
        this.rotate();
        event.preventDefault();
        break;
      case "Backspace":
      case "Delete":
        this.removeTile();
        event.preventDefault();
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
    this.putTile(undefined);
  }

  putTile(tile: Tile | undefined, x?: number, y?: number) {
    if (x === undefined) x = this.cursorX;
    if (y === undefined) y = this.cursorY;
    const oldTile = this.tileGrid.getAt(x, y);
    if (oldTile) {
      const image = oldTile.hide();
      if (image) this.board.removeChild(image);
    }
    this.tileGrid.setAt(x, y, tile);
    this.drawTile(x, y);
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
