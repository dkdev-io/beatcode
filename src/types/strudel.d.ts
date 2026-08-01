declare module '@strudel/web' {
  export function evaluate(code: string): any;
  export function initAudioOnFirstClick(): Promise<any>;
  export function initStrudel(options?: any): Promise<any>;
  export function getAudioContext(): AudioContext;
  export function samples(urlMap: any): void;
}

declare module '@strudel/core' {
  export function evaluate(code: string): any;
  export function initAudioOnFirstClick(): Promise<any>;
  export function initStrudel(options?: any): Promise<any>;
}

declare module '@strudel/webaudio' {
  export function initAudioOnFirstClick(): Promise<any>;
  export function getAudioContext(): AudioContext;
  export function samples(urlMap: any): void;
}
