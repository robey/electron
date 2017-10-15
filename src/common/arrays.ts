// groan.

export function range(start: number, end: number, step: number = 1): number[] {
  return [...Array(Math.ceil((end - start) / step)).keys()].map(i => i * step + start);
}

export function arrayGrouped<A>(array: A[], groupSize: number): A[][] {
  return range(0, array.length, groupSize).map(i => array.slice(i, i + groupSize));
}

// find all runs of contiguous elements that match a predicate.
export function findRuns<A>(array: A[], condition: (left: A, right: A) => boolean, op: (run: A[]) => void) {
  for (let i = 0; i < array.length; i++) {
    const start = i;
    while (i + 1 < array.length && condition(array[i], array[i + 1])) i++;
    if (i > start) op(array.slice(start, i + 1));
  }
}
