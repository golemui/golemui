import { describe, expect, it } from 'vitest';
import { LayoutWidget, NonFunctionWidget } from '@golemui/core';
import {
  _guiAccordion,
  _guiInputs,
  _gslAccordions,
  _gslAccordionById,
} from '../index';
import { processDx, getStaticChild, getRawChild, resolveDynamic } from './helpers';

describe('DX Pipeline — Accordion', () => {
  it('expands _guiAccordion into an accordion layout widget with sections', () => {
    const result = processDx(
      _guiAccordion({
        'Section A': [_guiInputs({ fieldA: 'string' })],
        'Section B': [_guiInputs({ fieldB: 'number' })],
      }),
    );
    const w = getStaticChild(result, 0) as LayoutWidget & {
      props?: {
        sections?: { label: string; uid: string }[];
        renderMode?: string;
      };
    };

    expect(w.kind).toBe('layout');
    expect(w.type).toBe('accordion');
    expect(w.props?.sections).toEqual([
      { label: 'Section A', uid: 'section-a' },
      { label: 'Section B', uid: 'section-b' },
    ]);
    // Default renderMode
    expect(w.props?.renderMode).toBe('all');
  });

  it('passes singleOpen, defaultOpen, and renderMode through to props', () => {
    const result = processDx(
      _guiAccordion(
        {
          'First': [_guiInputs({ a: 'string' })],
          'Second': [_guiInputs({ b: 'string' })],
        },
        {
          singleOpen: true,
          defaultOpen: { first: true },
          renderMode: 'activeOnly',
        },
      ),
    );
    const w = getStaticChild(result, 0) as {
      props?: {
        singleOpen?: boolean;
        defaultOpen?: { [key: string]: boolean };
        renderMode?: string;
      };
    };

    expect(w.props?.singleOpen).toBe(true);
    expect(w.props?.defaultOpen).toEqual({ first: true });
    expect(w.props?.renderMode).toBe('activeOnly');
  });

  it('recursively processes children inside accordion sections', () => {
    const result = processDx(
      _guiAccordion({
        'Details': [_guiInputs({ firstName: 'string', lastName: 'string' })],
      }),
    );
    const accordion = getStaticChild(result, 0) as LayoutWidget;
    // Accordion should have one child (the flex wrapper for the section)
    expect(accordion.children?.length).toBe(1);

    const sectionWrapper = accordion.children?.[0] as LayoutWidget;
    expect(typeof sectionWrapper).not.toBe('function');
    expect(sectionWrapper.kind).toBe('layout');
    expect(sectionWrapper.type).toBe('flex');
    expect(sectionWrapper.uid).toBe('details');

    // The flex wrapper contains the processed input widgets
    const children = sectionWrapper.children ?? [];
    expect(children.length).toBe(2);

    const input1 = children[0] as NonFunctionWidget;
    expect(input1.kind).toBe('input');
    expect(input1.type).toBe('textinput');

    const input2 = children[1] as NonFunctionWidget;
    expect(input2.kind).toBe('input');
    expect(input2.type).toBe('textinput');
  });

  it('applies GSL broad selector override', () => {
    const result = processDx(
      _guiAccordion(
        { 'Info': [_guiInputs({ x: 'string' })] },
        { renderMode: 'all' },
      ),
      [_gslAccordions({ decorator: { renderMode: 'activeOnly' } })],
    );
    const w = getStaticChild(result, 0) as {
      props?: { renderMode?: string };
    };

    expect(w.props?.renderMode).toBe('activeOnly');
  });

  it('applies GSL byId selector override', () => {
    const result = processDx(
      _guiAccordion(
        { 'Info': [_guiInputs({ x: 'string' })] },
        { uid: 'my-accordion', singleOpen: false },
      ),
      [_gslAccordionById('my-accordion', { decorator: { singleOpen: true } })],
    );
    const w = getStaticChild(result, 0) as {
      props?: { singleOpen?: boolean };
    };

    expect(w.props?.singleOpen).toBe(true);
  });

  it('supports dynamic callback producing a FunctionWidget', () => {
    const result = processDx(
      _guiAccordion({
        'Dynamic': [_guiInputs({ d: 'string' })],
      }),
      [
        _gslAccordions({
          decorator: () => () => ({
            sections: [{ label: 'Dynamic', uid: 'dynamic' }],
            renderMode: 'activeOnly' as const,
          }),
        }),
      ],
    );
    const raw = getRawChild(result, 0);
    const w = resolveDynamic(raw) as LayoutWidget & {
      props?: { renderMode?: string };
    };

    expect(w.kind).toBe('layout');
    expect(w.type).toBe('accordion');
    expect(w.props?.renderMode).toBe('activeOnly');
  });
});
