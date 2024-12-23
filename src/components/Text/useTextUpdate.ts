import { EditorContextValue } from "@/components/Editor/ediorContext";
import { RefObject, useCallback } from "react";
import * as Y from "yjs";

export function useTextUpdate(
  ref: RefObject<HTMLElement>,
  text: Y.Text,
  context: EditorContextValue,
  onInsertBelow: (text: Y.Text) => void,
  onDeleteAbove: (text: Y.Text) => void,
  onCursorMoveUp: () => void,
  onCursorMoveDown: () => void,
) {
  const prevent = (event: Event | React.SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const range = context.selectionRangeRef.current;

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
      context,
      onCursorMoveUp,
      onCursorMoveDown,
      onInsertBelow,
      onDeleteAbove,
    ],
  );

  const handlePaste = useCallback(
    (event: React.FormEvent) => {
      const range = context.selectionRangeRef.current;

      if (range) {
        prevent(event);

        const nativeEvent = event.nativeEvent as ClipboardEvent;

        const clipboardData = nativeEvent.clipboardData;

        if (!clipboardData) {
          return;
        }

        const pastedData = clipboardData.getData("Text");

        text.doc?.transact(() => {
          text.delete(range.offset, range.length);
          text.insert(range.offset, pastedData);
        });

        context.setSelectionRange({
          offset: range.offset + pastedData.length,
          length: 0,
        });
      }
    },
    [text, context],
  );

  const handleInput = useCallback(
    (reactEvent: React.FormEvent) => {
      const event = reactEvent.nativeEvent;

      if (event instanceof InputEvent) {
        const range = context.selectionRangeRef.current;

        if (ref.current && range) {
          switch (event.inputType) {
            case "insertText": {
              const data = event.data;

              text?.doc?.transact(() => {
                if (range.length > 0) {
                  text.delete(range.offset, range.length);
                }

                if (data != null) {
                  text.insert(range.offset, data);
                }
              });

              break;
            }
            case "deleteContentBackward": {
              if (range.length > 0) {
                text.delete(range.offset, range.length);
              } else {
                text.delete(range.offset - 1, 1);
              }
              break;
            }
            case "deleteByCut": {
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
    [ref, text, context],
  );

  return {
    onInput: handleInput,
    onKyeDown: handleKeyDown,
    onPaste: handlePaste,
  };
}
