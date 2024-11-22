export type TextElement = {
  insert: string;
  attributes?: TextElementAttributes;
};

export type TextElementAttributes = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  url?: string;
  code?: boolean;
};
