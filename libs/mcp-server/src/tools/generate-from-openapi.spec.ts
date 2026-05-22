import { describe, expect, it } from 'vitest';
import { generateFromOpenapi } from './generate-from-openapi';

const SAMPLE_DOC = {
  openapi: '3.0.0',
  components: {
    schemas: {
      NewUser: {
        type: 'object',
        required: ['email', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'editor', 'viewer'] },
        },
      },
    },
  },
  paths: {
    '/users': {
      post: {
        operationId: 'createUser',
        summary: 'Create user',
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NewUser' },
            },
          },
        },
      },
    },
    '/users/{id}': {
      get: {
        operationId: 'getUser',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
      },
    },
  },
};

describe('generate_from_openapi', () => {
  it('resolves a POST operation via "METHOD /path"', async () => {
    const r = await generateFromOpenapi({
      document: SAMPLE_DOC as any,
      operation: 'POST /users',
    });
    expect(r.resolvedOperation).toEqual({
      method: 'POST',
      path: '/users',
      operationId: 'createUser',
    });
    expect(r.validation.valid).toBe(true);
    expect(r.unmapped).toEqual([]);

    const form = r.formDefinition.form as any[];
    expect(form[0]).toMatchObject({ kind: 'input', type: 'textinput', path: 'email' });
    expect(form[0].validator).toMatchObject({ format: 'email', required: true });
    expect(form[form.length - 1]).toMatchObject({ kind: 'action', type: 'button', label: 'Create user' });
  });

  it('resolves by operationId', async () => {
    const r = await generateFromOpenapi({
      document: SAMPLE_DOC as any,
      operation: 'createUser',
    });
    expect(r.resolvedOperation.operationId).toBe('createUser');
  });

  it('falls back to parameters when there is no request body', async () => {
    const r = await generateFromOpenapi({
      document: SAMPLE_DOC as any,
      operation: 'GET /users/{id}',
    });
    expect(r.validation.valid).toBe(true);
    const form = r.formDefinition.form as any[];
    expect(form[0]).toMatchObject({ kind: 'input', type: 'textinput', path: 'id' });
  });

  it('throws on unknown operation', async () => {
    await expect(
      generateFromOpenapi({
        document: SAMPLE_DOC as any,
        operation: 'DELETE /nope',
      }),
    ).rejects.toThrow(/not found/);
  });

  it('requires document or documentUrl', async () => {
    await expect(generateFromOpenapi({ operation: 'POST /users' } as any)).rejects.toThrow(
      /document/,
    );
  });
});
