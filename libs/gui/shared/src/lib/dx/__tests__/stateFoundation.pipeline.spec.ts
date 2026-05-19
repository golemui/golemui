import { describe, expect, it } from 'vitest';
import { processDx } from './helpers';
import { formDefs } from '../dx.service';
import { _guiSelect } from '../shortcuts/select/guiSelect.impl';
import { _guiTextInput } from '../index';

describe('DX Pipeline — State Foundation (Phase 1.2.2.3)', () => {
  describe('Third argument — formConfig', () => {
    it('accepts states in third argument and injects them into form.states', () => {
      const result = formDefs.processDxFacade([_guiTextInput('name')], [], {
        states: {
          editing: '!!$form.name',
        },
      });

      expect(result.form.states).toEqual({ editing: '!!$form.name' });
    });

    it('produces no form.states when formConfig has no states', () => {
      const result = formDefs.processDxFacade([_guiTextInput('name')], []);

      expect(result.form.states).toBeUndefined();
    });

    it('produces no form.states when states object is empty', () => {
      const result = formDefs.processDxFacade([_guiTextInput('name')], [], {
        states: {},
      });

      expect(result.form.states).toBeUndefined();
    });
  });

  describe('State expressions — string pass-through', () => {
    it('string expressions pass through unchanged to form.states values', () => {
      const result = formDefs.processDxFacade([_guiTextInput('name')], [], {
        states: {
          active: '$form.users?.length === 5',
          visible: '!!$form.subregion',
        },
      });

      expect(result.form.states).toEqual({
        active: '$form.users?.length === 5',
        visible: '!!$form.subregion',
      });
    });
  });

  describe('formConfig — other fields still work alongside states', () => {
    it('dependencies and validateOn pass through when states are present', () => {
      const deps = { markdown: { parse: (x: string) => x } };
      const result = formDefs.processDxFacade([_guiTextInput('name')], [], {
        states: { editing: '!!$form.name' },
        dependencies: deps,
        validateOn: 'blur',
      });

      expect(result.form.states).toEqual({ editing: '!!$form.name' });
      expect(result.dependencies).toBe(deps);
      expect(result.validateOn).toBe('blur');
    });

    it('widgetLoaders pass through when states are present', () => {
      const loaders = { heading: async () => ({}) };
      const result = formDefs.processDxFacade([_guiTextInput('name')], [], {
        states: { active: '!!$form.name' },
        widgetLoaders: loaders,
      });

      expect(result.form.states).toEqual({ active: '!!$form.name' });
      expect(result.widgetLoaders).toBe(loaders);
    });
  });

  describe('Integration — processDx helper accepts formConfig', () => {
    it('processDx helper passes formConfig through the pipeline', () => {
      const root = processDx(
        [_guiSelect('country', { options: [{ label: 'US', value: 'US' }] })],
        undefined,
        { states: { hasCountry: '!!$form.country' } },
      );

      // The root layout is a LayoutWidget — states live on form.states, not on the root.
      // This just verifies the pipeline doesn't crash with formConfig.
      expect(root.kind).toBe('layout');
    });
  });
});
