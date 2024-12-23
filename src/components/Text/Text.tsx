import {
  forwardRef,
  memo,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as Y from "yjs";
import { useTextUpdate } from "./useTextUpdate";
import { setSelectionRange } from "../../utils/range";
import { textParagraphToHtml } from "../../utils/text";
import { EditorContext, EditorContextValue } from "../Editor/ediorContext";
import "./Text.module.css";

export type TextComponentProps = {
  text: Y.Text;
  onInsertBelow: (text: Y.Text) => void;
  onDeleteAbove: (text: Y.Text) => void;
  onCursorMoveUp: () => void;
  onCursorMoveDown: () => void;
};

export type TextComponentRef = {
  focus: (position: number) => void;
};

const TextComponent = memo(
  forwardRef<TextComponentRef, TextComponentProps>((props, innerRef) => {
    console.log("TextComponent render");

    const {
      text,
      onInsertBelow,
      onDeleteAbove,
      onCursorMoveUp,
      onCursorMoveDown,
    } = props;

    const ref = useRef<HTMLDivElement | null>(null);

    const context = useContext(EditorContext) as EditorContextValue;

    const [placeholder, setPlaceholder] = useState("");

    const textUpdate = useTextUpdate(
      ref,
      text,
      context,
      onInsertBelow,
      onDeleteAbove,
      onCursorMoveUp,
      onCursorMoveDown,
    );

    const updateContent = useCallback(() => {
      if (ref.current) {
        const paragraph = textParagraphToHtml(text.toDelta());

        if (paragraph != ref.current.innerHTML) {
          ref.current.innerHTML = paragraph;
          console.log("updateContent");

          // When content editable is updated we need to refocus current position
          const range = context.selectionRangeRef.current;
          const focused = context.focusedTextElementRef.current;

          if (range && focused && focused == ref.current) {
            console.log(range);
            context.setSelectionRange(range);
          }
        }
      }
    }, [text, context]);

    useEffect(() => {
      updateContent();
      text.observe(updateContent);

      return () => {
        text.unobserve(updateContent);
      };
    }, [text, updateContent]);

    useImperativeHandle(innerRef, () => ({
      focus: (position: number) => {
        if (ref.current) {
          setSelectionRange(ref.current, position);
          ref.current.focus();
        }
      },
    }));

    const handleFocus = useCallback(() => {
      setPlaceholder("Write something");
      context.onTextElementFocusIn(ref.current);
    }, [context]);

    const handleBlur = useCallback(() => {
      setPlaceholder("");
      context.onTextElementFocusIn(null);
    }, [context]);

    return (
      <>
        <div
          ref={ref}
          contentEditable={true}
          aria-placeholder={placeholder}
          onInput={textUpdate.onInput}
          onKeyDown={textUpdate.onKyeDown}
          onPaste={textUpdate.onPaste}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            cursor: "text",
            // minHeight: "1em",
            // maxWidth: '100%',
            // width: '100%',
          }}
        />
      </>
    );
  }),
);

export default TextComponent;
