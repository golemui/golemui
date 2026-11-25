import { defineForm } from '@golemui/core';
import { dictionaryTranslator, type MountComponentFn, testDomId, withTestFormName } from '../utils';

// Behavior tests for the image widget: an <img> in a <figure>, with ratio and fit classes.

/** A 3:2 picture, as a data URL so the spec needs no server. */
const SRC = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="teal"/></svg>',
)}`;

export const runImageComponentTests = (baseMountFn: MountComponentFn) => {
  const mountFn = withTestFormName(baseMountFn);
  const figure = (uid: string) => cy.get(`figure[id="${testDomId(uid)}"]`);

  describe('Image Component', () => {
    it('renders a lazy, asynchronously decoded image with its alt, in a figure', () => {
      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: 'room',
              kind: 'display',
              type: 'image',
              props: { src: SRC, alt: 'A teal room' },
            },
          ],
        }),
      });

      figure('room').should('have.attr', 'class', 'gui-image');
      figure('room')
        .find('img')
        .should('have.attr', 'src', SRC)
        .and('have.attr', 'alt', 'A teal room')
        .and('have.attr', 'loading', 'lazy')
        .and('have.attr', 'decoding', 'async');
      figure('room').find('figcaption').should('not.exist');
      figure('room').parent().should('have.class', 'gui-field');
    });

    it('takes the classes of its ratio and fit, a caption and eager loading', () => {
      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: 'room',
              kind: 'display',
              type: 'image',
              props: {
                src: SRC,
                alt: 'A teal room',
                ratio: '16/9',
                fit: 'contain',
                caption: 'Room 204',
                loading: 'eager',
              },
            },
          ],
        }),
      });

      figure('room')
        .should('have.class', 'gui-image--ratio-16-9')
        .and('have.class', 'gui-image--fit-contain');
      figure('room').find('img').should('have.attr', 'loading', 'eager');
      figure('room').find('figcaption').should('have.text', 'Room 204');
      figure('room')
        .find('img')
        .should(([img]) => {
          const { width, height } = img.getBoundingClientRect();
          expect(width / height).to.be.closeTo(16 / 9, 0.02);
        });
    });

    it('renders an empty alt for a decorative image', () => {
      mountFn({
        formDef: defineForm({
          form: [{ uid: 'pattern', kind: 'display', type: 'image', props: { src: SRC, alt: '' } }],
        }),
      });

      figure('pattern').find('img').should('have.attr', 'alt', '');
    });

    it('interpolates its caption and takes the ratio of the active state', () => {
      mountFn({
        data: { room: '204' },
        formDef: defineForm({
          states: { wide: "$form.layout === 'wide'" },
          form: [
            { uid: 'layout', kind: 'input', type: 'textinput', path: 'layout' },
            {
              uid: 'room',
              kind: 'display',
              type: 'image',
              props: {
                src: SRC,
                alt: 'A teal room',
                caption: 'Room {{ $form.room }}',
                ratio: '4/3',
                'ratio.wide': '21/9',
              },
            },
          ],
        }),
      });

      figure('room').find('figcaption').should('have.text', 'Room 204');
      figure('room').should('have.class', 'gui-image--ratio-4-3');
      cy.get('[data-cy="layout_textinput"]').type('wide');
      figure('room')
        .should('have.class', 'gui-image--ratio-21-9')
        .and('not.have.class', 'gui-image--ratio-4-3');
    });

    it('translates its alt and caption, and again after a language change', () => {
      const translator = dictionaryTranslator('en', {
        en: { 'room.alt': 'A teal room', 'room.caption': 'Room 204' },
        es: { 'room.alt': 'Una habitación verde azulado', 'room.caption': 'Habitación 204' },
      });

      mountFn({
        localization: translator,
        formDef: defineForm({
          form: [
            {
              uid: 'room',
              kind: 'display',
              type: 'image',
              props: { src: SRC, alt: { key: 'room.alt' }, caption: { key: 'room.caption' } },
            },
          ],
        }),
      });

      figure('room').find('img').should('have.attr', 'alt', 'A teal room');
      cy.then(() => translator.setLang('es'));
      figure('room').find('img').should('have.attr', 'alt', 'Una habitación verde azulado');
      figure('room').find('figcaption').should('have.text', 'Habitación 204');
    });
  });
};
