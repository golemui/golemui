import { html } from 'lit';

// `.gui-typography` and `.gui-image`: classes, not elements, that make the app's own markup look
// like the same content in `gui-markdown-text`.

const HEADINGS = [1, 2, 3, 4, 5, 6] as const;
const TEXT_STYLES = ['fontSize', 'fontWeight', 'lineHeight', 'color'] as const;
/** A text with a line break, bound as an adapter binds it. */
const TWO_LINES = 'One line\nand another';

/** The computed text styles that make two elements look the same. */
const looks = (el: Element) =>
  Object.fromEntries(TEXT_STYLES.map((style) => [style, getComputedStyle(el)[style]]));

/** Markdown with every heading level and a paragraph, as a parser would give it. */
const markdown = {
  parse: () => `${HEADINGS.map((level) => `<h${level}>Heading</h${level}>`).join('')}<p>Text</p>`,
};

/** A 3:2 picture, served from a blob so the spec needs no file. */
const picture = () =>
  URL.createObjectURL(
    new Blob(
      [
        '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="teal"/></svg>',
      ],
      { type: 'image/svg+xml' },
    ),
  );

describe('.gui-typography', () => {
  beforeEach(() => {
    cy.mount(
      html`<div id="classes">
          ${HEADINGS.map(
            (level) => html`<p class="gui-typography gui-typography--h${level}">Heading</p>`,
          )}
          <p class="gui-typography gui-typography--body">${TWO_LINES}</p>
          <p class="gui-typography gui-typography--small">A note</p>
          <p class="gui-typography">Bare</p>
        </div>
        <gui-markdown-text md="#" .dependencies=${{ markdown }}></gui-markdown-text>
        <div class="gui-widget-hint">A hint</div>`,
    );
  });

  it('gives each heading level the look of the same markdown heading', () => {
    for (const level of HEADINGS) {
      cy.get(`.gui-typography--h${level}`).should(([el]) => {
        const twin = document.querySelector(`gui-markdown-text h${level}`) as Element;
        expect(looks(el), `h${level}`).to.deep.equal(looks(twin));
      });
    }
  });

  it('gives body text, with or without its modifier, the look of a markdown paragraph', () => {
    cy.get('.gui-typography--body, #classes > .gui-typography:not([class*="--"])').each(($el) => {
      const twin = document.querySelector('gui-markdown-text p') as Element;
      expect(looks($el[0])).to.deep.equal(looks(twin));
    });
  });

  it('gives small text the size and color of a hint', () => {
    cy.get('.gui-typography--small').should(([el]) => {
      const hint = getComputedStyle(document.querySelector('.gui-widget-hint') as Element);
      expect(getComputedStyle(el).fontSize).to.equal(hint.fontSize);
      expect(getComputedStyle(el).color).to.equal(hint.color);
    });
  });

  it('has no outer margins, and keeps the line breaks of body text', () => {
    cy.get('#classes > .gui-typography').each(($el) => {
      const style = getComputedStyle($el[0]);
      expect([style.marginBlockStart, style.marginBlockEnd]).to.deep.equal(['0px', '0px']);
    });
    cy.get('.gui-typography--body').should(([el]) => {
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
      expect(el.getBoundingClientRect().height).to.be.closeTo(lineHeight * 2, 1);
    });
  });

  it('wraps a long word inside a narrow grid instead of widening it', () => {
    cy.mount(
      html`<div style="display: grid; inline-size: 120px">
        <p class="gui-typography gui-typography--body">${'a'.repeat(80)}</p>
      </div>`,
    );
    cy.get('.gui-typography').should(([el]) =>
      expect(el.getBoundingClientRect().width).to.be.at.most(120),
    );
  });
});

describe('.gui-image', () => {
  const RATIOS = { '1-1': 1, '4-3': 4 / 3, '3-2': 3 / 2, '16-9': 16 / 9, '21-9': 21 / 9 };

  it('fills its width with the picture in its own proportions, and a caption below', () => {
    cy.mount(
      html`<figure class="gui-image" style="inline-size: 300px">
        <img src=${picture()} alt="Teal" />
        <figcaption>A caption</figcaption>
      </figure>`,
    );

    cy.get('.gui-image img').should(([img]) => {
      const { width, height } = img.getBoundingClientRect();
      expect(width).to.equal(300);
      expect(height).to.be.closeTo(200, 1);
    });
    cy.get('.gui-image').should('have.css', 'margin', '0px');
    cy.get('.gui-image figcaption').should(([caption]) => {
      const image = document.querySelector('.gui-image img') as Element;
      expect(caption.getBoundingClientRect().top).to.be.greaterThan(
        image.getBoundingClientRect().bottom,
      );
    });
  });

  it('takes the proportions of each ratio modifier', () => {
    cy.mount(
      html`${Object.keys(RATIOS).map(
        (ratio) =>
          html`<figure class="gui-image gui-image--ratio-${ratio}" style="inline-size: 210px">
            <img src=${picture()} alt="" />
          </figure>`,
      )}`,
    );

    for (const [ratio, value] of Object.entries(RATIOS)) {
      cy.get(`.gui-image--ratio-${ratio} img`).should(([img]) => {
        const { width, height } = img.getBoundingClientRect();
        expect(width / height, ratio).to.be.closeTo(value, 0.02);
      });
    }
  });

  it('fits the picture with each fit modifier, and covers by default', () => {
    cy.mount(
      html`<figure class="gui-image gui-image--ratio-1-1"><img src=${picture()} alt="" /></figure>
        ${['cover', 'contain', 'fill', 'none'].map(
          (fit) =>
            html`<figure class="gui-image gui-image--ratio-1-1 gui-image--fit-${fit}">
              <img src=${picture()} alt="" />
            </figure>`,
        )}`,
    );

    cy.get('.gui-image:not([class*="--fit-"]) img').should('have.css', 'object-fit', 'cover');
    for (const fit of ['cover', 'contain', 'fill', 'none']) {
      cy.get(`.gui-image--fit-${fit} img`).should('have.css', 'object-fit', fit);
    }
  });

  it('rounds its corners from --gui-image-radius', () => {
    cy.mount(
      html`<figure class="gui-image" style="--gui-image-radius: 3px">
        <img src=${picture()} alt="" />
      </figure>`,
    );

    cy.get('.gui-image img').should('have.css', 'border-radius', '3px');
  });
});
