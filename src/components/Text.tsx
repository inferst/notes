import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import * as Y from "yjs";
import { useSelectionRangeRef } from "../hooks/range";
import { textParagraphToHtml } from "../utils/text";

export type TextComponentProps = {
  text: Y.Text;
  onInsertNext: (text: Y.Text) => void;
  onDeletePrev: (text: Y.Text) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export type TextComponentRef = {
  focus: (position: number) => void;
};

const TextComponent = memo(
  forwardRef<TextComponentRef, TextComponentProps>((props, innerRef) => {
    console.log("TextComponent render");

    const { text, onInsertNext, onDeletePrev, onMoveUp, onMoveDown } = props;

    const ref = useRef<HTMLDivElement | null>(null);

    const rangeRef = useSelectionRangeRef(ref);

    const handleKeyUp = useCallback(() => {}, []);

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (ref.current) {
          if (event.code == "ArrowUp") {
            if (rangeRef.range.current && rangeRef.range.current.offset == 0) {
              event.preventDefault();
              event.stopPropagation();
              onMoveUp();
            }
          } else if (event.code == "ArrowDown") {
            if (
              rangeRef.range.current &&
              rangeRef.range.current.offset == text.length
            ) {
              event.preventDefault();
              event.stopPropagation();
              onMoveDown();
            }
          } else if (event.code == "Enter") {
            event.preventDefault();
            event.stopPropagation();
            if (rangeRef.range.current) {
              const range = rangeRef.range.current;
              const cloned = text.clone();
              if (text.length > 0) {
                text.doc?.transact(() => {
                  cloned.delete(0, range.offset + range.length);
                  text.delete(range.offset, text.length - range.offset);
                });
              }
              onInsertNext(cloned);
            }
          } else if (event.code == "Backspace") {
            if (
              rangeRef.range.current &&
              rangeRef.range.current.offset == 0 &&
              rangeRef.range.current.length == 0
            ) {
              event.preventDefault();
              event.stopPropagation();
              onDeletePrev(text);
            }
          } else if (event.code == "Tab") {
            event.preventDefault();
            event.stopPropagation();
          }
        }
      },
      [text, onInsertNext, onDeletePrev, onMoveUp, onMoveDown, rangeRef],
    );

    const handlePaste = useCallback(
      (event: React.ClipboardEvent) => {
        if (rangeRef.range.current) {
          event.preventDefault();
          event.stopPropagation();

          const clipboardData = event.clipboardData;
          const pastedData = clipboardData.getData("Text");
          const range = rangeRef.range.current;

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
      (event: React.FormEvent) => {
        if (ref.current && rangeRef.range.current) {
          const range = rangeRef.range.current;

          if (event.nativeEvent instanceof InputEvent) {
            switch (event.nativeEvent.inputType) {
              case "insertText": {
                console.log("insertText", event);
                const data = event.nativeEvent.data;

                text.doc?.transact(() => {
                  if (ref.current && rangeRef.range.current) {
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
                      text.insert(range.offset, data, { bold: true });
                    }
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
      [text, rangeRef],
    );

    const updateText = useCallback(() => {
      if (ref.current) {
        const paragraph = textParagraphToHtml(text.toDelta());

        if (paragraph != ref.current.innerHTML) {
          ref.current.innerHTML = paragraph;
          console.log("Contenteditable updated");
          // When content editable is updated we need to refocus current position
          rangeRef.focus();
        }
      }
    }, [text, rangeRef]);

    useEffect(() => {
      updateText();
      text.observe(updateText);

      return () => {
        text.unobserve(updateText);
      };
    }, [text, updateText]);

    useImperativeHandle(innerRef, () => ({
      focus: (position: number) => {
        rangeRef.setRange({
          offset: position,
        });
        rangeRef.focus();
      },
    }));

    return (
      <>
        <div
          ref={ref}
          contentEditable={true}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onInput={handleInput}
          onPaste={handlePaste}
          style={{
            whiteSpace: "pre-wrap",
          }}
        />
      </>
    );
  }),
);

export default TextComponent;
