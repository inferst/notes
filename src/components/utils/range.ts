// export function getCursorPosition(element: HTMLElement): number {
//   const selection = window.getSelection();
//
//   if (!selection || selection.rangeCount == 0) {
//     return 0;
//   }
//
//   const range = selection.getRangeAt(0);
//   const clonedRange = range.cloneRange();
//   clonedRange.selectNodeContents(element);
//   clonedRange.setEnd(range.endContainer, range.endOffset);
//
//   return clonedRange.toString().length;
// }
//
// export function setCursorPosition(element: HTMLElement, position: number) {
//   const range = document.createRange();
//   const sel = window.getSelection()!;
//   range.setStart(element.childNodes[0], position);
//   range.collapse(true);
//
//   sel.removeAllRanges();
//   sel.addRange(range);
//   element.focus();
// }

export type SelectionRange = {
  offset: number;
  length: number;
};

export function setCursorAtNodePosition(node: Node, index: number) {
  const range = document.createRange();
  const selection = window.getSelection()!;

  let currentPosition = 0;
  let found = false;

  const searchNode = (node: Node) => {
    if (node instanceof Text) {
      if (currentPosition + node.length >= index) {
        range.setStart(node, index - currentPosition);
        range.collapse(true);
        found = true;
      } else {
        currentPosition += node.length;
      }
    } else {
      for (const child of node.childNodes) {
        if (found) break;
        searchNode(child);
      }
    }
  };

  searchNode(node);

  if (!found) {
    range.setStart(node, 0);
    range.collapse(true);
  }

  selection.removeAllRanges();
  selection.addRange(range);
}

export function forEachNode(
  nodes: NodeList,
  fn: (node: Node) => boolean,
): boolean {
  for (const node of nodes) {
    if (!fn(node)) {
      return false;
    }

    if (!forEachNode(node.childNodes, fn)) {
      return false;
    }
  }

  return true;
}

export function getSelectionRange(root: Element): SelectionRange {
  const selection = window.getSelection()!;
  const range = selection.getRangeAt(0);
  const clonedRange = range.cloneRange();

  let offset = 0;

  if (root != clonedRange.startContainer) {
    forEachNode(root.childNodes, (node) => {
      if (node == clonedRange.startContainer) {
        offset += clonedRange.startOffset;
        return false;
      }

      if (node instanceof Text) {
        offset += node.length ?? 0;
      }

      return true;
    });
  }

  const length = clonedRange.toString().length;

  return { offset, length };
}

export const getRange = () => {
  const selection = window.getSelection()!;
  const range = selection.getRangeAt(0);
  return range;
};

export const setCursorPositionFromPoint = (x: number, y: number) => {
  let range: Range | undefined;

  if (typeof document.caretPositionFromPoint != "undefined") {
    const start = document.caretPositionFromPoint(x, y);
    const end = document.caretPositionFromPoint(x, y);

    range = document.createRange();
    range.setStart(start.offsetNode, start.offset);
    range.setEnd(end.offsetNode, end.offset);
  } else if (typeof document.caretRangeFromPoint != "undefined") {
    const start = document.caretRangeFromPoint(x, y);
    const end = document.caretRangeFromPoint(x, y);

    if (start && end) {
      range = document.createRange();
      range.setStart(start.startContainer, start.startOffset);
      range.setEnd(end.startContainer, end.startOffset);
    }
  }

  if (range !== undefined && typeof window.getSelection != "undefined") {
    const selelection = window.getSelection()!;
    selelection.removeAllRanges();
    selelection.addRange(range);
  }
};
