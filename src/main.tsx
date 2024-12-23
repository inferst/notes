import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// import App from "./App.tsx";
import * as Y from "yjs";

const doc = new Y.Doc();
const subdoc = new Y.Doc();

const array = doc.getArray();
array.insert(0, [subdoc]);

const text = subdoc.getText();
const text2 = new Y.Text();
text2.insert(0, 'text 2');

array.insert(1, [text2]);

text.insert(0, "text");

const subdocs = doc.getSubdocs();

for (const subdoc of subdocs) {
  console.log(subdoc.guid);
  console.log(subdoc.getText().toJSON());
}

const update = Y.encodeStateAsUpdate(doc);

const doc2 = new Y.Doc();

Y.applyUpdate(doc2, update);

for (const subdoc of doc2.getSubdocs()) {
  subdoc.load();
  console.log(subdoc.guid);
  console.log(subdoc.getText().toJSON());
}

for (const item of array) {
  console.log(item);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* <App /> */}
  </StrictMode>,
);
