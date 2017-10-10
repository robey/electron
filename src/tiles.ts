import { Tile } from "./models";

import { moveTile, setTileDragEvents, TileResources } from "./tiles/common";
export { moveTile, setTileDragEvents, TileResources };

import { Wire, WireCorner, WireCross, WireOneWay } from "./tiles/wires";
import { PowerOnce } from "./tiles/power";
export { PowerOnce, Wire, WireCorner, WireCross, WireOneWay };

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
  { id: 5, type: PowerOnce }
];

/*
 * load any tile images into cache: we promise that all resource loading is
 * complete.
 */
export async function loadTiles(): Promise<void> {
  await Promise.all(TILES.map(t => t.type.load()));
}
