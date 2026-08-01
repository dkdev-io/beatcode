declare module '@strudel/web' {
  export function evaluate(code: string): any;
  export function initAudioOnFirstClick(): Promise<any>;
}

declare module '@strudel/core' {
  export function evaluate(code: string): any;
  export function initAudioOnFirstClick(): Promise<any>;
}

declare module '@strudel/webaudio' {
  export function initAudioOnFirstClick(): Promise<any>;
}
