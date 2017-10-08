import { calculateTrueOffset } from "./common/dom";
import { nextFrame } from "./common/events";
import { Animation } from "./animate";
import { Electron } from "./electron";
import { setupKeyboard } from "./keyboard";
import { ActionType, Orientation, Tile } from "./models";
import { setupMouse } from "./mouse";
import { loadGame, saveGame } from "./storage";
import { loadTiles, moveTile, setTileDragEvents, Wire, WireCorner } from "./tiles";
import { TileGrid } from "./tile_grid";
import { Toolbox } from "./toolbox";

const DEFAULT_TILE_SIZE = 40;
const DEFAULT_SPEED = 500;

let board: Board;

window.addEventListener("DOMContentLoaded", async () => {
  board = new Board();
  (document as any).board = board;
});

window.addEventListener("load", async () => {
  await board.init();
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

  speed = DEFAULT_SPEED;
  tileGrid: TileGrid;
  toolbox: Toolbox;
  animation = new Animation(this);

  div: HTMLElement;
  cursor: HTMLImageElement;
  speedDisplay: HTMLElement;
  buttonSlower: HTMLElement;
  buttonFaster: HTMLElement;
  buttonPlay: HTMLElement;

  tileStyle: CSSStyleDeclaration;

  // drag & drop support
  dragOnMove: ((event: DragEvent) => void) | null = null;
  dragOnDrop: ((event: DragEvent) => void) | null = null;

  constructor() {
    this.div = document.getElementById("board") as HTMLElement;
    this.cursor = document.getElementById("cursor") as HTMLImageElement;
    this.speedDisplay = document.getElementById("display-speed") as HTMLElement;
    this.buttonSlower = document.getElementById("button-slower") as HTMLElement;
    this.buttonFaster = document.getElementById("button-faster") as HTMLElement;
    this.buttonPlay = document.getElementById("button-play") as HTMLElement;

    const cssRules = ([] as CSSRule[]).concat(...Array.from(document.styleSheets).map(sheet => {
      if (sheet instanceof CSSStyleSheet) return Array.from(sheet.cssRules);
      return [] as CSSRule[];
    })) as CSSStyleRule[];

    this.tileStyle = cssRules.filter(x => x.selectorText == ".tile")[0].style;
  }

  async init(): Promise<void> {
    setTileDragEvents((event, tile) => this.dragTile(event, tile), (event, tile) => this.dragEnded());
    await loadTiles();
    Electron.load();

    this.tileGrid = new TileGrid();
    this.toolbox = new Toolbox(this);
    this.load();
    // draw the speed display:
    this.setSpeed(this.speed);

    // FIXME
    this.animation.electrons.push(new Electron(3, 1));

    setupKeyboard(this);
    setupMouse(this);

    this.resize();
  }

  setSpeed(speed: number) {
    this.speed = speed;
    const hz = Math.round(1000 / speed);
    this.speedDisplay.textContent = `${hz}Hz`;
    this.save();
  }

  faster() {
    if (this.speed > 33) this.setSpeed(this.speed / 2);
  }

  slower() {
    if (this.speed < 1000) this.setSpeed(this.speed * 2);
  }


  // ----- drawing

  resize() {
    this.tileStyle.width = `${this.tileSize}px`;
    this.tileStyle.height = `${this.tileSize}px`;
    const width = this.div.clientWidth;
    const height = this.div.clientHeight;
    this.viewWidth = Math.floor(width / this.tileSize);
    this.viewHeight = Math.floor(height / this.tileSize);
    this.xOffset = (width - this.viewWidth * this.tileSize) / 2;
    this.yOffset = (height - this.viewHeight * this.tileSize) / 2;

    this.redraw();
  }

  redraw() {
    while (this.div.firstChild) this.div.removeChild(this.div.firstChild);

    // overlap by 1 on each side, to make it bleed the margins.
    for (let y = this.viewTop - 1; y <= this.viewTop + this.viewHeight; y++) {
      for (let x = this.viewLeft - 1; x <= this.viewLeft + this.viewWidth; x++) {
        this.drawTile(x, y);
      }
    }

    this.animation.redraw();
    this.positionCursor();
  }

  drawTile(x?: number, y?: number) {
    if (x === undefined) x = this.cursorX;
    if (y === undefined) y = this.cursorY;
    const [ xPixel, yPixel ] = this.tileToPixel(x, y);
    const tile = this.tileGrid.getAt(x, y);
    if (tile) {
      this.div.appendChild(moveTile(tile, xPixel, yPixel));
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
    const [ xOffset, yOffset ] = calculateTrueOffset(event.target as HTMLElement);
    const dragOffsetX = event.clientX - xOffset;
    const dragOffsetY = event.clientY - yOffset;
    let [ x, y ] = this.pixelToTile(event.clientX, event.clientY);
    this.tileGrid.setAt(x, y, undefined);

    this.dragActive(
      event => {
        let [ x, y ] = this.pixelToTile(event.clientX, event.clientY);
        this.positionCursor(x, y);
        this.div.appendChild(moveTile(tile, event.clientX - dragOffsetX, event.clientY - dragOffsetY));
      },
      event => {
        const [ x, y ] = this.pixelToTile(event.clientX, event.clientY);
        this.positionCursor(x, y);
        this.putTile(tile);
      }
    );
  }


  // ----- operations

  rotate() {
    const tile = this.tileGrid.getAt(this.cursorX, this.cursorY);
    if (!tile) return;
    this.div.removeChild(tile.element);
    tile.rotate();
    this.drawTile();
    this.save();
  }

  removeTile() {
    this.putTile(undefined);
    this.save();
  }

  putTile(tile: Tile | undefined, x?: number, y?: number) {
    if (x === undefined) x = this.cursorX;
    if (y === undefined) y = this.cursorY;
    const oldTile = this.tileGrid.getAt(x, y);
    if (oldTile) this.div.removeChild(oldTile.element);
    this.tileGrid.setAt(x, y, tile);
    this.drawTile(x, y);
    this.save();
  }

  load() {
    const savedBoard = localStorage.getItem("saved-board");
    if (savedBoard) loadGame(savedBoard, this.tileGrid);
    const prefsString = localStorage.getItem("saved-prefs");
    if (prefsString) {
      try {
        const prefs = JSON.parse(prefsString);
        this.setSpeed(prefs.speed || DEFAULT_SPEED);
      } catch (error) {
        console.log("Invalid prefs", prefsString);
      }
    }
  }

  save() {
    localStorage.setItem("saved-board", saveGame(this.tileGrid));
    localStorage.setItem("saved-prefs", JSON.stringify({ speed: this.speed }));
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
