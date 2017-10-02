import { moveTile, setTileDragEvents, TileResources } from "./tiles/common";
export { moveTile, setTileDragEvents, TileResources };

import { Wire, WireCorner, WireCross, WireOneWay } from "./tiles/wires";
export { Wire, WireCorner, WireCross, WireOneWay };

/*
 * load any tile images into cache: we promise that all resource loading is
 * complete.
 */
export async function loadTiles(): Promise<void> {
  await Promise.all([
    Wire.load(),
    WireOneWay.load(),
    WireCorner.load(),
    WireCross.load()
  ]);
}
