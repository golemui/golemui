export const submitButton: any = {
  title: 'Configure the submit button',
  description: 'Configure the submit button',
  formDef: {
    name: 'string',
    age: 'number',
    height: 'number',
    married: 'boolean',
  },
  formConfig: {
    submitButton: ({ errors }: { errors: boolean }) => ({
      enabled: !errors,
      onSubmit: (data: any) => console.log(data),
    }),
  },
};

export const conditionalFields: any = {
  title: 'Have groups with conditional fields',
  description: 'Have conditional fields',
  formDef: [
    {
      married: 'boolean',
      religious: 'boolean',
    },
    [
      '_section',
      ['showIfMarried'],
      {
        partnerName: 'string',
        yearsTogether: 'boolean',
      },
    ],
    [
      '_section',
      ['showIfReligious'],
      {
        religion: 'string',
        favouriteGod: 'string',
      },
    ],
    [
      '_section',
      ['showIfMarried_AND_showIfReligious'],
      {
        weddingChurchName: 'string',
      },
    ],
  ],
  formConfig: {
    tags: {
      showIfMarried: ({ data }: { data: any }) => ({
        visible: data.married,
      }),
      showIfReligious: ({ data }: { data: any }) => ({
        visible: data.religious,
      }),
    },
  },
};

export const freeContent: any = {
  title: 'Allow me to put random stuff',
  description: 'Allow me to put random stuff',
  formDef: [
    () => <h1>Header</h1>,
    {
      name: 'string',
      age: 'number',
    },
    () => <p>You are the best!</p>,
    {
      height: 'number',
      married: 'boolean',
    },
  ],
};

export const friendlyInputs: any = {
  title: 'Inputs should allow me cools stuff',
  description: 'Inputs should allow me cools stuff',
  formDef:
    {
      name: {
        type: 'text',
        labelRenderer: (label: string) => <div>
          {label.toUpperCase()} <image ></image>
        </div>,
      },
      age: 'number',
    },

};
