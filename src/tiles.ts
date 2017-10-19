import { Tile } from "./models";

import { setTileDragEvents, TileResources } from "./tiles/resources";
export { setTileDragEvents, TileResources };

import { Light } from "./tiles/light";
import { PowerOnce } from "./tiles/power";
import { Switch } from "./tiles/switch";
import { Wire, WireCorner, WireCross, WireOneWay, WireSplit } from "./tiles/wires";
export { Light, PowerOnce, Switch, Wire, WireCorner, WireCross, WireOneWay, WireSplit };

interface TileClass {
  load(): Promise<void>;
  new(): Tile;
}

interface TileInfo {
  type: TileClass;
  id: number;
}

export const TILES: TileInfo[] = [
  { id: 1, type: Wire },
  { id: 2, type: WireCorner },
  { id: 3, type: WireCross },
  { id: 4, type: WireOneWay },
  { id: 5, type: PowerOnce },
  { id: 6, type: Light },
  { id: 7, type: WireSplit },
  { id: 8, type: Switch },
];

/*
 * load any tile images into cache: we promise that all resource loading is
 * complete.
 */
export async function loadTiles(): Promise<void> {
  await Promise.all(TILES.map(t => t.type.load()));
}

export function moveTile(tile: Tile, xPixel: number, yPixel: number) {
  const element = tile.element;
  element.style.left = `${xPixel}px`;
  element.style.top = `${yPixel}px`;
  return element;
}
