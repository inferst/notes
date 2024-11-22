import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import * as Y from "yjs";
import { CtrlKey, useCtrlKey } from "./hooks/key";
import { getSelectionRange, setCursorAtNodePosition } from "./utils/range";
import { textParagraphToHtml } from "./utils/text";

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

    const range = useRef<[number, number]>([-1, 0]);

    useCtrlKey(ref, (key: CtrlKey) => {
      if (key == "a") {
        requestAnimationFrame(() => {
          range.current = getSelectionRange(ref.current!);
        });
      }
    });

    const handleKeyUp = useCallback(() => {}, []);

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (ref.current) {
          if (
            ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
              event.code,
            )
          ) {
            let move = false;

            if (event.code == "ArrowUp") {
              if (range.current[0] == 0) {
                event.preventDefault();
                event.stopPropagation();
                onMoveUp();
                move = true;
              }
            } else if (event.code == "ArrowDown") {
              if (range.current[0] == text.length) {
                event.preventDefault();
                event.stopPropagation();
                onMoveDown();
                move = true;
              }
            }

            if (!move) {
              requestAnimationFrame(() => {
                if (ref.current) {
                  range.current = getSelectionRange(ref.current);
                }
              });
            }
          } else if (event.code == "Enter") {
            event.preventDefault();
            event.stopPropagation();
            const [index, length] = range.current;
            const cloned = text.clone();
            if (text.length > 0) {
              text.doc?.transact(() => {
                cloned.delete(0, index + length);
                text.delete(index, text.length - index);
              });
            }
            onInsertNext(cloned);
          } else if (event.code == "Backspace") {
            if (range.current[0] == 0 && range.current[1] == 0) {
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
      [text, onInsertNext, onDeletePrev, onMoveUp, onMoveDown],
    );

    const handleMouseDown = useCallback(() => {
      requestAnimationFrame(() => {
        const [index, length] = getSelectionRange(ref.current!);
        range.current = [index, length];
      });
    }, []);

    const handleMouseUp = useCallback(() => {
      requestAnimationFrame(() => {
        range.current = getSelectionRange(ref.current!);
      });
    }, []);

    const handlePaste = useCallback(
      (event: React.ClipboardEvent) => {
        const clipboardData = event.clipboardData;
        const pastedData = clipboardData.getData("Text");
        const [index, length] = range.current;

        text.delete(index, length);
        text.insert(index, pastedData);
      },
      [text],
    );

    const handleInput = useCallback(
      (event: React.FormEvent) => {
        if (ref.current) {
          const [index, length] = range.current;

          if (event.nativeEvent instanceof InputEvent) {
            switch (event.nativeEvent.inputType) {
              case "insertText": {
                const data = event.nativeEvent.data;

                if (length > 0) {
                  range.current[1] = 0;
                  text.delete(index, length);
                }

                range.current[0] = index + 1;

                if (data != null) {
                  text.insert(index, data, { bold: true });
                }

                break;
              }
              case "deleteContentBackward": {
                if (length > 0) {
                  range.current[1] = 0;
                  text.delete(index, length);
                } else {
                  range.current[0] = index - 1;
                  text.delete(index - 1, 1);
                }
                break;
              }
              case "deleteByCut": {
                range.current[1] = 0;
                text.delete(index, length);
                break;
              }
              default: {
                break;
              }
            }
          }
        }
      },
      [text],
    );

    const textObserve = useCallback(() => {
      if (ref.current) {
        const paragraph = textParagraphToHtml(text.toDelta());
        if (paragraph != ref.current.innerHTML) {
          ref.current.innerHTML = paragraph;
        }
        if (
          ref.current &&
          ref.current.childNodes.length > 0 &&
          range.current[0] != -1 &&
          range.current[1] == 0
        ) {
          setCursorAtNodePosition(ref.current, range.current[0]);
        }
      }
    }, [text]);

    const handleBlur = useCallback(() => {
      range.current = [-1, 0];
    }, []);

    useEffect(() => {
      text.observe(textObserve);

      return () => {
        text.unobserve(textObserve);
      };
    }, [text, textObserve]);

    useEffect(() => {
      textObserve();
    }, [textObserve]);

    const handleBeforeInput = () => {
      range.current = getSelectionRange(ref.current!);
    };

    useImperativeHandle(innerRef, () => ({
      focus: (position: number) => {
        if (ref.current) {
          range.current = [position, 0];
          setCursorAtNodePosition(ref.current, position);
          ref.current.focus();
        }
      },
    }));

    return (
      <>
        <div
          ref={ref}
          contentEditable={true}
          onMouseUp={handleMouseUp}
          onMouseDown={handleMouseDown}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onInput={handleInput}
          onPaste={handlePaste}
          onBlur={handleBlur}
          onBeforeInput={handleBeforeInput}
          style={{
            whiteSpace: "pre-wrap",
          }}
        />
      </>
    );
  }),
);

export default TextComponent;
