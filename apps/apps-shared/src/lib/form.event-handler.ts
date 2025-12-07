import * as Core from '@golemui/core';

export const onFormEvent = async (event: Core.FormEvent) => {
  const eventHandler = eventHandlers[event.name as keyof typeof eventHandlers];
  if (eventHandler) {
    console.log(`✅ onFormEvent('${event.name}')`);
    await eventHandler(event);
  } else {
    console.groupCollapsed(`⚠️ Unhandled - onFormEvent('${event.name}')`);
    console.log(event.data);
    console.groupEnd();
  }
};

const eventHandlers = {
  async getSubregions(event: Core.FormEvent) {
    const response = await fetch('/data/subregions.json');
    const subregions = await response.json();
    event.callback({
      type: 'OVERRIDE_FIELD_PROP',
      payload: { path: 'selects.subregion', prop: 'options', value: subregions },
    });
  },
  async getCountries(event: Core.FormEvent) {
    const response = await fetch('/data/countries.json');
    const countries = await response.json();
    const subregion = event.data['selects'].subregion as string;
    event.callback({
      type: 'OVERRIDE_FIELD_PROP',
      payload: {
        path: 'selects.country',
        prop: 'options',
        value: countries[subregion.toLowerCase()],
      },
    });
  },
};
