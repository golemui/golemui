import * as Core from '@golemui/core';
import { type MountComponentFn } from '../utils';

export const runStringInterpolationTests = (mountFn: MountComponentFn) => {
  describe('String interpolation', () => {
    describe('$meta interpolation in text', () => {
      it('should interpolate $meta variables in display text', () => {
        mountFn({
          meta: { connectionStatus: 'online' },
          formDef: Core.defineForm({
            form: [
              {
                uid: 'status-alert',
                kind: 'display',
                type: 'alert',
                props: {
                  text: 'Your connection status is: {{$meta.connectionStatus}}',
                },
              },
            ],
          }),
        });

        cy.get('.gui-alert [role="alert"]').contains('Your connection status is: online');
      });

      it('should handle multiple $meta interpolations in a single string', () => {
        mountFn({
          meta: {
            connectionStatus: 'online',
            version: '1.0.0',
          },
          formDef: Core.defineForm({
            form: [
              {
                uid: 'multi-alert',
                kind: 'display',
                type: 'alert',
                props: {
                  text: 'Status: {{$meta.connectionStatus}} | Version: {{$meta.version}}',
                },
              },
            ],
          }),
        });

        cy.get('.gui-alert [role="alert"]').contains('Status: online | Version: 1.0.0');
      });

      it('should handle undefined $meta variables gracefully', () => {
        mountFn({
          meta: {},
          formDef: Core.defineForm({
            form: [
              {
                uid: 'undefined-alert',
                kind: 'display',
                type: 'alert',
                props: {
                  text: 'Status: {{$meta.connectionStatus}}',
                },
              },
            ],
          }),
        });

        cy.get('.gui-alert [role="alert"]').contains('Status:');
      });
    });

    describe('$form interpolation in inline text', () => {
      it('should interpolate $form variables in display text', () => {
        mountFn({
          data: { details: { clientName: 'John Doe' } },
          formDef: Core.defineForm({
            form: [
              {
                uid: 'client-name-input',
                kind: 'input',
                type: 'textinput',
                path: 'details.clientName',
              },
              {
                uid: 'greeting',
                kind: 'display',
                type: 'alert',
                props: {
                  text: 'Hello {{$form.details.clientName}}',
                },
              },
            ],
          }),
        });

        cy.get('.gui-alert [role="alert"]').contains('Hello John Doe');
      });

      it('should update display when $form variable changes', () => {
        mountFn({
          data: { details: { clientName: 'John' } },
          formDef: Core.defineForm({
            form: [
              {
                uid: 'client-name-input',
                kind: 'input',
                type: 'textinput',
                path: 'details.clientName',
              },
              {
                uid: 'greeting',
                kind: 'display',
                type: 'alert',
                props: {
                  text: 'Hello {{$form.details.clientName}}',
                },
              },
            ],
          }),
        });

        cy.get('.gui-alert [role="alert"]').contains('Hello John');
        cy.get('[data-cy="client-name-input_textinput"]').clear().type('Jane');
        cy.get('.gui-alert [role="alert"]').contains('Hello Jane');
      });

      it('should handle multiple $form interpolations in a single string', () => {
        mountFn({
          data: {
            firstName: 'John',
            lastName: 'Doe',
          },
          formDef: Core.defineForm({
            form: [
              {
                uid: 'first-name',
                kind: 'input',
                type: 'textinput',
                path: 'firstName',
              },
              {
                uid: 'last-name',
                kind: 'input',
                type: 'textinput',
                path: 'lastName',
              },
              {
                uid: 'full-name',
                kind: 'display',
                type: 'alert',
                props: {
                  text: 'Full name: {{$form.firstName}} {{$form.lastName}}',
                },
              },
            ],
          }),
        });

        cy.get('.gui-alert [role="alert"]').contains('Full name: John Doe');
        cy.get('[data-cy="first-name_textinput"]').clear().type('Jane');
        cy.get('.gui-alert [role="alert"]').contains('Full name: Jane Doe');
      });

      it('should handle empty/undefined $form variables', () => {
        mountFn({
          data: { details: {} },
          formDef: Core.defineForm({
            form: [
              {
                uid: 'greeting',
                kind: 'display',
                type: 'alert',
                props: {
                  text: 'Hello {{$form.details.clientName}}',
                },
              },
            ],
          }),
        });

        cy.get('.gui-alert [role="alert"]').contains('Hello');
      });
    });

    describe('$form and $meta combined', () => {
      it('should handle both $form and $meta in the same display', () => {
        mountFn({
          data: { details: { clientName: 'David' } },
          meta: { connectionStatus: 'online' },
          formDef: Core.defineForm({
            form: [
              {
                uid: 'client-name',
                kind: 'input',
                type: 'textinput',
                path: 'details.clientName',
              },
              {
                uid: 'combined-message',
                kind: 'display',
                type: 'alert',
                props: {
                  text: 'Hello {{$form.details.clientName}}, connection: {{$meta.connectionStatus}}',
                },
              },
            ],
          }),
        });

        cy.get('.gui-alert [role="alert"]').contains('Hello David, connection: online');
      });

      it('should update both interpolations when data changes', () => {
        mountFn({
          data: { clientName: 'Eve' },
          meta: { connectionStatus: 'offline' },
          formDef: Core.defineForm({
            form: [
              {
                uid: 'client-name',
                kind: 'input',
                type: 'textinput',
                path: 'clientName',
              },
              {
                uid: 'combined-message',
                kind: 'display',
                type: 'alert',
                props: {
                  text: 'Client: {{$form.clientName}}, Status: {{$meta.connectionStatus}}',
                },
              },
            ],
          }),
        });

        cy.get('.gui-alert [role="alert"]').contains('Client: Eve, Status: offline');
        cy.get('[data-cy="client-name_textinput"]').clear().type('Frank');
        cy.get('.gui-alert [role="alert"]').contains('Client: Frank, Status: offline');
      });
    });

    describe('String interpolation with state-based conditional display', () => {
      it('should interpolate $form in conditional display based on state', () => {
        mountFn({
          data: { userName: 'Grace', isVip: false },
          formDef: Core.defineForm({
            states: {
              vip: '$form.isVip === true',
            },
            form: [
              {
                uid: 'user-name',
                kind: 'input',
                type: 'textinput',
                path: 'userName',
              },
              {
                uid: 'is-vip',
                kind: 'input',
                type: 'checkbox',
                path: 'isVip',
              },
              {
                uid: 'vip-message',
                kind: 'display',
                type: 'alert',
                props: {
                  text: 'Welcome VIP: {{$form.userName}}',
                },
                include: { in: ['vip'] },
              },
            ],
          }),
        });

        cy.get('[id="vip-message"]').should('not.exist');
        cy.get('[data-cy="is-vip_checkbox"]').click();
        cy.get('[id="vip-message"]').should('exist');
        cy.get('.gui-alert [role="alert"]').contains('Welcome VIP: Grace');
      });

      it('should interpolate $meta in state-based conditional display', () => {
        mountFn({
          meta: { isAdmin: true },
          formDef: Core.defineForm({
            states: {
              admin: '$meta.isAdmin === true',
            },
            form: [
              {
                uid: 'admin-message',
                kind: 'display',
                type: 'alert',
                props: {
                  text: 'Admin panel active',
                },
                include: { in: ['admin'] },
              },
              {
                uid: 'user-message',
                kind: 'display',
                type: 'alert',
                props: {
                  text: 'User panel active',
                },
                exclude: { from: ['admin'] },
              },
            ],
          }),
        });

        cy.get('[id="admin-message"]').should('exist');
        cy.get('[id="user-message"]').should('not.exist');
      });
    });

    describe('$errors and $formIsInvalid interpolation in text', () => {
      it('should interpolate $formIsInvalid as "false" when form has no errors', () => {
        mountFn({
          formDef: Core.defineForm({
            form: [
              {
                uid: 'userName',
                kind: 'input',
                type: 'textinput',
                path: 'userName',
                validator: { type: 'string', required: true },
              },
              {
                uid: 'status-display',
                kind: 'display',
                type: 'alert',
                props: { text: 'Invalid: {{$formIsInvalid}}' },
              },
            ],
          }),
        });

        cy.get('.gui-alert [role="alert"]').contains('Invalid: false');
      });

      it('should interpolate $formIsInvalid as "true" after submit with a required field empty', () => {
        mountFn({
          formDef: Core.defineForm({
            form: [
              {
                uid: 'userName',
                kind: 'input',
                type: 'textinput',
                path: 'userName',
                validator: { type: 'string', required: true },
              },
              {
                uid: 'submitBtn',
                kind: 'action',
                type: 'button',
                label: 'Submit',
                on: { click: 'submit' },
              },
              {
                uid: 'status-display',
                kind: 'display',
                type: 'alert',
                props: { text: 'Invalid: {{$formIsInvalid}}' },
              },
            ],
          }),
        });

        cy.get('.gui-alert [role="alert"]').contains('Invalid: false');

        cy.get('[data-cy="submitBtn_button"]').click();
        cy.get('.gui-alert [role="alert"]').contains('Invalid: true');
      });

      it('should interpolate $formIsInvalid back to "false" when validation error is resolved', () => {
        mountFn({
          formDef: Core.defineForm({
            form: [
              {
                uid: 'userName',
                kind: 'input',
                type: 'textinput',
                path: 'userName',
                validator: { type: 'string', required: true },
              },
              {
                uid: 'submitBtn',
                kind: 'action',
                type: 'button',
                label: 'Submit',
                on: { click: 'submit' },
              },
              {
                uid: 'status-display',
                kind: 'display',
                type: 'alert',
                props: { text: 'Invalid: {{$formIsInvalid}}' },
              },
            ],
          }),
        });

        cy.get('[data-cy="submitBtn_button"]').click();
        cy.get('.gui-alert [role="alert"]').contains('Invalid: true');

        cy.get('[data-cy="userName_textinput"]').type('Alice');
        cy.get('.gui-alert [role="alert"]').contains('Invalid: false');
      });

      it('should not show an error message in $errors.fieldName placeholder when there are no errors', () => {
        mountFn({
          formDef: Core.defineForm({
            form: [
              {
                uid: 'userName',
                kind: 'input',
                type: 'textinput',
                path: 'userName',
                validator: { type: 'string', required: true },
              },
              {
                uid: 'error-display',
                kind: 'display',
                type: 'alert',
                props: { text: 'Error: {{$errors.userName}}' },
              },
            ],
          }),
        });

        cy.get('.gui-alert [role="alert"]').should(
          'not.contain',
          'Invalid input: expected string, received undefined',
        );
      });

      it('should interpolate $errors.fieldName as the error message after validation fails', () => {
        mountFn({
          formDef: Core.defineForm({
            form: [
              {
                uid: 'userName',
                kind: 'input',
                type: 'textinput',
                path: 'userName',
                validator: { type: 'string', required: true },
              },
              {
                uid: 'submitBtn',
                kind: 'action',
                type: 'button',
                label: 'Submit',
                on: { click: 'submit' },
              },
              {
                uid: 'error-display',
                kind: 'display',
                type: 'alert',
                props: { text: 'Error: {{$errors.userName}}' },
              },
            ],
          }),
        });

        cy.get('[data-cy="submitBtn_button"]').click();
        cy.get('.gui-alert [role="alert"]').contains(
          'Error: Invalid input: expected string, received undefined',
        );
      });
    });

    describe('Edge cases', () => {
      it('should handle nested path with numbers in property names', () => {
        mountFn({
          data: { user: { phone2024: '555-1234' } },
          formDef: Core.defineForm({
            form: [
              {
                uid: 'phone',
                kind: 'display',
                type: 'alert',
                props: {
                  text: 'Phone: {{$form.user.phone2024}}',
                },
              },
            ],
          }),
        });

        cy.get('.gui-alert [role="alert"]').contains('Phone: 555-1234');
      });

      it('should handle special characters in interpolated values', () => {
        mountFn({
          data: { message: 'Hello & goodbye "quoted"' },
          formDef: Core.defineForm({
            form: [
              {
                uid: 'special-chars',
                kind: 'display',
                type: 'alert',
                props: {
                  text: 'Message: {{$form.message}}',
                },
              },
            ],
          }),
        });

        cy.get('.gui-alert [role="alert"]').contains('Message: Hello & goodbye "quoted"');
      });

      it('should handle zero and false values in interpolation', () => {
        mountFn({
          data: { count: 0, isActive: false },
          formDef: Core.defineForm({
            form: [
              {
                uid: 'false-values',
                kind: 'display',
                type: 'alert',
                props: {
                  text: 'Count: {{$form.count}}, Active: {{$form.isActive}}',
                },
              },
            ],
          }),
        });

        cy.get('.gui-alert [role="alert"]').contains('Count: 0, Active: false');
      });
    });
  });
};
