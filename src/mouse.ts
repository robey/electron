import { Board } from "./game";

export function setupMouse(board: Board) {
  document.addEventListener("click", event => click(event));
  document.addEventListener("dblclick", event => doubleClick(event));

  // allow things to be dragged into the game board
  board.div.addEventListener("dragenter", event => board.dragenter(event));
  board.div.addEventListener("dragover", event => board.dragover(event));
  board.div.addEventListener("dragleave", event => board.dragleave(event));
  board.div.addEventListener("drop", event => board.drop(event));

  // buttons
  board.buttonFaster.addEventListener("click", event => {
    board.faster();
    event.preventDefault();
  });
  board.buttonSlower.addEventListener("click", event => {
    board.slower();
    event.preventDefault();
  });
  board.buttonPlay.addEventListener("click", event => {
    board.animation.start();
    event.preventDefault();
  });


  function click(event: MouseEvent) {
    let [ x, y ] = board.pixelToTile(event.x, event.y);
    board.positionCursor(x, y);
    event.preventDefault();
  }

  function doubleClick(event: MouseEvent) {
    // "click" event already moved the cursor.
    board.rotate();
  }
}
