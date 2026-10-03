import { html } from 'lit';
import type { GuiMarkdownText } from '../../src/lib/components/markdown-text';

const element = () => cy.get<GuiMarkdownText>('gui-markdown-text');

const parse = (md: string) =>
  `<p class="parsed">${md.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>`;

describe('gui-markdown-text', () => {
  describe('rendering', () => {
    it('renders its md attribute as HTML through the parser', () => {
      cy.mount(
        html`<gui-markdown-text
          md="Hello **world**"
          .dependencies=${{ markdown: { parse } }}
        ></gui-markdown-text>`,
      );

      cy.get('gui-markdown-text p.parsed').should('contain.text', 'Hello world');
      cy.get('gui-markdown-text strong').should('have.text', 'world');
    });

    it('hands the parser an empty string without md', () => {
      const spy = cy.spy(parse).as('parse');
      cy.mount(
        html`<gui-markdown-text .dependencies=${{ markdown: { parse: spy } }}></gui-markdown-text>`,
      );

      cy.get('@parse').should('have.been.calledWith', '');
    });

    it('renders nothing without a parser', () => {
      cy.mount(html`<gui-markdown-text md="Hello"></gui-markdown-text>`);

      element().children().should('have.length', 0);
      element().should('not.contain.text', 'Hello');
    });
  });

  describe('value', () => {
    it('renders md set from outside', () => {
      cy.mount(
        html`<gui-markdown-text
          md="Hello"
          .dependencies=${{ markdown: { parse } }}
        ></gui-markdown-text>`,
      );

      element().invoke('prop', 'md', 'Bye');

      cy.get('gui-markdown-text p.parsed').should('have.text', 'Bye');
    });

    it('renders again with a parser set later', () => {
      cy.mount(html`<gui-markdown-text md="Hello"></gui-markdown-text>`);

      element().invoke('prop', 'dependencies', { markdown: { parse } });

      cy.get('gui-markdown-text p.parsed').should('have.text', 'Hello');
    });
  });
});
