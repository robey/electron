import { Board } from "./game";
import { Tile, TileCorner, TileWire } from "./tiles";

const TOOLBOX_TILES: { [id: string]: { new(): Tile } } = {
  "toolbox-wire-h": TileWire,
  "toolbox-wire-corner": TileCorner
};

export class Toolbox {
  toolbox: HTMLElement;
  grippy: HTMLElement;

  // what is being dragged around?
  dragElement: HTMLElement | Tile | null = null;

  // tile coords of current drop target
  dragX: number | null = null;
  dragY: number | null = null;

  // when dragging the grippy thing around, what's the pointer offset?
  dragOffsetX: number = 0;
  dragOffsetY: number = 0;

  constructor(public board: Board) {
    this.toolbox = document.getElementById("toolbox") as HTMLElement;
    this.grippy = this.toolbox.getElementsByClassName("grippy")[0] as HTMLElement;

    // toolbox itself can be moved.
    this.grippy.addEventListener("dragstart", event => {
      console.log("dragstart", event);
      this.dragElement = this.toolbox;
      this.dragOffsetX = event.clientX - this.toolbox.offsetLeft;
      this.dragOffsetY = event.clientY - this.toolbox.offsetTop;
    });

    this.toolbox.addEventListener("dragover", event => this.dragover(event));

    board.canvasElement.addEventListener("dragenter", event => this.dragenter(event));
    board.canvasElement.addEventListener("dragover", event => this.dragover(event));
    board.canvasElement.addEventListener("dragleave", event => this.dragleave(event));
    board.canvasElement.addEventListener("drop", event => this.drop(event));

    for (const id in TOOLBOX_TILES) {
      const element = document.getElementById(id) as HTMLElement;
      element.addEventListener("dragstart", event => {
        console.log("dragstart", event);
        this.dragElement = new TOOLBOX_TILES[id]();
      });
      element.addEventListener("dragend", event => {
        console.log("dragend", event);
        this.dragElement = null;
        this.cleanupDragCursor();
      });
    }

  }

  dragenter(event: DragEvent) {
    console.log("dragenter", this.dragElement, event);
    if (this.dragElement) event.preventDefault();
  }

  dragleave(event: DragEvent) {
    console.log("dragleave", event);
    this.cleanupDragCursor();
  }

  dragover(event: DragEvent) {
    if (!this.dragElement) return;
    event.preventDefault();
    if (this.dragElement == this.toolbox) {
      const toolbox = document.getElementById("toolbox") as HTMLElement;
      toolbox.style.right = "unset";
      toolbox.style.bottom = "unset";
      toolbox.style.left = `${event.clientX - this.dragOffsetX}px`;
      toolbox.style.top = `${event.clientY - this.dragOffsetY}px`;
      return;
    }

    const oldX = this.dragX, oldY = this.dragY;
    [ this.dragX, this.dragY ] = this.board.pixelToTile(event.clientX, event.clientY);
    if (this.board.cursorX != oldX || this.board.cursorY != oldY) {
      if (oldX != null && oldY != null) this.board.drawTile(oldX, oldY);
      this.board.drawCursorAt(this.dragX, this.dragY);
    }
  }

  drop(event: DragEvent) {
    console.log("drop", event);
    this.cleanupDragCursor();
    if (!(this.dragElement instanceof HTMLElement)) {
      const [ x, y ] = this.board.pixelToTile(event.clientX, event.clientY);
      this.board.positionCursor(x, y);
      if (this.dragElement) {
        this.board.tileGrid.setAt(x, y, this.dragElement);
        this.board.drawTile(x, y);
      }
    }
    event.preventDefault();
  }

  // erase any cursor we've been drawing over a drop target tile.
  cleanupDragCursor() {
    if (this.dragX != null && this.dragY != null) this.board.drawTile(this.dragX, this.dragY);
    this.dragX = this.dragY = null;
  }

}
