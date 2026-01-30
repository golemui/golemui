import * as Core from '@golemui/core';

export const onFormEvent = async (event: Core.FormEvent) => {
  const eventHandler = eventHandlers[event.name as keyof typeof eventHandlers];
  if (eventHandler) {
    console.log(`✅ onFormEvent('${event.name}')`, event.data);
    await eventHandler(event);
  } else {
    console.groupCollapsed(`⚠️ Unhandled - onFormEvent('${event.name}')`);
    console.log(event.data);
    console.log(event.detail);
    console.groupEnd();
  }
};

const eventHandlers = {
  async getSubregionsForSelect(event: Core.FormEvent) {
    getSubregions(event, 'selects.subregion');
  },
  async getCountriesForSelect(event: Core.FormEvent) {
    const subregion = event.data['selects'].subregion as string;
    getCountries(event, subregion, 'selects.country');
  },
  async getSubregionsForRadio(event: Core.FormEvent) {
    getSubregions(event, 'radiogroups.subregion');
  },
  async getCountriesForRadio(event: Core.FormEvent) {
    const subregion = event.data['radiogroups'].subregion as string;
    getCountries(event, subregion, 'radiogroups.country');
  },
  async searchProductForDropdown(event: Core.FormEvent) {
    getProducts(event, event.detail, 'dropdowns.searchAsYouType');
  },
  async getFromAirports(event: Core.FormEvent) {
    getAirports(event, event.detail, 'from');
  },
  async getToAirports(event: Core.FormEvent) {
    getAirports(event, event.detail, 'to');
  },
};

async function getSubregions(event: Core.FormEvent, path: Core.DotPath) {
  const response = await fetch('/data/subregions.json');
  const subregions = await response.json();
  event.callback({
    type: 'OVERRIDE_FIELD_PROP',
    payload: { path, prop: 'options', value: subregions },
  });
}

async function getCountries(event: Core.FormEvent, subregion: string, path: Core.DotPath) {
  const response = await fetch('/data/countries.json');
  const countries = await response.json();
  event.callback({
    type: 'OVERRIDE_FIELD_PROP',
    payload: {
      path,
      prop: 'options',
      value: countries[subregion.toLowerCase()],
    },
  });
}

async function getProducts(event: Core.FormEvent, filter: string, path: Core.DotPath) {
  const response = await fetch('/data/products.json');
  const products = await response.json();
  setTimeout(() => {
    const filteredProducts = filter
      ? products.filter((p: any) => JSON.stringify(p).includes(filter)).slice(0, 10)
      : products.slice(0, 10);
    event.callback({
      type: 'OVERRIDE_FIELD_PROP',
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

async function getAirports(event: Core.FormEvent, filter: string, path: Core.DotPath) {
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
      type: 'OVERRIDE_FIELD_PROP',
      payload: {
        path,
        prop: 'items',
        value: filteredAirports,
      },
    });

    // From and To have been selected, we load the disabled dates for those flights
    if (event.data['from'] && event.data['to']) {
      event.callback({
        type: 'OVERRIDE_FIELD_PROP',
        payload: {
          path: 'dates',
          prop: 'disabledRanges',
          value: [{ start: '2026-02-09', end: '2026-02-10' }, { start: '2026-02-17' }],
        },
      });
    }
  }, 500);
}
