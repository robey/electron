import { Tile } from "./models";

const CHUNK_SIZE = 50;

function offsets(x: number, y: number): [ number, number ] {
  return [ Math.floor(x / CHUNK_SIZE) * CHUNK_SIZE, Math.floor(y / CHUNK_SIZE) * CHUNK_SIZE ];
}

/*
 * a square chunk of the board, holding all the tiles for an N x N region.
 */
class Chunk {
  grid: Array<Tile | undefined>;

  constructor(public size: number, public xOffset: number, public yOffset: number) {
    this.grid = new Array<Tile | undefined>(size * size);
  }
}

export class TileGrid {
  // keys are "xoffset,yoffset"
  map: { [coord: string]: Chunk } = {};

  clear() {
    this.map = {};
  }
  
  chunkFor(x: number, y: number): Chunk | undefined {
    const [ xOffset, yOffset ] = offsets(x, y);
    return this.map[`${xOffset},${yOffset}`];
  }

  makeChunkFor(x: number, y: number): Chunk {
    const [ xOffset, yOffset ] = offsets(x, y);
    const chunk = new Chunk(CHUNK_SIZE, xOffset, yOffset);
    this.map[`${xOffset},${yOffset}`] = chunk;
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
    if (tile) {
      tile.x = x;
      tile.y = y;
    }
  }

  sortedChunks(): Chunk[] {
    // keys are all "x,y"
    return Object.keys(this.map).map(key => this.map[key]).sort((a, b) => {
      if (a.yOffset != b.yOffset) return a.yOffset - b.yOffset;
      return a.xOffset - b.xOffset;
    });
  }

  *tiles(): Iterable<Tile> {
    for (const chunk of Object.keys(this.map).map(key => this.map[key])) {
      for (let i = 0; i < chunk.size * chunk.size; i++) {
        const tile = chunk.grid[i];
        if (tile) yield tile;
      }
    }
  }
}
