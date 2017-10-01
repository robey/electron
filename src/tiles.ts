import { moveTile, setTileDragEvents, TileResources } from "./tiles/common";
export { moveTile, setTileDragEvents, TileResources };

import { TileWire, TileWireCorner, TileWireCross, TileWireOneWay } from "./tiles/wires";
export { TileWire, TileWireCorner, TileWireCross, TileWireOneWay };

/*
 * load any tile images into cache: we promise that all resource loading is
 * complete.
 */
export async function loadTiles(): Promise<void> {
  await Promise.all([
    TileWire.load(),
    TileWireOneWay.load(),
    TileWireCorner.load(),
    TileWireCross.load()
  ]);
}
