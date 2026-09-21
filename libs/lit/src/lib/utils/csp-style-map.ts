import { noChange } from 'lit';
import {
  Directive,
  directive,
  PartType,
  type AttributePart,
  type PartInfo,
} from 'lit/directive.js';

export type CspStyleInfo = Readonly<Record<string, string | number | undefined | null>>;

// Same convention as lit's `styleMap`: dashed names (and custom properties) pass through,
// camelCase ones are converted (`maxWidth` -> `max-width`, `webkitAppearance` -> `-webkit-appearance`)
const cssNames = new Map<string, string>();

const toCssName = (prop: string) => {
  if (prop.includes('-')) {
    return prop;
  }
  let cssName = cssNames.get(prop);
  if (cssName === undefined) {
    cssName = prop.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g, '-$&').toLowerCase();
    cssNames.set(prop, cssName);
  }
  return cssName;
};

const toCssString = (styleInfo: CspStyleInfo) =>
  Object.keys(styleInfo).reduce((style, prop) => {
    const value = styleInfo[prop];
    return value == null ? style : `${style}${toCssName(prop)}:${value};`;
  }, '');

class CspStyleMapDirective extends Directive {
  private previousProps = new Set<string>();

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (
      partInfo.type !== PartType.ATTRIBUTE ||
      partInfo.name !== 'style' ||
      (partInfo.strings?.length as number) > 2
    ) {
      throw new Error(
        '`cspStyleMap` must be used in the `style` attribute and must be the only part in it.',
      );
    }
  }

  /** Only reached on the server, where there is no CSSOM: the client always goes through `update` */
  render(styleInfo: CspStyleInfo) {
    return toCssString(styleInfo);
  }

  override update(part: AttributePart, [styleInfo]: [CspStyleInfo]) {
    const { style } = part.element as HTMLElement;

    for (const prop of this.previousProps) {
      if (styleInfo[prop] == null) {
        this.previousProps.delete(prop);
        style.removeProperty(toCssName(prop));
      }
    }

    // Values are re-asserted on every render, as lit's `styleMap` does: widgets such as the
    // auto-growing textarea write to `element.style` themselves and rely on it.
    for (const prop in styleInfo) {
      const value = styleInfo[prop];
      if (value != null) {
        this.previousProps.add(prop);
        style.setProperty(toCssName(prop), value as string);
      }
    }

    return noChange;
  }
}

/**
 * CSP-safe replacement for lit's `styleMap`, which commits its first render through
 * `setAttribute('style', …)` and is therefore blocked by a strict `style-src` policy.
 * Every client write goes through the CSSOM, which the policy allows. It also runs while
 * hydrating, so styles the browser blocked in server-rendered markup are re-applied.
 */
export const cspStyleMap = directive(CspStyleMapDirective);
