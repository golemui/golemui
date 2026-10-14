// One user-perceived character can span several UTF-16 units (an emoji, a flag, a letter with a
// combining accent), so the caret moves by grapheme, not by string index.
const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/**
 * Finds where the character before a string index starts.
 *
 * @param text - The edited text.
 * @param index - A string index between 0 and `text.length`.
 * @returns The string index of the start of the character before `index`, or 0 at the start.
 *
 * @example
 * previousGraphemeIndex('a\u{1F600}b', 3); // 1, the emoji takes the indexes 1 and 2
 */
export function previousGraphemeIndex(text: string, index: number): number {
  if (index <= 0) {
    return 0;
  }
  return graphemeSegmenter.segment(text).containing(index - 1)?.index ?? 0;
}

/**
 * Finds where the character at a string index ends.
 *
 * @param text - The edited text.
 * @param index - A string index between 0 and `text.length`.
 * @returns The string index after the character at `index`, or `text.length` at the end.
 *
 * @example
 * nextGraphemeIndex('a\u{1F600}b', 1); // 3
 */
export function nextGraphemeIndex(text: string, index: number): number {
  const segment = graphemeSegmenter.segment(text).containing(index);
  if (!segment) {
    return text.length;
  }
  return segment.index + segment.segment.length;
}

/**
 * Counts the user-perceived characters of a text.
 *
 * @param text - Any text.
 * @returns The number of graphemes, which is what a password mask draws one character for.
 *
 * @example
 * countGraphemes('a\u{1F600}b'); // 3, while 'a\u{1F600}b'.length is 4
 */
export function countGraphemes(text: string): number {
  return Array.from(graphemeSegmenter.segment(text)).length;
}
