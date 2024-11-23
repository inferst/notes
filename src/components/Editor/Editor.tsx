import { useCallback, useEffect, useRef, useState } from "react";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";
import { useYArray } from "../hooks/y";
import TextComponent, { TextComponentRef } from "../Text/Text";
import styles from "./Editor.module.css";

const rootDoc = new Y.Doc();
const indexeddb = new IndexeddbPersistence("note", rootDoc);
const array = rootDoc.getArray<Y.Text>();

indexeddb.on("synced", () => {
  if (array.length == 0) {
    array.insert(0, [new Y.Text("")]);
  }
});

export function Editor() {
  const [state, setState] = useState(0);

  const data = useYArray(array);

  const refArray = useRef<TextComponentRef[]>([]);

  const handleClick = () => {
    // setState(state + 1);
  };

  const handleInsertNext = useCallback((line: number, text: Y.Text) => {
    array.insert(line + 1, [text]);
    requestAnimationFrame(() => {
      refArray.current![line + 1].focus(0);
    });
  }, []);

  const handleDeletePrev = useCallback((line: number, text: Y.Text) => {
    if (line > 0) {
      const prev = array.get(line - 1);
      const delta = text.toDelta();

      requestAnimationFrame(() => {
        refArray.current![line - 1].focus(prev.length);

        rootDoc.transact(() => {
          for (const item of delta) {
            prev.insert(prev.length, item.insert, item.attributes);
          }

          array.delete(line);
        });
      });
    }
  }, []);

  const handleMoveUp = (line: number) => {
    if (data[line - 1] && refArray.current[line - 1]) {
      const position = data[line - 1].length;
      refArray.current[line - 1].focus(position);
    }
  };

  const handleMoveDown = (line: number) => {
    if (data[line + 1] && refArray.current[line + 1]) {
      refArray.current[line + 1].focus(0);
    }
  };

  // useEffect(() => {
  //   const id = setInterval(() => {
  //     // console.log(array);
  //     array.get(1).delete(0, 1);
  //   }, 1000);
  //
  //   return () => {
  //     clearInterval(id);
  //   };
  // });

  return (
    <div className={styles.editor} onClick={handleClick}>
      <p>{state}</p>
      {data.map((item, line) => {
        return (
          <TextComponent
            ref={(ref) => (refArray.current[line] = ref!)}
            key={line}
            text={item}
            onInsertBelow={(text) => handleInsertNext(line, text)}
            onDeleteAbove={(text) => handleDeletePrev(line, text)}
            onCursorMoveUp={() => handleMoveUp(line)}
            onCursorMoveDown={() => handleMoveDown(line)}
          />
        );
      })}
    </div>
  );
}
