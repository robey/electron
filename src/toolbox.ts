import { Board } from "./game";
import { Tile, TileCorner, TileWire } from "./tiles";

const TOOLBOX_TILES: { [id: string]: { new(): Tile } } = {
  "toolbox-wire-h": TileWire,
  "toolbox-wire-corner": TileCorner
};

enum DragType {
  NONE,
  TOOLBOX,
  TILE
}

export class Toolbox {
  toolbox: HTMLElement;
  grippy: HTMLElement;

  // what is being dragged around?
  dragType = DragType.NONE;
  dragTile: Tile | null = null;

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
      this.dragType = DragType.TOOLBOX;
      this.dragOffsetX = event.clientX - this.toolbox.offsetLeft;
      this.dragOffsetY = event.clientY - this.toolbox.offsetTop;
    });
    this.grippy.addEventListener("dragend", event => this.cleanupDrag());

    // allow the toolbox itself, and the cursor, to be a drag target.
    this.toolbox.addEventListener("dragover", event => this.dragover(event));
    board.cursor.addEventListener("dragover", event => this.dragover(event));
    board.cursor.addEventListener("drop", event => this.drop(event));

    board.board.addEventListener("dragenter", event => this.dragenter(event));
    board.board.addEventListener("dragover", event => this.dragover(event));
    board.board.addEventListener("dragleave", event => this.dragleave(event));
    board.board.addEventListener("drop", event => this.drop(event));

    for (const id in TOOLBOX_TILES) {
      const element = document.getElementById(id) as HTMLElement;
      element.addEventListener("dragstart", event => {
        console.log("dragstart", event);
        this.dragType = DragType.TILE;
        this.dragTile = new TOOLBOX_TILES[id]();
      });
      element.addEventListener("dragend", event => {
        console.log("dragend", event);
        this.dragType = DragType.NONE;
        this.dragTile = null;
        this.cleanupDrag();
      });
    }

  }

  dragenter(event: DragEvent) {
    console.log("dragenter", this.dragType, this.dragTile, event);
    if (this.dragType != DragType.NONE) event.preventDefault();
  }

  dragleave(event: DragEvent) {
    console.log("dragleave", event);
  }

  dragover(event: DragEvent) {
    switch (this.dragType) {
      case DragType.NONE:
        return;
      case DragType.TOOLBOX:
        // track the cursor.
        const toolbox = document.getElementById("toolbox") as HTMLElement;
        toolbox.style.right = "unset";
        toolbox.style.bottom = "unset";
        toolbox.style.left = `${event.clientX - this.dragOffsetX}px`;
        toolbox.style.top = `${event.clientY - this.dragOffsetY}px`;
        event.preventDefault();
        return;
      case DragType.TILE:
        const oldX = this.dragX, oldY = this.dragY;
        [ this.dragX, this.dragY ] = this.board.pixelToTile(event.clientX, event.clientY);
        if (this.board.cursorX != oldX || this.board.cursorY != oldY) {
          if (oldX != null && oldY != null) this.board.drawTile(oldX, oldY);
          this.board.positionCursor(this.dragX, this.dragY);
        }
        event.preventDefault();
        return;
    }
  }

  drop(event: DragEvent) {
    console.log("drop", event);
    switch (this.dragType) {
      case DragType.NONE:
        return;
      case DragType.TOOLBOX:
        // just clean up.
        this.cleanupDrag();
        event.preventDefault();
        return;
      case DragType.TILE:
        const [ x, y ] = this.board.pixelToTile(event.clientX, event.clientY);
        this.board.positionCursor(x, y);
        if (this.dragTile) this.board.putTile(this.dragTile);
        this.cleanupDrag();
        event.preventDefault();
    }
  }

  cleanupDrag() {
    this.dragType = DragType.NONE;
    this.dragTile = null;
  }
}
