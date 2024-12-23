import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";
import { useYArray } from "../../hooks/y";
import TextComponent, { TextComponentRef } from "../Text/Text";
import { EditorContext, EditorContextValue } from "./ediorContext";
import styles from "./Editor.module.css";
import { useEditor } from "./useEditor";
import { SelectionRange, setSelectionRange } from "../../utils/range";

const rootDoc = new Y.Doc();
const indexeddb = new IndexeddbPersistence("note", rootDoc);
const array = rootDoc.getArray<Y.Text>();

const map: Map<Y.Text, string> = new Map();

function init() {
  for (const text of array) {
    map.set(text, crypto.randomUUID());
  }
}

indexeddb.on("synced", (data) => {
  console.log("synced", data);
  init();
});

function insert(index: number, text: Y.Text) {
  map.set(text, crypto.randomUUID());
  array.insert(index, [text]);
}

function remove(index: number) {
  const text = array.get(index);
  map.delete(text);
  array.delete(index);
}

indexeddb.on("synced", () => {
  if (array.length == 0) {
    insert(0, new Y.Text());
    // array.insert(0, [new Y.Text("")]);
  }
});

indexeddb.get("note").then((data) => {
  console.log(data);
});

export function Editor() {
  const [state, setState] = useState(0);

  const data = useYArray(array);

  const refArray = useRef<TextComponentRef[]>([]);

  const focusedTextElementRef = useRef<HTMLDivElement | null>(null);

  const selectionRangeRef = useRef<SelectionRange | null>(null);

  const context: EditorContextValue = {
    selectionRangeRef,
    focusedTextElementRef,
    setSelectionRange: (range: Partial<SelectionRange>) => {
      console.log("setSelectionRange");
      if (focusedTextElementRef.current) {
        setSelectionRange(
          focusedTextElementRef.current,
          range.offset ?? 0,
          range.length,
        );
      }
    },
    onTextElementFocusIn: (element) => {
      focusedTextElementRef.current = element;
    },
  };

  const editor = useEditor(context);

  const handleClick = () => {
    // setState(state + 1);
  };

  const handleInsertNext = useCallback((line: number, text: Y.Text) => {
    insert(line + 1, text);
    requestAnimationFrame(() => {
      refArray.current![line + 1].focus(0);
    });
  }, []);

  const handleDeletePrev = useCallback((line: number, text: Y.Text) => {
    if (line > 0) {
      const prev = array.get(line - 1);
      const position = prev.length;
      const delta = text.toDelta();

      rootDoc.transact(() => {
        for (const item of delta) {
          prev.insert(prev.length, item.insert, item.attributes);
        }

        remove(line);
      });

      requestAnimationFrame(() => {
        refArray.current![line - 1].focus(position);
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

  useEffect(() => {
    const id = setInterval(() => {
      // console.log(array);
      array.get(1).insert(0, "1");
    }, 1000);

    return () => {
      clearInterval(id);
    };
  });

  return (
    <EditorContext.Provider value={context}>
      <div
        onClick={handleClick}
        onBeforeInput={editor.onBeforeInput}
        onKeyDown={editor.onKeyDown}
        className={styles.editor}
      >
        <p>{state}</p>
        {data.map((item, line) => {
          console.log("uuid", map.get(item));
          return (
            <TextComponent
              ref={(ref) => (refArray.current[line] = ref!)}
              key={map.get(item)!}
              text={item}
              onInsertBelow={(text) => handleInsertNext(line, text)}
              onDeleteAbove={(text) => handleDeletePrev(line, text)}
              onCursorMoveUp={() => handleMoveUp(line)}
              onCursorMoveDown={() => handleMoveDown(line)}
            />
          );
        })}
      </div>
    </EditorContext.Provider>
  );
}
