import { html, type TemplateResult } from 'lit';
import { checkA11y } from '../support/a11y';

/** Mounts a grid in a container of the given width, which the narrow rules query. */
const mountIn = (width: number, grid: TemplateResult) =>
  cy.mount(html`<div class="gui-container" style="width: ${width}px">${grid}</div>`);

/** The bounding boxes of the elements that match, in document order. */
const rects = (selector: string) =>
  cy.get(selector).then(($elements) => $elements.toArray().map((e) => e.getBoundingClientRect()));

const centre = (rect: DOMRect) => rect.top + rect.height / 2;

describe('gui-grid', () => {
  // Wider than the responsive token overrides, which shrink the spacing scale below 640px.
  beforeEach(() => cy.viewport(1000, 800));

  describe('stack', () => {
    it('stacks its cells, a md gap apart', () => {
      mountIn(
        600,
        html`<div class="gui-grid">
          <div class="gui-grid__cell"><gui-textinput uid="a" label="First"></gui-textinput></div>
          <div class="gui-grid__cell"><gui-textinput uid="b" label="Second"></gui-textinput></div>
        </div>`,
      );

      rects('.gui-grid__cell').then(([first, second]) => {
        expect(first.width).to.equal(600);
        expect(second.top - first.bottom).to.equal(16);
      });
    });

    it('takes its gap from the layout tokens', () => {
      mountIn(
        600,
        html`<div class="gui-grid gui-grid--gap-xs">
            <div class="gui-grid__cell">A</div>
            <div class="gui-grid__cell">B</div>
          </div>
          <div class="gui-grid" style="--gui-layout-gap-md: 40px">
            <div class="gui-grid__cell">C</div>
            <div class="gui-grid__cell">D</div>
          </div>`,
      );

      rects('.gui-grid__cell').then(([a, b, c, d]) => {
        expect(b.top - a.bottom).to.equal(4);
        expect(d.top - c.bottom).to.equal(40);
      });
    });
  });

  describe('row', () => {
    it('shares the width by span', () => {
      mountIn(
        632,
        html`<div class="gui-grid gui-grid--row">
          <div class="gui-grid__cell gui-grid__cell--span-2">
            <gui-textinput uid="a" label="Surname"></gui-textinput>
          </div>
          <div class="gui-grid__cell"><gui-textinput uid="b" label="Postcode"></gui-textinput></div>
        </div>`,
      );

      // Three 200px tracks in 632px; the span also covers the gap between its two.
      rects('.gui-grid__cell').then(([wide, narrow]) => {
        expect(wide.width).to.equal(416);
        expect(narrow.width).to.equal(200);
        expect(narrow.top).to.equal(wide.top);
      });
    });

    it('lines up the controls of fields with different labels, hints and errors', () => {
      mountIn(
        600,
        html`<div class="gui-grid gui-grid--row">
          <div class="gui-grid__cell"><gui-textinput uid="a" label="Name"></gui-textinput></div>
          <div class="gui-grid__cell">
            <gui-textinput
              uid="b"
              label="Surname, as it appears on your passport"
              hint="Both surnames if you have two"
            ></gui-textinput>
          </div>
          <div class="gui-grid__cell">
            <gui-textinput
              uid="c"
              label="Postcode"
              .errors=${['Enter a 5-digit postcode']}
            ></gui-textinput>
          </div>
        </div>`,
      );

      rects('gui-textinput input').then((inputs) => {
        expect(inputs[0].top).to.equal(inputs[1].top);
        expect(inputs[1].top).to.equal(inputs[2].top);
      });
      // The labels sit right on top of their controls.
      rects('gui-textinput .gui-label').then((labels) =>
        rects('gui-textinput input').then((inputs) => {
          labels.forEach((label, i) => expect(inputs[i].top - label.bottom).to.be.below(8));
        }),
      );
    });

    it('lines up the pickers with the other fields', () => {
      mountIn(
        900,
        html`<div class="gui-grid gui-grid--row">
          <div class="gui-grid__cell">
            <gui-textinput uid="a" label="Name" hint="As on your passport"></gui-textinput>
          </div>
          <div class="gui-grid__cell"><gui-date-picker uid="b" label="Date"></gui-date-picker></div>
          <div class="gui-grid__cell"><gui-time-picker uid="c" label="Time"></gui-time-picker></div>
          <div class="gui-grid__cell">
            <gui-range-date-picker uid="d" label="Dates"></gui-range-date-picker>
          </div>
        </div>`,
      );

      // The hint only grows the label track: every control starts at the same line.
      rects('.gui-grid__cell > * > .gui-widget').then((widgets) => {
        expect(widgets).to.have.length(4);
        widgets.forEach((widget) => expect(widget.top).to.be.closeTo(widgets[0].top, 0.5));
      });
    });

    it('centres a checkbox, a toggle and a button on the input', () => {
      mountIn(
        800,
        html`<div class="gui-grid gui-grid--row">
          <div class="gui-grid__cell"><gui-textinput uid="a" label="Name"></gui-textinput></div>
          <div class="gui-grid__cell">
            <gui-checkbox uid="b" label="Subscribe" hint="Once a month"></gui-checkbox>
          </div>
          <div class="gui-grid__cell"><gui-toggle uid="c" label="Public"></gui-toggle></div>
          <div class="gui-grid__cell"><gui-button uid="d" label="Search"></gui-button></div>
        </div>`,
      );

      rects('gui-textinput input').then(([input]) => {
        // The checkbox lines up with the first line of its label text.
        rects('gui-checkbox input').then(([checkbox]) =>
          expect(centre(checkbox)).to.be.closeTo(centre(input), 2),
        );
        rects('gui-toggle .gui-toggle--switch').then(([toggle]) =>
          expect(centre(toggle)).to.be.closeTo(centre(input), 1),
        );
        rects('gui-button button').then(([button]) =>
          expect(centre(button)).to.be.closeTo(centre(input), 1),
        );
        // A checkbox's hint goes below the control.
        rects('gui-checkbox .gui-widget-hint').then(([hint]) =>
          expect(hint.top).to.be.at.least(input.bottom),
        );
      });
    });

    it('keeps its cells at their own width with justify', () => {
      mountIn(
        600,
        html`<div class="gui-grid gui-grid--row gui-grid--justify-end">
          <div class="gui-grid__cell gui-grid__cell--span-2">
            <gui-button uid="a" label="Cancel"></gui-button>
          </div>
          <div class="gui-grid__cell"><gui-button uid="b" label="Save"></gui-button></div>
        </div>`,
      );

      rects('.gui-grid').then(([grid]) =>
        rects('.gui-grid__cell').then(([cancel, save]) => {
          expect(save.right).to.be.closeTo(grid.right, 0.5);
          expect(save.left - cancel.right).to.be.closeTo(16, 0.5);
          // The span does not apply: each cell is as wide as its button.
          expect(cancel.width).to.be.below(150);
        }),
      );
    });

    it('stacks in a narrow container', () => {
      mountIn(
        400,
        html`<div class="gui-grid gui-grid--row">
          <div class="gui-grid__cell gui-grid__cell--span-2">
            <gui-textinput uid="a" label="Name"></gui-textinput>
          </div>
          <div class="gui-grid__cell"><gui-textinput uid="b" label="Surname"></gui-textinput></div>
        </div>`,
      );

      // One gap apart, as in a stack.
      rects('gui-textinput input').then(([first]) =>
        rects('gui-textinput .gui-label').then(([, secondLabel]) =>
          expect(secondLabel.top - first.bottom).to.equal(16),
        ),
      );
      rects('.gui-grid__cell').then(([first, second]) => {
        expect(first.width).to.equal(400);
        expect(second.width).to.equal(400);
      });
    });
  });

  describe('columns', () => {
    it('wraps its cells in numbered columns, spanning by span', () => {
      mountIn(
        632,
        html`<div class="gui-grid gui-grid--columns-3">
          <div class="gui-grid__cell"><gui-textinput uid="a" label="A"></gui-textinput></div>
          <div class="gui-grid__cell gui-grid__cell--span-2">
            <gui-textinput uid="b" label="B"></gui-textinput>
          </div>
          <div class="gui-grid__cell"><gui-textinput uid="c" label="C"></gui-textinput></div>
        </div>`,
      );

      rects('.gui-grid__cell').then(([a, b, c]) => {
        expect(a.width).to.equal(200);
        expect(b.width).to.equal(416);
        expect(b.top).to.equal(a.top);
        expect(c.left).to.equal(a.left);
      });
      // The rows are one gap apart, and the grid ends at its last row.
      rects('gui-textinput input').then(([a]) =>
        rects('gui-textinput .gui-label').then(([, , cLabel]) =>
          expect(cLabel.top - a.bottom).to.equal(16),
        ),
      );
    });

    it('fits as many columns as the minimum width allows with auto', () => {
      mountIn(
        640,
        html`<div class="gui-grid gui-grid--auto">
          <div class="gui-grid__cell"><gui-textinput uid="a" label="A"></gui-textinput></div>
          <div class="gui-grid__cell"><gui-textinput uid="b" label="B"></gui-textinput></div>
          <div class="gui-grid__cell"><gui-textinput uid="c" label="C"></gui-textinput></div>
          <div class="gui-grid__cell"><gui-textinput uid="d" label="D"></gui-textinput></div>
        </div>`,
      );

      // 12rem columns: three fit in 640px, the fourth wraps.
      rects('.gui-grid__cell').then(([a, b, c, d]) => {
        expect(b.top).to.equal(a.top);
        expect(c.top).to.equal(a.top);
        expect(d.top).to.be.above(a.bottom);
      });
    });
  });

  it('has no accessibility violations', () => {
    mountIn(
      600,
      html`<div class="gui-grid gui-grid--row">
        <div class="gui-grid__cell"><gui-textinput uid="a" label="Name"></gui-textinput></div>
        <div class="gui-grid__cell"><gui-checkbox uid="b" label="Subscribe"></gui-checkbox></div>
      </div>`,
    );

    checkA11y('.gui-grid');
  });
});
