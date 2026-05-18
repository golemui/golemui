import type { DotPath, FormEvent } from '@golemui/core';
import i18next from 'i18next';

export const onFormEvent = (event: FormEvent) => {
  const eventHandler = eventHandlers[event.name as keyof typeof eventHandlers];
  if (eventHandler) {
    console.log(`✅ onFormEvent('${event.name}')`, event.data);
    eventHandler(event);
  } else {
    console.groupCollapsed(`⚠️ Unhandled - onFormEvent('${event.name}')`);
    console.log(event.data);
    console.log(event.detail);
    console.groupEnd();
  }
};

const SHARE_URLS: Record<string, (url: string) => string> = {
  twitter: (url) =>
    `https://x.com/intent/tweet?text=${encodeURIComponent('Check out GolemUI Pro!')}&url=${encodeURIComponent(url)}`,
  facebook: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  reddit: (url) =>
    `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent('Check out GolemUI Pro!')}`,
};

const eventHandlers = {
  shareEvent(event: FormEvent) {
    const network = event.detail as string;
    const buildUrl = SHARE_URLS[network];
    if (buildUrl) {
      window.open(buildUrl(window.location.href), '_blank', 'noopener,noreferrer');
    }
  },
  getSubregionsForSelect(event: FormEvent) {
    getSubregions(event, 'selects.subregion');
  },
  getCountriesForSelect(event: FormEvent) {
    const subregion = event.data['selects'].subregion as string;
    getCountries(event, subregion, 'selects.country');
  },
  getSubregionsForRadio(event: FormEvent) {
    getSubregions(event, 'radiogroups.subregion');
  },
  getCountriesForRadio(event: FormEvent) {
    const subregion = event.data['radiogroups'].subregion as string;
    getCountries(event, subregion, 'radiogroups.country');
  },
  searchProductForDropdown(event: FormEvent) {
    getProducts(event, event.detail, 'dropdowns.searchAsYouType');
  },
  getFromAirports(event: FormEvent) {
    getAirports(event, event.detail, 'from');
  },
  getToAirports(event: FormEvent) {
    getAirports(event, event.detail, 'to');
  },
  loadCars(event: FormEvent) {
    getCars(event, '', 'car');
  },
  filterCars(event: FormEvent) {
    getCars(event, (event.detail as string) ?? '', 'car');
  },
  async changeLanguage(event: FormEvent) {
    const lang = (event.data as Record<string, unknown>)['lang'] as string | undefined;
    if (lang) {
      await i18next.changeLanguage(lang);
    }
  },
  evClick(event: FormEvent) {
    const time = new Date().toLocaleTimeString();
    event.callback({
      type: 'OVERRIDE_WIDGET_PROP',
      payload: { path: 'evClickResult', prop: 'hint', value: `Clicked at ${time}.` },
    });
  },
  evChange(event: FormEvent) {
    const text = String((event.data as any).evSource ?? '');
    event.callback({
      type: 'OVERRIDE_WIDGET_PROP',
      payload: {
        path: 'evChangeResult',
        prop: 'hint',
        value: text ? `Current value: "${text}"` : 'Type something to see live changes.',
      },
    });
  },
  evLoadColors(event: FormEvent) {
    setTimeout(() => {
      event.callback({
        type: 'OVERRIDE_WIDGET_PROP',
        payload: { path: 'evColorPick', prop: 'items', value: ALL_COLORS },
      });
    }, 250);
  },
  evFilterColors(event: FormEvent) {
    const q = String(event.detail ?? '').toLowerCase();
    const filtered = q ? ALL_COLORS.filter((c) => c.label.toLowerCase().includes(q)) : ALL_COLORS;
    event.callback({
      type: 'OVERRIDE_WIDGET_PROP',
      payload: { path: 'evColorPick', prop: 'items', value: filtered },
    });
  },
  evBlur(event: FormEvent) {
    event.callback({
      type: 'OVERRIDE_WIDGET_PROP',
      payload: {
        path: 'evBlurResult',
        prop: 'hint',
        value: 'You tabbed out of the email field.',
      },
    });
  },
  submit(event: FormEvent) {
    const email = (event.data as any).evEmail;
    if (email !== undefined) {
      event.callback({
        type: 'OVERRIDE_WIDGET_PROP',
        payload: {
          path: 'evSubmittedEmail',
          prop: 'hint',
          value: `Submitted: ${email}`,
        },
      });
    }
  },
  send(event: FormEvent) {
    const name = String((event.data as any).userName ?? '');
    event.callback({
      type: 'OVERRIDE_WIDGET_PROP',
      payload: { path: 'userName', prop: 'hint', value: `Submitted as "${name}".` },
    });
    event.callback({
      type: 'OVERRIDE_WIDGET_PROP',
      payload: { uid: 'send-result', prop: 'text', value: `Form submitted! Hello, ${name}.` },
    });
  },
};

const ALL_COLORS = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'orange', label: 'Orange' },
  { value: 'purple', label: 'Purple' },
  { value: 'pink', label: 'Pink' },
  { value: 'teal', label: 'Teal' },
];

const ALL_CARS = [
  { id: 'compact', label: 'Compact', img: '🚗', price: 35 },
  { id: 'suv', label: 'SUV', img: '🚙', price: 75 },
  { id: 'convertible', label: 'Convertible', img: '🏎️', price: 110 },
  { id: 'luxury', label: 'Luxury', img: '🚘', price: 180 },
  { id: 'minivan', label: 'Minivan', img: '🚐', price: 95 },
  { id: 'pickup', label: 'Pickup', img: '🛻', price: 85 },
];

function getCars(event: FormEvent, filter: string, path: DotPath) {
  setTimeout(() => {
    const q = filter.toLowerCase();
    const filtered = q ? ALL_CARS.filter((c) => c.label.toLowerCase().includes(q)) : ALL_CARS;
    event.callback({
      type: 'OVERRIDE_WIDGET_PROP',
      payload: { path, prop: 'items', value: filtered },
    });
  }, 250);
}

async function getSubregions(event: FormEvent, path: DotPath) {
  const response = await fetch('/data/subregions.json');
  const subregions = await response.json();
  event.callback({
    type: 'OVERRIDE_WIDGET_PROP',
    payload: { path, prop: 'options', value: subregions },
  });
}

async function getCountries(event: FormEvent, subregion: string, path: DotPath) {
  const response = await fetch('/data/countries.json');
  const countries = await response.json();
  event.callback({
    type: 'OVERRIDE_WIDGET_PROP',
    payload: {
      path,
      prop: 'options',
      value: countries[subregion.toLowerCase()],
    },
  });
}

async function getProducts(event: FormEvent, filter: string, path: DotPath) {
  const response = await fetch('/data/products.json');
  const products = await response.json();
  setTimeout(() => {
    const filteredProducts = filter
      ? products.filter((p: any) => JSON.stringify(p).includes(filter)).slice(0, 10)
      : products.slice(0, 10);
    event.callback({
      type: 'OVERRIDE_WIDGET_PROP',
      payload: {
        path,
        prop: 'items',
        value: filteredProducts,
      },
    });
  }, 500);
}

export type AirportItem = {
  iata: string;
  lon: string;
  iso: string;
  status: number;
  name: string;
  continent: string;
  type: string;
  lat: string;
  size: string;
};

async function getAirports(event: FormEvent, filter: string, path: DotPath) {
  const response = await fetch(
    'https://raw.githubusercontent.com/jbrooksuk/JSON-Airports/refs/heads/master/airports.json',
  );
  const airports = await response.json();
  setTimeout(() => {
    const filteredAirports = filter
      ? airports
          .filter(
            (airport: AirportItem) =>
              airport.iata.toLowerCase().includes(filter.toLowerCase()) ||
              airport.name?.toLowerCase().includes(filter.toLowerCase()),
          )
          .slice(0, 10)
      : airports.slice(0, 10);
    event.callback({
      type: 'OVERRIDE_WIDGET_PROP',
      payload: {
        path,
        prop: 'items',
        value: filteredAirports,
      },
    });

    // From and To have been selected, we load the disabled dates for those flights
    if (event.data['from'] && event.data['to']) {
      event.callback({
        type: 'OVERRIDE_WIDGET_PROP',
        payload: {
          path: 'dates',
          prop: 'disabledRanges',
          value: [{ start: '2026-02-09', end: '2026-02-10' }, { start: '2026-02-17' }],
        },
      });
    }
  }, 500);
}
