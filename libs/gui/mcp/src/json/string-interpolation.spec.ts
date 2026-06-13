import { lintStringInterpolations } from './string-interpolation';

describe('lintStringInterpolations', () => {
  it('returns no findings for a form with no template strings', () => {
    const form = {
      form: [{ uid: 'a', kind: 'input', type: 'textinput', path: 'name' }],
    };
    expect(lintStringInterpolations(form)).toHaveLength(0);
  });

  it('returns no findings for a valid template', () => {
    const form = {
      form: [
        {
          uid: 'a',
          kind: 'display',
          type: 'alert',
          props: { text: 'Hello {{$form.name}}' },
        },
      ],
    };
    expect(lintStringInterpolations(form)).toHaveLength(0);
  });

  it('returns no findings for $meta, $errors, $formIsInvalid', () => {
    const form = {
      form: [
        {
          uid: 'a',
          kind: 'display',
          type: 'alert',
          props: {
            text: '{{$meta.status}} {{$errors.field}} {{$formIsInvalid}}',
          },
        },
      ],
    };
    expect(lintStringInterpolations(form)).toHaveLength(0);
  });

  describe('S1 — empty slot', () => {
    it('flags {{}}', () => {
      const form = {
        form: [{ uid: 'a', kind: 'display', type: 'alert', props: { text: 'Value: {{}}' } }],
      };
      const findings = lintStringInterpolations(form);
      expect(findings).toHaveLength(1);
      expect(findings[0].message).toMatch(/empty/i);
    });

    it('flags {{   }}', () => {
      const form = {
        form: [{ uid: 'a', kind: 'display', type: 'alert', props: { text: '{{   }}' } }],
      };
      const findings = lintStringInterpolations(form);
      expect(findings).toHaveLength(1);
      expect(findings[0].message).toMatch(/empty/i);
    });
  });

  describe('S2 — missing scope reference', () => {
    it('flags a slot with no $form / $meta / $errors / $formIsInvalid reference', () => {
      const form = {
        form: [{ uid: 'a', kind: 'display', type: 'alert', props: { text: '{{userName}}' } }],
      };
      const findings = lintStringInterpolations(form);
      expect(findings).toHaveLength(1);
      expect(findings[0].message).toMatch(/\$form/);
    });
  });

  describe('S3 — unbalanced delimiters', () => {
    it('flags a string with more {{ than }}', () => {
      const form = {
        form: [{ uid: 'a', kind: 'display', type: 'alert', props: { text: '{{$form.name' } }],
      };
      const findings = lintStringInterpolations(form);
      expect(findings).toHaveLength(1);
      expect(findings[0].message).toMatch(/unbalanced/i);
    });

    it('flags a string with more }} than {{', () => {
      const form = {
        form: [{ uid: 'a', kind: 'display', type: 'alert', props: { text: '$form.name}}' } }],
      };
      const findings = lintStringInterpolations(form);
      expect(findings).toHaveLength(1);
      expect(findings[0].message).toMatch(/unbalanced/i);
    });
  });

  describe('S4 — assignment operator', () => {
    it('flags a single = inside a slot', () => {
      const form = {
        form: [
          {
            uid: 'a',
            kind: 'display',
            type: 'alert',
            props: { text: '{{$form.x = 1}}' },
          },
        ],
      };
      const findings = lintStringInterpolations(form);
      expect(findings.some((f) => f.message.includes('assignment'))).toBe(true);
    });

    it('does not flag === inside a slot', () => {
      const form = {
        form: [
          {
            uid: 'a',
            kind: 'display',
            type: 'alert',
            props: { text: "{{$form.x === 'y' ? 'yes' : 'no'}}" },
          },
        ],
      };
      expect(lintStringInterpolations(form)).toHaveLength(0);
    });
  });

  describe('S5 — nested {{', () => {
    it('flags a slot whose content contains {{', () => {
      const form = {
        form: [
          {
            uid: 'a',
            kind: 'display',
            type: 'alert',
            props: { text: '{{$form.x {{nested}}}}' },
          },
        ],
      };
      const findings = lintStringInterpolations(form);
      expect(findings.some((f) => f.message.includes('nested'))).toBe(true);
    });
  });

  it('reports the correct JSON path', () => {
    const form = {
      form: [{ uid: 'a', kind: 'display', type: 'alert', props: { text: '{{noScope}}' } }],
    };
    const findings = lintStringInterpolations(form);
    expect(findings[0].path).toBe('/form/0/props/text');
  });

  it('does not flag {{...}} inside defaultValue', () => {
    const form = {
      form: [
        {
          uid: 'a',
          kind: 'input',
          type: 'textinput',
          path: 'name',
          defaultValue: '{{$form.other}}',
        },
      ],
    };
    expect(lintStringInterpolations(form)).toHaveLength(0);
  });

  it('does not flag {{...}} inside a state-suffixed defaultValue', () => {
    const form = {
      form: [
        {
          uid: 'a',
          kind: 'input',
          type: 'textinput',
          path: 'name',
          'defaultValue.vip': '{{$form.other}}',
        },
      ],
    };
    expect(lintStringInterpolations(form)).toHaveLength(0);
  });

  describe('i18n param expressions', () => {
    it('returns no findings for a valid bare scope expression param', () => {
      const form = {
        form: [
          {
            uid: 'a',
            kind: 'display',
            type: 'alert',
            props: { text: { key: 'greeting', params: { name: '$form.firstName' } } },
          },
        ],
      };
      expect(lintStringInterpolations(form)).toHaveLength(0);
    });

    it('returns no findings for a valid expression with operators', () => {
      const form = {
        form: [
          {
            uid: 'a',
            kind: 'display',
            type: 'alert',
            props: {
              text: {
                key: 'full',
                params: { fullName: "$form.firstName + ' ' + $form.lastName" },
              },
            },
          },
        ],
      };
      expect(lintStringInterpolations(form)).toHaveLength(0);
    });

    it('returns no findings for a static constant param', () => {
      const form = {
        form: [
          {
            uid: 'a',
            kind: 'display',
            type: 'alert',
            props: { text: { key: 'greeting', params: { hello: 'Hola' } } },
          },
        ],
      };
      expect(lintStringInterpolations(form)).toHaveLength(0);
    });

    describe('P1 — param wrapped in {{ }} delimiters', () => {
      it('flags a param value wrapped in {{ }}', () => {
        const form = {
          form: [
            {
              uid: 'a',
              kind: 'display',
              type: 'alert',
              props: { text: { key: 'greeting', params: { name: '{{$form.firstName}}' } } },
            },
          ],
        };
        const findings = lintStringInterpolations(form);
        expect(findings).toHaveLength(1);
        expect(findings[0].message).toMatch(/delimiters/i);
      });
    });

    describe('P2 — assignment operator in scope expression', () => {
      it('flags a bare scope expression with assignment =', () => {
        const form = {
          form: [
            {
              uid: 'a',
              kind: 'display',
              type: 'alert',
              props: { text: { key: 'greeting', params: { name: "$form.role = 'admin'" } } },
            },
          ],
        };
        const findings = lintStringInterpolations(form);
        expect(findings.some((f) => f.message.includes('assignment'))).toBe(true);
      });

      it('does not flag === in a scope expression', () => {
        const form = {
          form: [
            {
              uid: 'a',
              kind: 'display',
              type: 'alert',
              props: {
                text: {
                  key: 'role',
                  params: { label: "$form.role === 'admin' ? 'Admin' : 'User'" },
                },
              },
            },
          ],
        };
        expect(lintStringInterpolations(form)).toHaveLength(0);
      });
    });

    it('reports the correct JSON path for a param finding', () => {
      const form = {
        form: [
          {
            uid: 'a',
            kind: 'display',
            type: 'alert',
            props: { text: { key: 'greeting', params: { name: '{{$form.firstName}}' } } },
          },
        ],
      };
      const findings = lintStringInterpolations(form);
      expect(findings[0].path).toBe('/form/0/props/text/params/name');
    });
  });
});
