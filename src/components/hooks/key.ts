import { RefObject, useEffect } from "react";

export type CtrlKey = "z" | "y" | "a";

export function useCtrlKey(
  ref: RefObject<HTMLElement>,
  onKeyDown: (key: CtrlKey) => void,
) {
  useEffect(() => {
    const element = ref.current;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        if (event.key == "z" || event.key == "y" || event.key == "a") {
          onKeyDown(event.key);
        }
      }
    };

    element?.addEventListener("keydown", handleKeyDown);

    return () => {
      element?.removeEventListener("keydown", handleKeyDown);
    };
  }, [ref, onKeyDown]);
}
