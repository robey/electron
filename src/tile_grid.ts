import { Tile } from "./models";

const CHUNK_SIZE = 50;

/*
 * a square chunk of the board, holding all the tiles for an N x N region.
 */
class Chunk {
  grid: Array<Tile | undefined>;
  north: Chunk | undefined;
  east: Chunk | undefined;
  south: Chunk | undefined;
  west: Chunk | undefined;

  constructor(public size: number, public xOffset: number, public yOffset: number) {
    this.grid = new Array<Tile | undefined>(size * size);
  }
}

export class TileGrid {
  origin = new Chunk(CHUNK_SIZE, 0, 0);

  chunkFor(x: number, y: number): Chunk | undefined {
    let chunk: Chunk | undefined = this.origin;
    while (chunk && x < chunk.xOffset) chunk = chunk.west;
    while (chunk && x >= chunk.xOffset + chunk.size) chunk = chunk.east;
    while (chunk && y < chunk.yOffset) chunk = chunk.north;
    while (chunk && y >= chunk.yOffset + chunk.size) chunk = chunk.south;
    return chunk;
  }

  makeChunkFor(x: number, y: number): Chunk {
    const xOffset = Math.floor(x / CHUNK_SIZE) * CHUNK_SIZE;
    const yOffset = Math.floor(y / CHUNK_SIZE) * CHUNK_SIZE;
    const chunk = new Chunk(CHUNK_SIZE, xOffset, yOffset);

    // build cross-links
    const north = this.chunkFor(xOffset, yOffset - CHUNK_SIZE);
    if (north) {
      north.south = chunk;
      chunk.north = north;
    }
    const east = this.chunkFor(xOffset + CHUNK_SIZE, yOffset);
    if (east) {
      east.west = chunk;
      chunk.east = east;
    }
    const south = this.chunkFor(xOffset, yOffset + CHUNK_SIZE);
    if (south) {
      south.north = chunk;
      chunk.south = south;
    }
    const west = this.chunkFor(xOffset - CHUNK_SIZE, yOffset);
    if (west) {
      west.east = chunk;
      chunk.west = west;
    }

    return chunk;
  }

  getAt(x: number, y: number): Tile | undefined {
    const chunk = this.chunkFor(x, y);
    if (!chunk) return undefined;
    return chunk.grid[(y - chunk.yOffset) * chunk.size + (x - chunk.xOffset)];
  }

  setAt(x: number, y: number, tile: Tile | undefined) {
    const chunk = this.chunkFor(x, y) || this.makeChunkFor(x, y);
    chunk.grid[(y - chunk.yOffset) * chunk.size + (x - chunk.xOffset)] = tile;
  }
}
