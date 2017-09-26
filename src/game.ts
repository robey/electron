import { Electron } from "./electron";
import { loadTiles, Tile, TileCorner, TileWire } from "./tiles";
import { TileGrid } from "./tile_grid";
import { Toolbox } from "./toolbox";

const DEFAULT_TILE_SIZE = 40;

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
  electrons: Electron[] = [];

  board: HTMLElement;
  cursor: HTMLImageElement;

  tileStyle: CSSStyleDeclaration;

  // drag & drop support
  dragOnMove: ((event: DragEvent) => void) | null = null;
  dragOnDrop: ((event: DragEvent) => void) | null = null;

  constructor() {
    this.board = document.getElementById("board") as HTMLElement;
    this.cursor = document.getElementById("cursor") as HTMLImageElement;

    const cssRules = ([] as CSSRule[]).concat(...Array.from(document.styleSheets).map(sheet => {
      if (sheet instanceof CSSStyleSheet) return Array.from(sheet.cssRules);
      return [] as CSSRule[];
    })) as CSSStyleRule[];

    this.tileStyle = cssRules.filter(x => x.selectorText == ".tile")[0].style;

    loadTiles((event, tile) => this.dragTile(event, tile), (event, tile) => this.dragEnded());
    Electron.load();

    this.tileGrid = new TileGrid();
    this.toolbox = new Toolbox(this);

    // FIXME
    this.tileGrid.setAt(3, 1, new TileWire());
    this.tileGrid.setAt(4, 1, new TileCorner());
    this.tileGrid.setAt(4, 2, new TileWire().rotate());
    this.electrons.push(new Electron(3, 1));

    // support for "keypress" appears to have been silently removed from chrome.
    document.addEventListener("keydown", event => this.keypress(event));
    document.addEventListener("click", event => this.click(event));
    document.addEventListener("dblclick", event => this.doubleClick(event));

    // allow things to be dragged into the game board
    this.board.addEventListener("dragenter", event => this.dragenter(event));
    this.board.addEventListener("dragover", event => this.dragover(event));
    this.board.addEventListener("dragleave", event => this.dragleave(event));
    this.board.addEventListener("drop", event => this.drop(event));

    // the cursor should be a drag target, since it gets between the dragged item and the board.
    this.cursor.addEventListener("dragover", event => this.dragover(event));
    this.cursor.addEventListener("drop", event => this.drop(event));

    // hide the cursor when the mouse is over it, so drag will work. :(
    this.cursor.addEventListener("mouseover", event => {
      this.hideCursor();
      const checkLeave = (event: MouseEvent) => {
        const [ x, y ] = this.pixelToTile(event.clientX, event.clientY);
        if (x == this.cursorX && y == this.cursorY) return;
        // show cursor again.
        this.positionCursor();
        this.board.removeEventListener("mouseover", checkLeave);
        this.board.removeEventListener("mousemove", checkLeave);
      };
      this.board.addEventListener("mouseover", checkLeave);
      this.board.addEventListener("mousemove", checkLeave);
    });

    this.resize();

    const robey1 = async () => {
      await this.electrons[0].setPulsing(false);
      await this.electrons[0].pushTo(40, 0, 1000);
      this.electrons[0].draw(240 + this.xOffset, 120 + this.yOffset);
      await this.electrons[0].setPulsing(true);
      setTimeout(() => robey2(), 2000);
    };

    const robey2 = async () => {
      await this.electrons[0].setPulsing(false);
      await this.electrons[0].pushTo(-40, 0, 1000);
      this.electrons[0].draw(200 + this.xOffset, 120 + this.yOffset);
      await this.electrons[0].setPulsing(true);
      setTimeout(() => robey1(), 2000);
    };

    setTimeout(() => robey1(), 2000);
  }

  resize() {
    this.tileStyle.width = `${this.tileSize}px`;
    this.tileStyle.height = `${this.tileSize}px`;
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

    this.electrons.forEach(e => {
      const [ xPixel, yPixel ] = this.tileToPixel(e.x, e.y);
      this.board.appendChild(e.draw(xPixel, yPixel));
    });
    this.positionCursor();
  }

  drawTile(x?: number, y?: number) {
    if (x === undefined) x = this.cursorX;
    if (y === undefined) y = this.cursorY;
    const [ xPixel, yPixel ] = this.tileToPixel(x, y);
    const tile = this.tileGrid.getAt(x, y);
    if (tile) {
      const element = tile.drawAt(xPixel, yPixel);
      this.board.appendChild(element);
    }
  }

  hideCursor() {
    this.cursor.style.visibility = "hidden";
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


  // ----- events for drag & drop

  // draggable objects call this on "dragstart" to let us know we should
  // accept the drag, and tell us how to move/receive it.
  dragActive(onMove: (event: DragEvent) => void, onDrop: (event: DragEvent) => void) {
    this.dragOnMove = onMove;
    this.dragOnDrop = onDrop;
  }

  dragEnded() {
    this.dragOnMove = null;
    this.dragOnDrop = null;
  }

  dragenter(event: DragEvent) {
    console.log("dragenter", this.dragOnMove != null, event);
    if (this.dragOnMove) event.preventDefault();
  }

  dragleave(event: DragEvent) {
    console.log("dragleave", event);
  }

  dragover(event: DragEvent) {
    if (!this.dragOnMove) return;
    this.dragOnMove(event);
    event.preventDefault();
  }

  drop(event: DragEvent) {
    console.log("drop", event);
    if (!this.dragOnDrop) return;
    this.dragOnDrop(event);
    this.dragEnded();
    event.preventDefault();
  }

  dragTile(event: DragEvent, tile: Tile) {
    const dragOffsetX = event.clientX - (event.target as HTMLElement).offsetLeft;
    const dragOffsetY = event.clientY - (event.target as HTMLElement).offsetTop;
    let [ x, y ] = this.pixelToTile(event.clientX, event.clientY);
    this.tileGrid.setAt(x, y, undefined);

    this.dragActive(
      event => {
        let [ x, y ] = this.pixelToTile(event.clientX, event.clientY);
        this.positionCursor(x, y);
        this.board.appendChild(tile.drawAt(event.clientX - dragOffsetX, event.clientY - dragOffsetY));
      },
      event => {
        const [ x, y ] = this.pixelToTile(event.clientX, event.clientY);
        this.positionCursor(x, y);
        this.putTile(tile);
      }
    );
  }

  rotate() {
    const tile = this.tileGrid.getAt(this.cursorX, this.cursorY);
    if (!tile) return;
    this.board.removeChild(tile.element);
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
    if (oldTile) this.board.removeChild(oldTile.element);
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
