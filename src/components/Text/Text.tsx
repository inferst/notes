import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as Y from "yjs";
import { useSelectionRangeRef } from "../hooks/range";
import { textParagraphToHtml } from "../utils/text";
import { useTextUpdate } from "../hooks/text";
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

    const rangeRef = useSelectionRangeRef(ref);

    const [placeholder, setPlaceholder] = useState("");

    useTextUpdate(
      ref,
      rangeRef,
      text,
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
          console.log("Contenteditable updated");
          // When content editable is updated we need to refocus current position
          rangeRef.focus();
        }
      }
    }, [text, rangeRef]);

    useEffect(() => {
      updateContent();
      text.observe(updateContent);

      return () => {
        text.unobserve(updateContent);
      };
    }, [text, updateContent]);

    useImperativeHandle(innerRef, () => ({
      focus: (position: number) => {
        rangeRef.setRange({
          offset: position,
        });
        rangeRef.focus();
      },
    }));

    const handleFocus = () => {
      setPlaceholder("Put your text here");
    };

    const handleBlur = () => {
      setPlaceholder("");
    };

    return (
      <>
        <div
          ref={ref}
          contentEditable={true}
          aria-placeholder={placeholder}
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
