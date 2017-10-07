import { range } from "./common/arrays";
import { Tile } from "./models";
import { TILES } from "./tiles";
import { TileGrid } from "./tile_grid";
import { decodeArrayZB64, encodeArrayZB64 } from "./zbase64";

/*
 * tile save format:
 *   - version (0x01)
 *   - tiles:
 *       - type
 *       - variant
 *       - x
 *       - y
 */

// "242422262448220448484404622664686"

export function saveGame(grid: TileGrid): string {
  const buffer = [ 1 ];
  for (const tile of grid.tiles()) {
    saveTile(tile, buffer);
  }
  // there's... there's not a base-64 encoder for binary data in javascript! 😂
  return encodeArrayZB64(buffer);
}

export function loadGame(data: string, grid: TileGrid) {
  const buffer = decodeArrayZB64(data);
  if (buffer.shift() != 1) throw new Error("Not a game board");
  grid.clear();
  while (buffer.length > 0) {
    const tile = loadTile(buffer);
    if (tile) grid.setAt(tile.x, tile.y, tile);
  }
}

function saveTile(tile: Tile, buffer: number[]) {
  const info = TILES.filter(info => tile.constructor === info.type)[0];
  buffer.push(info ? info.id : -1);
  buffer.push(tile.variant);
  buffer.push(tile.x);
  buffer.push(tile.y);
}

function loadTile(buffer: number[]): Tile | undefined {
  const id = buffer.shift() || 0;
  const variant = buffer.shift() || 0;
  const x = buffer.shift() || 0;
  const y = buffer.shift() || 0;
  const info = TILES.filter(info => info.id == id)[0];
  if (!info) return undefined;

  const tile = new info.type();
  tile.rotate(variant);
  tile.x = x;
  tile.y = y;
  return tile;
}
