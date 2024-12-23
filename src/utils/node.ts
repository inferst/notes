export function forEachNode(
  nodes: NodeList,
  fn: (node: Node) => boolean,
): boolean {
  for (const node of nodes) {
    if (!fn(node)) {
      return false;
    }

    if (!forEachNode(node.childNodes, fn)) {
      return false;
    }
  }

  return true;
}
