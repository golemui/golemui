export const runAlertComponentTests = (mountFn: (formDef: Record<string, any>) => void) => {
  describe('Alert Component', () => {
    beforeEach(() => {
      mountFn({
        form: [
          {
            uid: '',
            kind: 'display',
            widget: 'alert',
            props: {
              text: 'Some fields need your attention',
              level: 'warning',
            },
          },
        ],
      });
    });

    it('should display a warning alert', () => {
      cy.get('.gui-alert-notification--warning')
        .should('exist')
        .and('contain.text', 'Some fields need your attention');
    });
  });
};
