declare module 'tocbot' {
  export function destroy(): void;
  export function init(options: {
    tocSelector: string;
    contentSelector: string;
    headingSelector: string;
    headingsOffset: number;
    scrollSmoothOffset: number;
  }): void;
}
