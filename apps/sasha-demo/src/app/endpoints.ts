import type { EndpointPayload, FieldType } from './deriveFormDefinition';

export type EndpointId = 'profile' | 'orders' | 'feedback';

export interface Endpoint {
  id: EndpointId;
  method: 'GET';
  path: string;
  label: string;
  blurb: string;
  payload: EndpointPayload;
}

export const ENDPOINTS: Endpoint[] = [
  {
    id: 'profile',
    method: 'GET',
    path: '/api/profile/me',
    label: 'My Profile',
    blurb: 'A typed record. The server has no idea what UI will read it.',
    payload: {
      data: {
        name: 'Alex García',
        email: 'alex@example.com',
        joined: '2024-03-12',
        role: 'lead',
        active: true,
      },
      schema: {
        name: { type: 'string', label: 'Full name' },
        email: { type: 'string', label: 'Email', format: 'email' },
        joined: { type: 'date', label: 'Joined' },
        role: {
          type: 'enum',
          label: 'Role',
          options: [
            { value: 'ic', label: 'Individual contributor' },
            { value: 'lead', label: 'Tech lead' },
            { value: 'director', label: 'Director' },
          ],
        },
        active: { type: 'boolean', label: 'Active' },
      },
    },
  },
  {
    id: 'orders',
    method: 'GET',
    path: '/api/orders/mine',
    label: 'My Orders',
    blurb: 'A different shape. The client has not changed a line of code.',
    payload: {
      data: {
        sku: 'GUI-001',
        quantity: 3,
        priority: 'standard',
        giftWrap: false,
      },
      schema: {
        sku: { type: 'string', label: 'SKU' },
        quantity: { type: 'number', label: 'Quantity' },
        priority: {
          type: 'enum',
          label: 'Shipping',
          options: ['standard', 'express', 'overnight'],
        },
        giftWrap: { type: 'boolean', label: 'Gift wrap' },
      },
    },
  },
  {
    id: 'feedback',
    method: 'GET',
    path: '/api/feedback',
    label: 'Feedback',
    blurb: 'Different domain entirely. Same generic renderer on the right.',
    payload: {
      data: {
        topic: 'docs',
        rating: 5,
        message: '',
      },
      schema: {
        topic: {
          type: 'enum',
          label: 'About',
          options: [
            { value: 'docs', label: 'Documentation' },
            { value: 'api', label: 'API ergonomics' },
            { value: 'perf', label: 'Performance' },
          ],
        },
        rating: { type: 'number', label: 'Rating' },
        message: { type: 'string', label: 'Tell us more' },
      },
    },
  },
];

export const FIELD_TYPES: FieldType[] = [
  'string',
  'number',
  'date',
  'enum',
  'boolean',
];
