import { TextElement } from "../types/text";

export function textParagraphToHtml(elements: TextElement[]): string {
  console.log(elements);
  return elements
    .map((element) => {
      const text = element.insert
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

      if (element.attributes?.bold) {
        return "<b>" + text + "</b>";
      }

      if (element.attributes?.italic) {
        return "<i>" + text + "</i>";
      }

      return element.insert;
    })
    .join("");
}
