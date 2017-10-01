import { Electron } from "./electron";
import { nextFrame } from "./events";
import { ActionType, Orientation, Tile } from "./models";
import { loadTiles, TileWire, TileWireCorner } from "./tiles";
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

  running = false;
  speed = 500;
  tileGrid: TileGrid;
  toolbox: Toolbox;
  electrons: Electron[] = [];

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

    loadTiles((event, tile) => this.dragTile(event, tile), (event, tile) => this.dragEnded());
    Electron.load();

    this.tileGrid = new TileGrid();
    this.toolbox = new Toolbox(this);
    this.setSpeed(this.speed);

    // FIXME
    this.tileGrid.setAt(3, 1, new TileWire());
    this.tileGrid.setAt(4, 1, new TileWireCorner());
    this.tileGrid.setAt(4, 2, new TileWire().rotate());
    this.electrons.push(new Electron(3, 1));
    (document.getElementById("display-speed") as HTMLElement).textContent = "2Hz";

    // support for "keypress" appears to have been silently removed from chrome.
    document.addEventListener("keydown", event => this.keypress(event));
    document.addEventListener("click", event => this.click(event));
    document.addEventListener("dblclick", event => this.doubleClick(event));

    // allow things to be dragged into the game board
    this.div.addEventListener("dragenter", event => this.dragenter(event));
    this.div.addEventListener("dragover", event => this.dragover(event));
    this.div.addEventListener("dragleave", event => this.dragleave(event));
    this.div.addEventListener("drop", event => this.drop(event));

    // buttons
    this.buttonFaster.addEventListener("click", event => {
      this.faster();
      event.preventDefault();
    });
    this.buttonSlower.addEventListener("click", event => {
      this.slower();
      event.preventDefault();
    });
    this.buttonPlay.addEventListener("click", event => {
      this.play();
      event.preventDefault();
    });

    this.resize();
  }

  setSpeed(speed: number) {
    this.speed = speed;
    const hz = Math.round(1000 / speed);
    this.speedDisplay.textContent = `${hz}Hz`;
  }

  start() {
    console.log("start!");
    if (this.running) return this.stop();
    this.running = true;
    setTimeout(() => this.play(), 10);
  }

  play() {
    try {
      if (!this.running) return;
      if (this.electrons.length == 0) {
        this.stop();
        return;
      }
      this.tick(this.speed).then(() => this.play());
    } catch (error) {
      console.log(error);
    }
  }

  stop() {
    console.log("stop!");
    this.running = false;
    if (this.electrons.length == 0) {
      this.electrons.push(new Electron(3, 1));
      this.drawElectron(this.electrons[0]);
    }
  }

  faster() {
    if (this.speed > 33) this.setSpeed(this.speed / 2);
  }

  slower() {
    if (this.speed < 1000) this.setSpeed(this.speed * 2);
  }

  async tick(speed: number): Promise<void> {
    console.log("tick:", Date.now(), this.electrons.map(e => e.toString()).join(", "));
    this.electrons.filter(e => !e.alive).map(e => {
      if (this.div == e.element.parentNode) this.div.removeChild(e.element);
    });
    this.electrons = this.electrons.filter(e => e.alive);

    await Promise.all(this.electrons.map(async e => {
      const tile = this.tileGrid.getAt(e.x, e.y);
      if (!tile) return this.removeElectron(e, speed);

      const action = tile.action(e.orientation);
      switch (action.type) {
        case ActionType.DIE:
          return this.removeElectron(e, speed);
        case ActionType.MOVE:
          return this.moveElectron(e, action.orientation, speed);
      }
    }));

    await nextFrame();
  }

  async removeElectron(electron: Electron, speed: number): Promise<void> {
    electron.alive = false;
    await electron.vanish(speed);
    this.div.removeChild(electron.element);
  }

  async moveElectron(electron: Electron, orientation: Orientation, speed: number): Promise<void> {
    electron.orientation = orientation;
    switch (orientation) {
      case Orientation.NORTH:
        electron.y--;
        await electron.pushTo(0, -this.tileSize, speed);
        break;
      case Orientation.EAST:
        electron.x++;
        await electron.pushTo(this.tileSize, 0, speed);
        break;
      case Orientation.SOUTH:
        electron.y++;
        await electron.pushTo(0, this.tileSize, speed);
        break;
      case Orientation.WEST:
        electron.x--;
        await electron.pushTo(-this.tileSize, 0, speed);
        break;
    }
    this.drawElectron(electron);
  }

  async drawElectron(electron: Electron): Promise<void> {
    const [ xPixel, yPixel ] = this.tileToPixel(electron.x, electron.y);
    this.div.appendChild(electron.draw(xPixel, yPixel));
  }

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

    this.electrons.forEach(e => this.drawElectron(e));
    this.positionCursor();
  }

  drawTile(x?: number, y?: number) {
    if (x === undefined) x = this.cursorX;
    if (y === undefined) y = this.cursorY;
    const [ xPixel, yPixel ] = this.tileToPixel(x, y);
    const tile = this.tileGrid.getAt(x, y);
    if (tile) {
      const element = tile.drawAt(xPixel, yPixel);
      this.div.appendChild(element);
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
      case "Enter":
        this.start();
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
        this.div.appendChild(tile.drawAt(event.clientX - dragOffsetX, event.clientY - dragOffsetY));
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
    this.div.removeChild(tile.element);
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
    if (oldTile) this.div.removeChild(oldTile.element);
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
