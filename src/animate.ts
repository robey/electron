import { nextFrame } from "./common/events";
import { Board } from "./game";
import { Electron } from "./electron";
import { Action, ActionType, Orientation, TickAction, TickActionType, Tile } from "./models";

// how many ticks will we allow with no electrons in play?
const MAX_DEAD_TICKS = 10;

export class Animation {
  running = false;
  deadTicks = 0;

  electrons: Electron[] = [];
  tickTiles: Tile[] = [];

  constructor(public board: Board) {
    // pass
  }

  start() {
    console.log("start!");
    if (this.running) return this.stop();

    for (const t of this.board.tileGrid.filterTiles(t => t.reset !== undefined)) if (t.reset) t.reset();
    this.tickTiles = [...this.board.tileGrid.filterTiles(t => t.onTick !== undefined)];

    this.running = true;
    this.board.hideCursor();
    setTimeout(() => this.play(), 10);
  }

  play() {
    try {
      if (!this.running) return;
      if (this.electrons.length == 0) {
        this.deadTicks++;
        if (this.deadTicks > MAX_DEAD_TICKS) {
          this.stop();
          return;
        }
      } else {
        this.deadTicks = 0;
      }
      this.tick(this.board.speed).then(() => this.play());
    } catch (error) {
      console.log(error);
    }
  }

  stop() {
    console.log("stop!");
    this.running = false;
    this.deadTicks = 0;
    this.board.positionCursor();
  }

  async tick(speed: number): Promise<void> {
    console.log("tick:", Date.now(), this.electrons.map(e => e.toString()).join(", "));
    this.electrons = this.electrons.filter(e => e.alive);

    const newElectrons = this.probeTiles();
    await this.moveLivingElectrons(speed);
    newElectrons.forEach(e => {
      this.drawElectron(e);
      this.electrons.push(e);
    });

    await nextFrame();
  }

  probeTiles(): Electron[] {
    const newElectrons: Electron[] = [];
    const stopPolling: Tile[] = [];

    this.tickTiles.forEach(async tile => {
      if (!tile.onTick) return;
      const action = tile.onTick();
      switch (action.type) {
        case TickActionType.IDLE:
          break;
        case TickActionType.STOP_POLLING:
          stopPolling.push(tile);
          break;
        case TickActionType.SPAWN:
          const e = new Electron(tile.x, tile.y);
          e.orientation = action.orientation;
          newElectrons.push(e);
          break;
      }
    });

    if (stopPolling.length > 0) {
      this.tickTiles = this.tickTiles.filter(tile => stopPolling.indexOf(tile) < 0);
    }

    return newElectrons;
  }

  async moveLivingElectrons(speed: number): Promise<void> {
    await Promise.all(this.electrons.map(async e => {
      const tile = this.board.tileGrid.getAt(e.x, e.y);
      if (!tile) return this.removeElectron(e, speed);

      const action = tile.action(e.orientation);
      switch (action.type) {
        case ActionType.DIE:
          return this.removeElectron(e, speed);
        case ActionType.MOVE:
          return this.moveElectron(e, action.orientation, speed);
      }
    }));
  }

  redraw() {
    this.electrons.forEach(e => this.drawElectron(e));
  }

  async drawElectron(electron: Electron): Promise<void> {
    const [ xPixel, yPixel ] = this.board.tileToPixel(electron.x, electron.y);
    this.board.div.appendChild(electron.draw(xPixel, yPixel));
  }

  async removeElectron(electron: Electron, speed: number): Promise<void> {
    electron.alive = false;
    await electron.vanish(speed);
    this.board.div.removeChild(electron.element);
  }

  async moveElectron(electron: Electron, orientation: Orientation, speed: number): Promise<void> {
    electron.orientation = orientation;
    switch (orientation) {
      case Orientation.NORTH:
        electron.y--;
        if (speed > 50) await electron.pushTo(0, -this.board.tileSize, speed);
        break;
      case Orientation.EAST:
        electron.x++;
        if (speed > 50) await electron.pushTo(this.board.tileSize, 0, speed);
        break;
      case Orientation.SOUTH:
        electron.y++;
        if (speed > 50) await electron.pushTo(0, this.board.tileSize, speed);
        break;
      case Orientation.WEST:
        electron.x--;
        if (speed > 50) await electron.pushTo(-this.board.tileSize, 0, speed);
        break;
    }
    this.drawElectron(electron);
  }
}
