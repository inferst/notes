import { RefObject, useCallback, useEffect, useRef } from "react";
import {
  getSelectionRange,
  setCursorAtNodePosition,
  SelectionRange,
} from "../utils/range";

export type SelectionRangeRef = {
  range: RefObject<SelectionRange | undefined>;
  setRange: (range: Partial<SelectionRange>) => void;
  focus: () => void;
};

// This hook is needed for calculation selection range.
// Hook returns ref because of perfromance purpose.
// Therefore it doesn't rerender on range updates,
// but it should calculate range before each possible action
export function useSelectionRangeRef(
  ref: RefObject<HTMLElement>,
): SelectionRangeRef {
  console.log("useRangeRef");

  const range = useRef<SelectionRange>();

  const setRange = (value: Partial<SelectionRange>) => {
    range.current = {
      ...(range.current ?? { offset: 0, length: 0 }),
      ...value,
    };
  };

  const focus = () => {
    if (ref.current && range.current) {
      console.log('focus');
      ref.current.focus();
      setCursorAtNodePosition(ref.current, range.current.offset);
    }
  };

  const setCurrentRange = useCallback(() => {
    range.current = getSelectionRange(ref.current!);
    console.log("setCurrentRange", range.current.offset, range.current.length);
  }, [ref]);

  const handleMouseUp = useCallback(() => {
    document.removeEventListener("mouseup", handleMouseUp);
    setCurrentRange();
  }, [setCurrentRange]);

  const handleMouseDown = useCallback(() => {
    document.addEventListener("mouseup", handleMouseUp);
    requestAnimationFrame(setCurrentRange);
  }, [handleMouseUp, setCurrentRange]);

  const handleBeforeInput = useCallback(() => {
    console.log("beforeInput");
    setCurrentRange();
    requestAnimationFrame(setCurrentRange);
  }, [setCurrentRange]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

      if (
        ((event.metaKey || event.ctrlKey) && event.code == "a") ||
        keys.includes(event.code)
      ) {
        requestAnimationFrame(setCurrentRange);
      }
    },
    [setCurrentRange],
  );

  const handleBlur = useCallback(() => {
    console.log('blur');
    range.current = undefined;
  }, []);

  useEffect(() => {
    const element = ref.current;

    element?.addEventListener("mousedown", handleMouseDown);
    element?.addEventListener("beforeinput", handleBeforeInput);
    element?.addEventListener("keydown", handleKeyDown);
    element?.addEventListener("blur", handleBlur);

    return () => {
      element?.removeEventListener("mousedown", handleMouseDown);
      element?.removeEventListener("beforeinput", handleBeforeInput);
      element?.removeEventListener("keydown", handleKeyDown);
      element?.removeEventListener("blur", handleBlur);
    };
  }, [
    ref,
    handleMouseUp,
    handleMouseDown,
    handleBeforeInput,
    handleKeyDown,
    handleBlur,
  ]);

  return { range, setRange, focus };
}
