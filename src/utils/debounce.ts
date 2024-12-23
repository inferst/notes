export function debounce(delay: number) {
  let id: NodeJS.Timeout;
  return (callback: () => void) => {
    clearTimeout(id);
    id = setTimeout(() => {
      callback();
    }, delay);
  };
}
