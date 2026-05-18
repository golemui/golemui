import { describe, expect, it } from 'vitest';
import { type LayoutWidget, type NonFunctionWidget } from '@golemui/core';
import { _guiAccordion, _gslAccordions, _gslAccordionByUid } from '../index';
import { processDx, getStaticChild, getRawChild, resolveDynamic } from './helpers';
import { _guiTextInput, _guiNumberInput } from '../index';

describe('DX Pipeline — Accordion', () => {
  it('expands _guiAccordion into an accordion layout widget with sections', () => {
    const result = processDx(
      _guiAccordion([
        { label: 'Section A', children: [_guiTextInput('fieldA')] },
        { label: 'Section B', children: [_guiNumberInput('fieldB')] },
      ]),
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
        [
          { label: 'First', children: [_guiTextInput('a')] },
          { label: 'Second', children: [_guiTextInput('b')] },
        ],
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
      _guiAccordion([
        { label: 'Details', children: [_guiTextInput('firstName'), _guiTextInput('lastName')] },
      ]),
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
      _guiAccordion([{ label: 'Info', children: [_guiTextInput('x')] }], { renderMode: 'all' }),
      [_gslAccordions({ override: { renderMode: 'activeOnly' } })],
    );
    const w = getStaticChild(result, 0) as {
      props?: { renderMode?: string };
    };

    expect(w.props?.renderMode).toBe('activeOnly');
  });

  it('applies GSL byId selector override', () => {
    const result = processDx(
      _guiAccordion([{ label: 'Info', children: [_guiTextInput('x')] }], {
        uid: 'my-accordion',
        singleOpen: false,
      }),
      [_gslAccordionByUid('my-accordion', { override: { singleOpen: true } })],
    );
    const w = getStaticChild(result, 0) as {
      props?: { singleOpen?: boolean };
    };

    expect(w.props?.singleOpen).toBe(true);
  });

  it('supports dynamic callback producing a FunctionWidget', () => {
    const result = processDx(
      _guiAccordion([{ label: 'Dynamic', children: [_guiTextInput('d')] }]),
      [
        _gslAccordions({
          override: () => () => ({
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
