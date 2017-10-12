import { Board } from "./game";
import { Tile } from "./models";
import { Light, PowerOnce, Wire, WireCorner, WireCross, WireOneWay } from "./tiles";

const TOOLBOX_TILES: { [id: string]: { new(): Tile } } = {
  "toolbox-wire-h": Wire,
  "toolbox-wire-oneway": WireOneWay,
  "toolbox-wire-corner": WireCorner,
  "toolbox-wire-cross": WireCross,
  "toolbox-power-once": PowerOnce,
  "toolbox-light": Light
};

export class Toolbox {
  toolbox: HTMLElement;
  grippy: HTMLElement;

  // when dragging the grippy thing around, what's the pointer offset?
  dragOffsetX: number = 0;
  dragOffsetY: number = 0;

  constructor(public board: Board) {
    this.toolbox = document.getElementById("toolbox") as HTMLElement;
    this.grippy = this.toolbox.getElementsByClassName("grippy")[0] as HTMLElement;

    // toolbox itself can be moved.
    this.grippy.addEventListener("dragstart", event => {
      console.log("dragstart", event);
      this.dragOffsetX = event.clientX - this.toolbox.offsetLeft;
      this.dragOffsetY = event.clientY - this.toolbox.offsetTop;
      this.board.dragActive(event => this.moveToolbox(event), event => this.dropToolbox(event));
    });
    this.grippy.addEventListener("dragend", event => this.board.dragEnded());

    // allow the toolbox itself to be a drag target, since it is over the board
    this.toolbox.addEventListener("dragover", event => this.board.dragover(event));

    for (const id in TOOLBOX_TILES) {
      const element = document.getElementById(id) as HTMLElement;
      element.addEventListener("dragstart", event => {
        console.log("dragstart", event);
        const tile = new TOOLBOX_TILES[id]();
        this.board.dragTile(event, tile);
      });
      element.addEventListener("dragend", event => this.board.dragEnded());
    }
  }

  moveToolbox(event: DragEvent) {
    // track the cursor.
    this.toolbox.style.right = "unset";
    this.toolbox.style.bottom = "unset";
    this.toolbox.style.left = `${event.clientX - this.dragOffsetX}px`;
    this.toolbox.style.top = `${event.clientY - this.dragOffsetY}px`;
  }

  dropToolbox(event: DragEvent) {
    // nothing to do. it has been moved.
  }
}
