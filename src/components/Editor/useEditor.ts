import { useEffect } from "react";
import { getSelectionRange } from "../../utils/range";
import { EditorContextValue } from "./ediorContext";

export function useEditor(context: EditorContextValue) {
  const setCurrentSelectionRange = () => {
    if (context.focusedTextElementRef.current) {
      context.selectionRangeRef.current = getSelectionRange(
        context.focusedTextElementRef.current,
      );

      console.log("selectionchange", context.selectionRangeRef.current);
    }
  };

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  });

  const handleSelectionChange = () => {
    console.log("handleSelectionChange");
    setCurrentSelectionRange();
  };

  const onBeforeInput = () => {
    console.log("onBeforeInput");
    setCurrentSelectionRange();
  };

  const onKeyDown = () => {
    console.log("onKeyDown");
  };

  return {
    onBeforeInput,
    onKeyDown,
  };
}
