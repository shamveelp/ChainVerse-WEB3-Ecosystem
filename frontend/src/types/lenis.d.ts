declare module '@studio-freight/lenis' {
  export default class Lenis {
    constructor(options?: {
      duration?: number;
      easing?: (t: number) => number;
      smooth?: boolean;
      smoothTouch?: boolean;
    });
    raf(time: number): void;
    on(event: 'scroll', callback: (data: { scroll: number; velocity: number }) => void): void;
    destroy(): void;
  }
}