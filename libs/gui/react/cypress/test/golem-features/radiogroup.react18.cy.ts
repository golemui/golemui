import { gui } from '@golemui/gui-shared';
import { mountFramework } from '../../support/mount';

// Pinned to React 18 (run with REACT18=1): red on 18, green on 19 — guards the adapter
// against the React <=18 prop-stringification crash the React-19 monorepo can't otherwise see.
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
