// https://github.com/nikgraf/react-yjs/blob/main/packages/react-yjs/src/useY.ts

import { useRef, useSyncExternalStore } from "react";
import * as Y from "yjs";

export function useYArray<T>(yData: Y.Array<T>): T[] {
  const prevDataRef = useRef<T[] | null>(null);

  return useSyncExternalStore(
    (callback) => {
      yData.observe(callback);
      return () => yData.unobserve(callback);
    },
    () => {
      const data = yData.toArray();

      if (shouldUpdate(data, prevDataRef.current)) {
        prevDataRef.current = data;
      }

      return prevDataRef.current!;
    },
    () => {
      return yData.toArray();
    },
  );
}

function shouldUpdate<T>(a: T[], b: T[] | null) {
  if (b == null) {
    return true;
  }

  if (a.length != b.length) {
    return true;
  }

  for (const index in a) {
    if (a[index] != b[index]) {
      return true;
    }
  }

  return false;
}
