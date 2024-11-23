import { RefObject, useCallback, useEffect } from "react";
import * as Y from "yjs";
import { SelectionRangeRef } from "./range";

export function useTextUpdate(
  ref: RefObject<HTMLElement>,
  rangeRef: SelectionRangeRef,
  text: Y.Text,
  onInsertBelow: (text: Y.Text) => void,
  onDeleteAbove: (text: Y.Text) => void,
  onCursorMoveUp: () => void,
  onCursorMoveDown: () => void,
) {
  const prevent = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const range = rangeRef.range.current;

      if (ref.current && range) {
        if (event.code == "ArrowUp") {
          if (range.offset == 0) {
            prevent(event);
            onCursorMoveUp();
          }
        } else if (event.code == "ArrowDown") {
          if (range.offset == text.length) {
            prevent(event);
            onCursorMoveDown();
          }
        } else if (event.code == "Enter") {
          prevent(event);
          const cloned = text.clone();
          if (text.length > 0) {
            text.doc?.transact(() => {
              cloned.delete(0, range.offset + range.length);
              text.delete(range.offset, text.length - range.offset);
            });
          }
          onInsertBelow(cloned);
        } else if (event.code == "Backspace") {
          if (range.offset == 0 && range.length == 0) {
            prevent(event);
            onDeleteAbove(text);
          }
        } else if (event.code == "Tab") {
          prevent(event);
        }
      }
    },
    [
      ref,
      text,
      rangeRef.range,
      onCursorMoveUp,
      onCursorMoveDown,
      onInsertBelow,
      onDeleteAbove,
    ],
  );

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      const range = rangeRef.range.current;

      if (range) {
        prevent(event);

        const clipboardData = event.clipboardData;

        if (!clipboardData) {
          return;
        }

        const pastedData = clipboardData.getData("Text");

        rangeRef.setRange({
          offset: range.offset + pastedData.length,
          length: 0,
        });

        text.doc?.transact(() => {
          text.delete(range.offset, range.length);
          text.insert(range.offset, pastedData);
        });

        console.log("pastedData", clipboardData.getData("text/html"));
        console.log("pastedData", clipboardData.getData("text/plain"));

        rangeRef.focus();
      }
    },
    [text, rangeRef],
  );

  const handleInput = useCallback(
    (event: Event) => {
      if (event instanceof InputEvent) {
        const range = rangeRef.range.current;

        if (ref.current && range) {
          switch (event.inputType) {
            case "insertText": {
              console.log("insertText", event);
              const data = event.data;

              text.doc?.transact(() => {
                if (range.length > 0) {
                  rangeRef.setRange({
                    length: 0,
                  });
                  text.delete(range.offset, range.length);
                }

                rangeRef.setRange({
                  offset: range.offset + 1,
                });

                if (data != null) {
                  text.insert(range.offset, data);
                }
              });

              break;
            }
            case "deleteContentBackward": {
              if (range.length > 0) {
                rangeRef.setRange({
                  length: 0,
                });
                text.delete(range.offset, range.length);
              } else {
                rangeRef.setRange({
                  offset: range.offset - 1,
                });
                text.delete(range.offset - 1, 1);
              }
              break;
            }
            case "deleteByCut": {
              rangeRef.setRange({
                length: 0,
              });
              text.delete(range.offset, range.length);
              break;
            }
            default: {
              break;
            }
          }
        }
      }
    },
    [ref, text, rangeRef],
  );

  useEffect(() => {
    const element = ref.current;

    element?.addEventListener("keydown", handleKeyDown);
    element?.addEventListener("input", handleInput);
    element?.addEventListener("paste", handlePaste);

    return () => {
      element?.removeEventListener("keydown", handleKeyDown);
      element?.removeEventListener("input", handleInput);
      element?.removeEventListener("paste", handlePaste);
    };
  }, [ref, handleInput, handleKeyDown, handlePaste]);

  return {};
}
