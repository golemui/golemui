import { html, type TemplateResult } from 'lit';
import { options } from '../support/elements';

// WCAG 1.4.11: the boundary that shows where a control is needs 3:1 against the page. axe doesn't
// check it, so this measures the border of each control, in the light and the dark theme.

type Rgb = [number, number, number];

// Any CSS colour, oklab and color-mix() included, as sRGB laid over `under`.
const toRgb = (color: string, under: Rgb): Rgb => {
  const context = document.createElement('canvas').getContext('2d', {
    willReadFrequently: true,
  });
  if (!context) throw new Error('No 2D canvas to read colours with');
  context.fillStyle = `rgb(${under.join(' ')})`;
  context.fillRect(0, 0, 1, 1);
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
};

const luminance = (rgb: Rgb) => {
  const [r, g, b] = rgb.map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: Rgb, b: Rgb) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

/** Each control, and the part of it that draws its border. */
const controls: [string, TemplateResult, string, string?][] = [
  ['gui-textinput', html`<gui-textinput label="Name"></gui-textinput>`, 'input'],
  ['gui-select', html`<gui-select label="Color" .options=${options}></gui-select>`, 'select'],
  ['gui-checkbox', html`<gui-checkbox label="I agree"></gui-checkbox>`, 'input'],
  [
    'gui-radiogroup',
    html`<gui-radiogroup label="Color" .options=${options}></gui-radiogroup>`,
    'input',
  ],
  ['gui-number', html`<gui-number label="Age"></gui-number>`, '.gui-widget'],
  ['gui-markdown', html`<gui-markdown label="Bio"></gui-markdown>`, '.gui-widget'],
  ['gui-toggle', html`<gui-toggle label="Notifications"></gui-toggle>`, '.gui-toggle--slider'],
  // The knob is all an unchecked toggle shows of its state.
  [
    'gui-toggle',
    html`<gui-toggle label="Notifications"></gui-toggle>`,
    '.gui-toggle--slider',
    '::before',
  ],
  [
    'gui-list',
    html`<gui-list label="Color" value-field="value" .items=${options}></gui-list>`,
    ':scope',
  ],
];

describe('control boundaries (WCAG 1.4.11)', () => {
  for (const theme of ['light', 'dark']) {
    describe(`${theme} theme`, () => {
      beforeEach(() => {
        cy.document().then(({ documentElement, body }) => {
          if (theme === 'dark') documentElement.setAttribute('data-theme', 'dark');
          body.style.backgroundColor = 'var(--gui-bg-default)';
        });
      });

      afterEach(() => {
        cy.document().then(({ documentElement, body }) => {
          documentElement.removeAttribute('data-theme');
          body.style.removeProperty('background-color');
        });
      });

      for (const [tag, template, part, pseudo] of controls) {
        it(`${tag}${pseudo ? ` ${pseudo}` : ''} reaches 3:1 against the page`, () => {
          cy.mount(template);

          cy.get(tag).should(([host]) => {
            const element = part === ':scope' ? host : host.querySelector(part);
            expect(element, `${tag} ${part}`).not.to.equal(null);
            if (!element) return;
            const page = toRgb(getComputedStyle(document.body).backgroundColor, [255, 255, 255]);
            const style = getComputedStyle(element, pseudo);
            const color = pseudo === '::before' ? style.backgroundColor : style.borderTopColor;
            const ratio = contrast(toRgb(color, page), page);
            expect(ratio, `${tag} ${part}${pseudo ?? ''} border against the page`).to.be.gte(3);
          });
        });
      }
    });
  }
});
