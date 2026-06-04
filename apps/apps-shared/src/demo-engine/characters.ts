/**
 * Framework "classes" — pure data, no React.
 * ==========================================
 * Lives apart from engine.tsx so the vanilla quests-portal landing can import
 * the character metadata (names, personas, blurbs, sprite columns) WITHOUT
 * pulling React into its bundle. engine.tsx re-exports these for back-compat,
 * so existing `@golemui/demo-engine` consumers are unaffected.
 */

export type Framework = 'react' | 'angular' | 'lit' | 'vue' | 'vanilla';

export interface Character {
  id: Framework;
  name: string;
  klass: string;
  color: string;
  shadow: string;
  monogram: string;
  /** Column in the sprite sheet (sprites_sheet.png: 5 cols × 2 idle rows). */
  col: number;
  /** A catchy one-liner shown under the character on the select screen. */
  blurb: string;
}

export const CHARACTERS: Character[] = [
  {
    id: 'react',
    name: 'REACT',
    klass: 'THE WIZARD',
    color: '#61dafb',
    shadow: '#0e7a9e',
    monogram: 'R',
    col: 1,
    blurb: 'Bends the virtual DOM to its will.',
  },
  {
    id: 'angular',
    name: 'ANGULAR',
    klass: 'THE PALADIN',
    color: '#dd0031',
    shadow: '#7a0019',
    monogram: 'A',
    col: 0,
    blurb: 'Bound by strict architectural oaths.',
  },
  {
    id: 'lit',
    name: 'LIT',
    klass: 'THE ROGUE',
    color: '#324fff',
    shadow: '#1a2c99',
    monogram: 'L',
    col: 3,
    blurb: 'Tiny, fast, strikes from the shadows.',
  },
  {
    id: 'vue',
    name: 'VUE',
    klass: 'THE DRUID',
    color: '#41b883',
    shadow: '#1f6e4d',
    monogram: 'V',
    col: 2,
    blurb: 'Reactive roots, calm progressive growth.',
  },
  {
    id: 'vanilla',
    name: 'JS',
    klass: 'THE BARD',
    color: '#f7df1e',
    shadow: '#8a7a00',
    monogram: '{}',
    col: 4,
    blurb: 'No dependencies — just vibes and a lute.',
  },
];
