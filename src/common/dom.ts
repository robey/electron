/*
 * useful DOM tricks
 */

// find the offset (x, y) within the document body, not just some random enclosing div.
export function calculateTrueOffset(target: HTMLElement): [ number, number ] {
  let x = target.offsetLeft;
  let y = target.offsetTop;
  if (target.offsetParent !== document.body) {
    const [ xParent, yParent ] = calculateTrueOffset(target.offsetParent as HTMLElement);
    x += xParent, y += yParent;
  }
  return [ x, y ];
}

export function moveToPixel(element: HTMLElement, x: number, y: number) {
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
}
