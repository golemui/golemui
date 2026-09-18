import { defineForm } from '@golemui/core';
import { createMockUploadService } from '../mocks/upload-service.mock';
import { type FormHandle, type MountComponentFn } from '../utils';

export const runReinitComponentTests = (mountFn: MountComponentFn) => {
  describe('Config replacement', () => {
    const contract = {
      id: 'srv-1',
      name: 'contract.pdf',
      size: 1024,
      type: 'application/pdf',
      status: 'uploaded',
      data: 'https://cdn.test/contract.pdf',
    };
    const invoice = {
      id: 'srv-2',
      name: 'invoice.pdf',
      size: 2048,
      type: 'application/pdf',
      status: 'uploaded',
      data: 'https://cdn.test/invoice.pdf',
    };
    const submitButton = {
      uid: 'submitBtn',
      kind: 'action',
      type: 'button',
      label: 'Submit',
      actionType: 'submit',
    } as const;

    const firstNameFormDef = () =>
      defineForm({
        form: [
          {
            uid: 'firstName',
            kind: 'input',
            type: 'textinput',
            path: 'firstName',
            label: 'First name',
          },
        ],
      });

    const lastNameFormDef = () =>
      defineForm({
        form: [
          {
            uid: 'lastName',
            kind: 'input',
            type: 'textinput',
            path: 'lastName',
            label: 'Last name',
          },
          {
            uid: 'submitBtn',
            kind: 'action',
            type: 'button',
            label: 'Submit',
            actionType: 'submit',
          },
        ],
      });

    it('renders the new form and routes edits to the new store', () => {
      let handle: FormHandle;
      mountFn({
        formDef: firstNameFormDef(),
        data: { firstName: 'Ada' },
        onFormReady: (h) => {
          handle = h;
        },
      });

      cy.get('[data-cy="firstName_textinput"]').should('have.value', 'Ada');

      cy.then(() => {
        handle.setConfig({ formDef: lastNameFormDef(), data: { lastName: 'Lovelace' } });
      });

      cy.get('[data-cy="firstName_textinput"]').should('not.exist');
      cy.get('[data-cy="lastName_textinput"]').should('have.value', 'Lovelace');

      // The edit and the submit must reach the store the new form reads.
      cy.get('[data-cy="lastName_textinput"]').clear();
      cy.get('[data-cy="lastName_textinput"]').type('Byron');
      cy.get('[data-cy="submitBtn_button"]').click();
      cy.get('@formSubmit').should((spy: any) => {
        expect(spy.lastCall.args[0].data).to.deep.equal({ lastName: 'Byron' });
      });
    });

    it('shows the new data after a same-shape config replacement', () => {
      let handle: FormHandle;
      mountFn({
        formDef: firstNameFormDef(),
        data: { firstName: 'Ada' },
        onFormReady: (h) => {
          handle = h;
        },
      });

      cy.get('[data-cy="firstName_textinput"]').should('have.value', 'Ada');

      cy.then(() => {
        handle.setConfig({ formDef: firstNameFormDef(), data: { firstName: 'Grace' } });
      });

      cy.get('[data-cy="firstName_textinput"]').should('have.value', 'Grace');

      // The rendered form must read from the same store the handle writes to.
      cy.then(() => {
        handle.setData({ firstName: 'Hopper' });
      });
      cy.get('[data-cy="firstName_textinput"]').should('have.value', 'Hopper');
    });

    it('fileUpload shows the new value and routes the removal to the new store', () => {
      const mock = createMockUploadService();
      const fileFormDef = (uid: string) =>
        defineForm({
          form: [{ uid, kind: 'input', type: 'fileUpload', path: uid, label: uid }, submitButton],
        });
      let handle: FormHandle;
      mountFn({
        formDef: fileFormDef('cv'),
        data: { cv: contract },
        dependencies: { uploadService: mock.service },
        onFormReady: (h) => {
          handle = h;
        },
      });

      cy.get('[data-cy="cv_file-name"]').should('contain', 'contract.pdf');

      cy.then(() => {
        handle.setConfig({ formDef: fileFormDef('attachment'), data: { attachment: invoice } });
      });

      cy.get('[data-cy="cv_file-bar"]').should('not.exist');
      cy.get('[data-cy="attachment_file-bar"]').should('have.attr', 'data-status', 'uploaded');
      cy.get('[data-cy="attachment_file-name"]').should('contain', 'invoice.pdf');

      // Removing goes to the service with the new item, and the submit reads
      // the store the new form writes to.
      cy.get('[data-cy="attachment_file-remove"]').click();
      cy.get('[data-cy="attachment_file-button"]').should('be.visible');
      cy.then(() => expect(mock.removes.map((item) => item.id)).to.deep.equal(['srv-2']));
      cy.get('[data-cy="submitBtn_button"]').click();
      cy.get('@formSubmit').should((spy: any) => {
        expect(spy.lastCall.args[0].data).to.deep.equal({ attachment: null });
      });
    });

    it('multiFileUpload shows the new files and routes the removal to the new store', () => {
      const mock = createMockUploadService();
      const filesFormDef = (uid: string) =>
        defineForm({
          form: [
            { uid, kind: 'input', type: 'multiFileUpload', path: uid, label: uid },
            submitButton,
          ],
        });
      let handle: FormHandle;
      mountFn({
        formDef: filesFormDef('docs'),
        data: { docs: [contract, invoice] },
        dependencies: { uploadService: mock.service },
        onFormReady: (h) => {
          handle = h;
        },
      });

      cy.get('gui-multi-file-upload gui-pills .gui-pills__pill').should('have.length', 2);

      cy.then(() => {
        handle.setConfig({
          formDef: filesFormDef('attachments'),
          data: { attachments: [invoice] },
        });
      });

      cy.get('[data-cy="docs_file-box"]').should('not.exist');
      cy.get('[data-cy="attachments_file-box"]').should('exist');
      cy.get('gui-multi-file-upload gui-pills .gui-pills__pill')
        .should('have.length', 1)
        .first()
        .should('contain', 'invoice.pdf');

      cy.get('gui-multi-file-upload gui-pills .gui-pills__pill-remove').click({ force: true });
      cy.get('gui-multi-file-upload gui-pills .gui-pills__pill').should('have.length', 0);
      cy.then(() => expect(mock.removes.map((item) => item.id)).to.deep.equal(['srv-2']));
      cy.get('[data-cy="submitBtn_button"]').click();
      cy.get('@formSubmit').should((spy: any) => {
        expect(spy.lastCall.args[0].data).to.deep.equal({ attachments: [] });
      });
    });
  });
};
