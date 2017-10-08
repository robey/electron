import { Board } from "./game";

export function setupKeyboard(board: Board) {
  // support for "keypress" appears to have been silently removed from chrome.
  document.addEventListener("keydown", event => keypress(event));

  function keypress(event: KeyboardEvent) {
    switch (event.key) {
      case "ArrowUp":
        board.cursorY--;
        board.positionCursor();
        if (event.ctrlKey || board.cursorY < board.viewTop) {
          board.viewTop--;
          board.redraw();
        }
        event.preventDefault();
        break;
      case "ArrowDown":
        board.cursorY++;
        board.positionCursor();
        if (event.ctrlKey || board.cursorY >= board.viewTop + board.viewHeight) {
          board.viewTop++;
          board.redraw();
        }
        event.preventDefault();
        break;
      case "ArrowLeft":
        board.cursorX--;
        board.positionCursor();
        if (event.ctrlKey || board.cursorX < board.viewLeft) {
          board.viewLeft--;
          board.redraw();
        }
        event.preventDefault();
        break;
      case "ArrowRight":
        board.cursorX++;
        board.positionCursor();
        if (event.ctrlKey || board.cursorX >= board.viewLeft + board.viewWidth) {
          board.viewLeft++;
          board.redraw();
        }
        event.preventDefault();
        break;
      case "+":
        board.faster();
        event.preventDefault();
        break;
      case "-":
        board.slower();
        event.preventDefault();
        break;
      case " ":
        board.rotate();
        event.preventDefault();
        break;
      case "Backspace":
      case "Delete":
        board.removeTile();
        event.preventDefault();
        break;
      case "Enter":
        board.animation.start();
        event.preventDefault();
        break;
      default:
        console.log(event);
    }
  }
}
