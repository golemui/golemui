import { gui } from '@golemui/gui-shared';
import { mountFramework } from '../../support/mount';

// Consumption-boundary regression: render the radiogroup through the React adapter on
// React 18 — the floor @golemui/gui-react advertises ("react": ">=18.0.0").
//
// React <=18 passes object props to custom elements as *stringified attributes*; the
// gui-radiogroup declares `options` with a String converter, so on React 18 `options`
// arrives as a string and `this.options.find(...)` throws during render → no radios.
// React 19 (and Lit/Vue/Angular) property-bind, which masks the bug — and the monorepo
// runs React 19, so nothing else catches it. Run this spec with REACT18=1.
describe('radiogroup via @golemui/gui-react on React 18', () => {
  it('renders its options without crashing', () => {
    mountFramework({
      formDef: [
        gui.inputs.radiogroup('rentalType', {
          label: 'Rental type',
          options: [
            { label: 'Daily', value: 'daily' },
            { label: 'Weekly', value: 'weekly' },
            { label: 'Monthly', value: 'monthly' },
          ],
        }),
      ] as never,
      data: {},
    });

    cy.get('gui-radiogroup').should('exist');
    cy.get('gui-radiogroup input[type="radio"]').should('have.length', 3);
    cy.get('gui-radiogroup').should('contain.text', 'Daily');
  });
});
