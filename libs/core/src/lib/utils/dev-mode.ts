let _devMode = false;

export function enableDevMode(): void {
  _devMode = true;
}

export function isDevMode(): boolean {
  return _devMode;
}
