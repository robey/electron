// groan.

export function range(start: number, end: number, step: number = 1): number[] {
  return [...Array(Math.ceil((end - start) / step)).keys()].map(i => i * step + start);
}

export function arrayGrouped<A>(array: A[], groupSize: number): A[][] {
  return range(0, array.length, groupSize).map(i => array.slice(i, i + groupSize));
}
