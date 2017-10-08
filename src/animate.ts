import { nextFrame } from "./common/events";
import { Board } from "./game";
import { Electron } from "./electron";
import { ActionType, Orientation } from "./models";

export class Animation {
  running = false;
  electrons: Electron[] = [];

  constructor(public board: Board) {
    // pass
  }

  start() {
    console.log("start!");
    if (this.running) return this.stop();
    this.running = true;
    this.board.hideCursor();
    setTimeout(() => this.play(), 10);
  }

  play() {
    try {
      if (!this.running) return;
      if (this.electrons.length == 0) {
        this.stop();
        return;
      }
      this.tick(this.board.speed).then(() => this.play());
    } catch (error) {
      console.log(error);
    }
  }

  stop() {
    console.log("stop!");
    this.running = false;
    this.board.positionCursor();
    if (this.electrons.length == 0) {
      this.electrons.push(new Electron(3, 1));
      this.drawElectron(this.electrons[0]);
    }
  }

  async tick(speed: number): Promise<void> {
    console.log("tick:", Date.now(), this.electrons.map(e => e.toString()).join(", "));
    // this.electrons.filter(e => !e.alive).map(e => {
    //   if (this.div == e.element.parentNode) this.div.removeChild(e.element);
    // });
    this.electrons = this.electrons.filter(e => e.alive);

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

    await nextFrame();
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
