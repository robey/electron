/*
 * zbase64 converts an array of integers to a string, and back.
 * it assumes:
 *   - no integer will be bigger than about 2**24
 *   - most will be close to zero, small positive or negative numbers
 *   - the strings may be copy/pasted, or have poor (or zero) unicode support
 *
 * strategy:
 *   - zig-zag encode to turn small negative numbers into small positive
 *     numbers
 *   - use a 6-bit encoding, like base64
 *   - encode 5 bits at a time, with the high bit indicating more bits to
 *     come
 *
 * limitations:
 *   - 1-letter encodings: -16 to 15
 *   - 2-letter encodings: -512 to 511
 *   - maximum range: -2**30 to (2**30 - 1), 7 letters, limited by js numbers
 */

const SIXBIT = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.-";

export function encodeZB64(n: number): string {
  // js converts to 32-bit int when you use `<<`
  n = (n << 1) ^ (n >> 31);
  let rv = "";
  while (n > 31) {
    rv += SIXBIT[32 + (n & 31)];
    n >>= 5;
  }
  rv += SIXBIT[n];
  return rv;
}

export function decodeZB64(s: string): number {
  let rv = 0;
  let scale = 0;
  for (let i = 0; i < s.length; i++) {
    rv += (SIXBIT.indexOf(s[i]) & 31) << scale;
    scale += 5;
  }
  rv = (rv >>> 1) ^ -(rv & 1);
  return rv;
}

export function encodeArrayZB64(x: number[]): string {
  return x.map(encodeZB64).join("");
}

export function decodeArrayZB64(s: string): number[] {
  const rv: number[] = [];
  for (let i = 0; i < s.length; i++) {
    const start = i;
    while (SIXBIT.indexOf(s[i]) > 31) i++;
    rv.push(decodeZB64(s.slice(start, i + 1)));
  }
  return rv;
}
