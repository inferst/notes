import { forEachNode } from "@/utils";

export type SelectionRange = {
  offset: number;
  length: number;
};

export function setSelectionRange(
  node: Node,
  offset: number,
  length: number = 0,
) {
  const range = document.createRange();
  const selection = window.getSelection()!;

  const direction = selection.direction;

  let currentPosition = 0;
  let foundStart = false;

  forEachNode(node.childNodes, (node) => {
    if (node instanceof Text) {
      if (!foundStart && currentPosition + node.length >= offset) {
        range.setStart(node, offset - currentPosition);

        foundStart = true;

        if (!length) {
          range.collapse(true);
          return false;
        }
      }

      if (foundStart && currentPosition + node.length >= offset + length) {
        range.setEnd(node, offset + length - currentPosition);

        return false;
      }

      currentPosition += node.length;
    }

    return true;
  });

  if (!foundStart) {
    range.setStart(node, 0);
    range.collapse(true);
  }

  selection.removeAllRanges();

  // keep backward direction if needed
  if (direction == "backward") {
    selection.setBaseAndExtent(
      range.endContainer,
      range.endOffset,
      range.startContainer,
      range.startOffset,
    );
  } else {
    selection.addRange(range);
  }
}

export function getSelectionRange(root: Node): SelectionRange {
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
