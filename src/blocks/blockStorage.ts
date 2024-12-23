import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";

type TextBlock = {
  key: string;
  text: Y.Text;
};

class BlockStorage {
  doc: Y.Doc = new Y.Doc();

  indexeddb = new IndexeddbPersistence("note", this.doc);

  array: TextBlock[] = [];

  constructor() {
    this.indexeddb.on("synced", () => {
      console.log("synced");
      init();
    });
  }

  getArray() {}

  observe() {}
}
