// Built from the escape character code so the pattern carries no literal control character.
const ESCAPE_CHARACTER = String.fromCharCode(27);
const ANSI_SEQUENCE = new RegExp(`${ESCAPE_CHARACTER}\\[[0-9;?]*[ -/]*[@-~]`, 'g');

/**
 * Removes the ANSI color and cursor sequences Ink writes, so a frame can be matched against
 * plain text.
 *
 * @param frame - A frame returned by `lastFrame()`, which is undefined before the first render.
 * @returns The frame without escape sequences, or an empty string when there is no frame yet.
 */
export function stripAnsi(frame: string | undefined): string {
  return (frame ?? '').replace(ANSI_SEQUENCE, '');
}
