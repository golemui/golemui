import { ref } from 'lit/directives/ref.js';
import { html, unsafeStatic } from 'lit/static-html.js';
import { elements, type ElementCase } from '../support/elements';

/** The attributes that point at other elements by id. */
const REFERENCES = [
  'for',
  'aria-describedby',
  'aria-labelledby',
  'aria-controls',
  'aria-activedescendant',
  'aria-errormessage',
  'aria-owns',
  'list',
  'popovertarget',
];

const uid = 'field';
const props = { uid, hint: 'Help', errors: ['Wrong'], touched: true };

/** The element with its props, set before it connects (a `ref` runs before insertion). */
const element = ({ tag, props, setup }: ElementCase, extra: Record<string, unknown> = {}) =>
  html`<${unsafeStatic(tag)}
    ${ref((node) => {
      if (!node) return;
      Object.assign(node, props, extra);
      setup?.(node as HTMLElement);
    })}
  ></${unsafeStatic(tag)}>`;

/**
 * The references that already pointed at nothing before ids took a prefix: a picker renders its
 * popup only while it is open, and a calendar's `<label for>` has no control of that id.
 */
const mayDangle = (host: HTMLElement, node: Element, attribute: string) =>
  (attribute === 'aria-controls' && node.getAttribute('aria-expanded') === 'false') ||
  (attribute === 'for' && host.localName.endsWith('-calendar'));

/**
 * Checks the ids inside each element: none is shared with another element of the page, every
 * reference resolves inside the element that holds it, the ids built from the uid carry the
 * element's prefix and the `data-cy` attributes do not.
 */
const expectScopedIds = (tag: string, prefixes: string[]) =>
  cy.get(tag).should((hosts) => {
    expect(hosts, tag).to.have.length(prefixes.length);
    const ids = [...document.querySelectorAll('[id]')].map((node) => node.id);
    const shared = ids.filter((id, index) => ids.indexOf(id) !== index);
    expect(shared, 'ids shared by two elements').to.deep.equal([]);

    hosts.each((index, host) => {
      const prefix = prefixes[index];
      const own = [...host.querySelectorAll('[id]')].map((node) => node.id);
      expect(
        own.filter((id) => id.startsWith(uid)),
        'ids without the prefix',
      ).to.deep.equal([]);
      expect(
        own.filter((id) => id.startsWith(`${prefix}-${uid}`)),
        'ids with the prefix',
      ).not.to.have.length(0);
      for (const node of host.querySelectorAll('[data-cy]')) {
        expect(node.getAttribute('data-cy'), 'data-cy').not.to.contain(prefix);
      }
      for (const attribute of REFERENCES) {
        for (const node of host.querySelectorAll(`[${attribute}]`)) {
          for (const id of node.getAttribute(attribute)?.split(/\s+/).filter(Boolean) ?? []) {
            const target = document.getElementById(id);
            if (!target && mayDangle(host, node, attribute)) continue;
            expect(target, `#${id}, from ${attribute}`).not.to.equal(null);
            expect(
              host.contains(target),
              `#${id}, from ${attribute}, is inside its element`,
            ).to.equal(true);
          }
        }
      }
    });
  });

// GolemUI Forms gives every element the form's name as `idPrefix`, so two forms that share a
// field render different ids.
describe('idPrefix', () => {
  for (const testCase of elements.filter((item) => item.form)) {
    const { tag } = testCase;
    const picker = tag.endsWith('-picker');

    it(`${tag} scopes its ids with it`, () => {
      cy.mount(
        html`${element(testCase, { ...props, idPrefix: 'first' })}
        ${element(testCase, { ...props, idPrefix: 'second' })}`,
      );

      expectScopedIds(tag, ['first', 'second']);
      if (picker) {
        const toggle = () => cy.get(tag).last().find('button[aria-haspopup]').first();
        toggle().click();
        toggle().should('have.attr', 'aria-expanded', 'true');
        expectScopedIds(tag, ['first', 'second']);
      }
    });

    it(`${tag} keeps its ids without it`, () => {
      cy.mount(element(testCase, props));

      cy.get(tag).should(([host]) => {
        const own = [...host.querySelectorAll('[id]')].map((node) => node.id);
        expect(
          own.filter((id) => id.startsWith(uid)),
          'ids built from the uid',
        ).not.to.have.length(0);
        expect(
          own.filter((id) => id.includes(`-${uid}`)),
          'prefixed ids',
        ).to.deep.equal([]);
      });
    });
  }

  it('focuses the control of its own element from its label', () => {
    cy.mount(
      html`<gui-textinput uid="name" label="Name" id-prefix="first"></gui-textinput>
        <gui-textinput uid="name" label="Name" id-prefix="second"></gui-textinput>`,
    );

    cy.get('gui-textinput').last().find('label').click();
    cy.focused().should('have.attr', 'id', 'second-name');
    cy.get('gui-textinput').first().find('label').click();
    cy.focused().should('have.attr', 'id', 'first-name');
  });

  it('keeps the radios of two elements in separate groups', () => {
    const options = [
      { label: 'Red', value: 'red' },
      { label: 'Green', value: 'green' },
    ];
    cy.mount(
      html`<gui-radiogroup
          uid="color"
          label="Color"
          id-prefix="first"
          .options=${options}
          .value=${'red'}
        ></gui-radiogroup>
        <gui-radiogroup
          uid="color"
          label="Color"
          id-prefix="second"
          .options=${options}
        ></gui-radiogroup>`,
    );

    cy.get('gui-radiogroup').last().find('input').last().click();
    cy.get('gui-radiogroup').first().find('input').first().should('be.checked');
    cy.get('gui-radiogroup').last().find('input').last().should('be.checked');
  });

  it('gives the options of a list its prefix', () => {
    const list = elements.find((item) => item.tag === 'gui-list') as ElementCase;
    cy.mount(element(list, { uid: 'colors', idPrefix: 'first' }));

    cy.get('gui-list [role="option"]').first().should('have.attr', 'id', 'first-colors-item-0');
    cy.get('gui-list').focus().type('{downArrow}');
    cy.get('gui-list')
      .should('have.attr', 'aria-activedescendant')
      .and('match', /^first-colors-item-/);
  });
});
