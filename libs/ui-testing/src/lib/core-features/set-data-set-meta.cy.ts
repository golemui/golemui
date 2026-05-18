import { defineForm } from '@golemui/core';
import { type FormHandle, type MountComponentFn } from '../utils';

export const runSetDataSetMetaTests = (mountFn: MountComponentFn) => {
  describe('setData / setMeta', () => {
    describe('setData', () => {
      it('should update field value when setData is called after init', () => {
        let handle!: FormHandle;
        mountFn({
          data: { name: 'initial' },
          formDef: defineForm({
            form: [{ uid: 'name', kind: 'input', type: 'textinput', path: 'name' }],
          }),
          onFormReady: (h) => {
            handle = h;
          },
        });
        cy.get('[data-cy="name_textinput"]').should('have.value', 'initial');
        cy.then(() => handle.setData({ name: 'updated' }));
        cy.get('[data-cy="name_textinput"]').should('have.value', 'updated');
      });

      it('should replace all data when setData is called', () => {
        let handle!: FormHandle;
        mountFn({
          data: { firstName: 'John', lastName: 'Doe' },
          formDef: defineForm({
            form: [
              { uid: 'firstName', kind: 'input', type: 'textinput', path: 'firstName' },
              { uid: 'lastName', kind: 'input', type: 'textinput', path: 'lastName' },
            ],
          }),
          onFormReady: (h) => {
            handle = h;
          },
        });
        cy.get('[data-cy="firstName_textinput"]').should('have.value', 'John');
        cy.get('[data-cy="lastName_textinput"]').should('have.value', 'Doe');
        cy.then(() => handle.setData({ firstName: 'Jane', lastName: 'Smith' }));
        cy.get('[data-cy="firstName_textinput"]').should('have.value', 'Jane');
        cy.get('[data-cy="lastName_textinput"]').should('have.value', 'Smith');
      });
    });

    describe('setMeta', () => {
      it('should update interpolated meta value when setMeta is called after init', () => {
        let handle!: FormHandle;
        mountFn({
          meta: { status: 'offline' },
          formDef: defineForm({
            form: [
              {
                uid: 'status-display',
                kind: 'display',
                type: 'alert',
                props: { text: 'Status: {{$meta.status}}' },
              },
            ],
          }),
          onFormReady: (h) => {
            handle = h;
          },
        });
        cy.get('.gui-alert [role="alert"]').should('contain', 'Status: offline');
        cy.then(() => handle.setMeta({ status: 'online' }));
        cy.get('.gui-alert [role="alert"]').should('contain', 'Status: online');
      });

      it('should toggle meta-driven conditional field when setMeta is called', () => {
        let handle!: FormHandle;
        mountFn({
          meta: { showField: false },
          formDef: defineForm({
            states: { visible: '$meta.showField === true' },
            form: [
              {
                uid: 'conditionalField',
                kind: 'input',
                type: 'textinput',
                path: 'name',
                include: { in: ['visible'] },
              },
            ],
          }),
          onFormReady: (h) => {
            handle = h;
          },
        });
        cy.get('[data-cy="conditionalField_textinput"]').should('not.exist');
        cy.then(() => handle.setMeta({ showField: true }));
        cy.get('[data-cy="conditionalField_textinput"]').should('exist');
      });
    });
  });
};
