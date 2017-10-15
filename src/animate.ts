import { moveToPixel } from "./common/dom";
import { FRAME_MSEC, nextFrame, once } from "./common/events";
import { Board } from "./game";
import { Electron } from "./electron";
import { Action, ActionType, ElectronAction, ElectronActionType, Orientation, Tile } from "./models";

// how many ticks will we allow with no electrons in play?
const MAX_DEAD_TICKS = 25;

// any delay less than this, and don't bother trying to animate.
const MIN_ANIMATE_SPEED = 50;

export class Animation {
  running = false;
  deadTicks = 0;

  electrons: Electron[] = [];
  activeTiles: Tile[] = [];

  // electrons generated during a tick, waiting to become real:
  newElectrons: Electron[] = [];

  // long-running animations (transitions) that will run concurrently during this tick:
  animations: Array<Promise<void>> = [];

  constructor(public board: Board) {
    // pass
  }

  start() {
    console.log("start!");
    if (this.running) return this.stop();

    for (const t of this.board.tileGrid.filterTiles(t => t.reset !== undefined)) if (t.reset) t.reset();
    this.activeTiles = [...this.board.tileGrid.filterTiles(t => t.activated || false)];
    this.board.redraw();

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
    this.activeTiles = this.activeTiles.filter(tile => tile.activated);
    this.electrons = this.electrons.filter(e => e.alive);

    this.activeTiles.forEach(tile => {
      if (tile.onTick) this.processAction(tile, tile.onTick(), speed);
    });
    this.electrons.forEach(e => this.processElectron(e, speed));
    await Promise.all(this.animations);

    this.newElectrons.forEach(e => {
      this.drawElectron(e);
      this.electrons.push(e);
    });

    this.newElectrons.splice(0, this.newElectrons.length);
    this.animations.splice(0, this.animations.length);
    await nextFrame();
  }

  processAction(tile: Tile, action: Action, speed: number) {
    switch (action.type) {
      case ActionType.IDLE:
        break;
      case ActionType.SPAWN:
        const e = new Electron(tile.x, tile.y);
        e.orientation = action.orientation;
        this.newElectrons.push(e);
        break;
      case ActionType.CHANGE_IMAGE:
        if (action.oldImage && action.newImage) {
          this.animations.push(this.changeImage(tile, action.oldImage, action.newImage, speed));
        }
        break;
    }
  }

  processElectron(electron: Electron, speed: number) {
    const tile = this.board.tileGrid.getAt(electron.x, electron.y);
    const electronAction = tile && tile.onElectron ? tile.onElectron(electron.orientation) : ElectronAction.die;

    switch (electronAction.type) {
      case ElectronActionType.DIE:
        this.animations.push(this.removeElectron(electron, speed));
        break;
      case ElectronActionType.MOVE:
        this.animations.push(this.moveElectron(electron, electronAction.orientation, speed));
        break;
    }

    if (electronAction.action && tile) {
      this.processAction(tile, electronAction.action, speed);
      if (tile.activated) {
        this.activeTiles = this.activeTiles.filter(t => t !== tile);
        this.activeTiles.push(tile);
      }
    }
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
    await this.vanish(electron.element, speed);
    this.board.div.removeChild(electron.element);
  }

  async moveElectron(electron: Electron, orientation: Orientation, speed: number): Promise<void> {
    electron.orientation = orientation;
    switch (orientation) {
      case Orientation.NORTH:
        electron.y--;
        await this.pushTo(electron.element, 0, -this.board.tileSize, speed);
        break;
      case Orientation.EAST:
        electron.x++;
        await this.pushTo(electron.element, this.board.tileSize, 0, speed);
        break;
      case Orientation.SOUTH:
        electron.y++;
        await this.pushTo(electron.element, 0, this.board.tileSize, speed);
        break;
      case Orientation.WEST:
        electron.x--;
        await this.pushTo(electron.element, -this.board.tileSize, 0, speed);
        break;
    }
    this.drawElectron(electron);
  }

  async pushTo(image: HTMLElement, x: number, y: number, speed: number): Promise<void> {
    if (speed < MIN_ANIMATE_SPEED) return;
    image.style.transition = `transform ${speed / 1000}s linear`;
    image.style.transform = `translate(${x}px, ${y}px)`;
    await once(image, "transitionend", (event: TransitionEvent) => {
      image.style.transition = null;
      image.style.transform = null;
    });
  }

  async vanish(image: HTMLElement, speed: number): Promise<void> {
    if (speed < MIN_ANIMATE_SPEED) return;
    image.style.transition = `transform ${speed / 1000}s`;
    image.style.transform = `scale(0)`;
    await once(image, "transitionend", (event: TransitionEvent) => {
      image.style.transition = null;
      image.style.transform = null;
    });
  }

  async changeImage(tile: Tile, oldImage: HTMLElement, newImage: HTMLElement, speed: number): Promise<void> {
    const [ xPixel, yPixel ] = this.board.tileToPixel(tile.x, tile.y);
    this.board.div.appendChild(newImage);
    moveToPixel(oldImage, xPixel, yPixel);
    moveToPixel(newImage, xPixel, yPixel);
    if (speed >= MIN_ANIMATE_SPEED) {
      newImage.style.zIndex = "1";
      newImage.style.opacity = "0";
      newImage.style.transition = `opacity ${(speed - FRAME_MSEC) / 1000}s ease-in-out`;
      // animate!
      await nextFrame();
      newImage.style.opacity = "1";
      await once(newImage, "transitionend", (event: TransitionEvent) => {
        newImage.style.transition = null;
      });
      newImage.style.zIndex = "0";
    }
    this.board.div.removeChild(oldImage);
  }
}
