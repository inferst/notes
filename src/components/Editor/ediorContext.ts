import { createContext, MutableRefObject, RefObject } from "react";
import { SelectionRange } from "../../utils/range";

export type EditorContextValue = {
  selectionRangeRef: MutableRefObject<SelectionRange | null>;
  focusedTextElementRef: RefObject<HTMLDivElement | null>;
  setSelectionRange: (range: Partial<SelectionRange>) => void;
  onTextElementFocusIn: (contentEditableRef: HTMLDivElement | null) => void;
};

export const EditorContext = createContext<EditorContextValue | null>(null);
