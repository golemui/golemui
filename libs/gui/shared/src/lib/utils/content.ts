/**
 * @internal Used by the framework typography and image widgets, not part of the end-user public
 * API.
 *
 * The tags and classes the four adapters render for them, from the GolemUI Components classes
 * `.gui-typography` and `.gui-image`.
 */
import type { ImageProps, TypographyVariant } from '../widget.props';

const HEADINGS = new Set<TypographyVariant>(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const TEXT_VARIANTS = new Set<TypographyVariant>(['body', 'small']);

/** A known variant, or `body` for anything else. */
function knownVariant(variant: unknown): TypographyVariant {
  const known = variant as TypographyVariant;
  return HEADINGS.has(known) || TEXT_VARIANTS.has(known) ? known : 'body';
}

/**
 * The tag of a typography widget: the heading of a heading variant, a paragraph for the rest.
 * Only these tags come out, so an adapter can render the result as a tag name.
 *
 * @example
 * typographyTag('h2'); // 'h2'
 * typographyTag('small'); // 'p'
 */
export function typographyTag(variant: unknown): 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' {
  const known = knownVariant(variant);
  return HEADINGS.has(known) ? (known as 'h1') : 'p';
}

/**
 * The classes of a typography widget's tag.
 *
 * @example
 * typographyClasses('small'); // 'gui-typography gui-typography--small'
 */
export function typographyClasses(variant: unknown): string {
  return `gui-typography gui-typography--${knownVariant(variant)}`;
}

/**
 * The classes of an image widget's figure, from its ratio and fit. An unknown ratio or fit adds
 * nothing.
 *
 * @example
 * imageClasses({ ratio: '16/9', fit: 'contain' }); // 'gui-image gui-image--ratio-16-9 gui-image--fit-contain'
 */
export function imageClasses({ ratio, fit }: Pick<ImageProps, 'ratio' | 'fit'>): string {
  const classes = ['gui-image'];
  if (ratio && ['1/1', '4/3', '3/2', '16/9', '21/9'].includes(ratio)) {
    classes.push(`gui-image--ratio-${ratio.replace('/', '-')}`);
  }
  if (fit && ['cover', 'contain', 'fill', 'none'].includes(fit)) {
    classes.push(`gui-image--fit-${fit}`);
  }
  return classes.join(' ');
}
