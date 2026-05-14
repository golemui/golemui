import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.list('selection', {
    items: [
      {
        value: 'blog',
        title: 'Blog',
        description: 'A minimalist Markdown blog with RSS feed and dark mode.',
      },
      {
        value: 'docs',
        title: 'Documentation Site',
        description: 'Versioned docs with full-text search and a live playground.',
      },
      {
        value: 'dashboard',
        title: 'Admin Dashboard',
        description: 'Data tables, charts, and role-based auth out of the box.',
      },
      {
        value: 'storefront',
        title: 'E-commerce Storefront',
        description: 'Product catalog, cart, and Stripe checkout wired up.',
      },
      {
        value: 'landing',
        title: 'Marketing Landing',
        description: 'Hero, pricing tiers, and a contact form ready to ship.',
      },
      {
        value: 'portfolio',
        title: 'Developer Portfolio',
        description: 'Showcase projects, embed demos, and host a personal blog.',
      },
    ],
    height: 240,
    itemHeight: 60,
    labelField: 'title',
    valueField: 'value',
    itemRenderer: 'complexListItemRenderer',
    label: 'Pick a starter template',
    uid: 'list_item_renderer',
  }),
];
