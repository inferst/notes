import { useYArray } from "@/hooks/y";
import { useEffect, useState } from "react";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";

export function useTextBlocks() {
  const [array, setArray] = useState<Y.Array<Y.Text>>();
  const data = useYArray(array);

  const keys: Map<Y.Text, string> = new Map();

  useEffect(() => {
    const doc = new Y.Doc();
    const indexeddb = new IndexeddbPersistence("note", doc);
    const array = doc.getArray<Y.Text>();

    indexeddb.on("synced", () => {
      for (const text of array) {
        keys.set(text, crypto.randomUUID());
      }
    });
  }, [keys]);
}
