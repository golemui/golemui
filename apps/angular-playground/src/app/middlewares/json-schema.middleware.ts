import * as Core from '@formforge/core';
import { isJsonSchema, JSONSchemaObject, RefResolver } from './json-schema';

type JsonSchemaTypeMap =
  | 'string'
  | 'enum'
  | 'boolean'
  | 'number'
  | 'integer'
  | 'object'
  | 'oneOf'
  | 'anyOf'
  | 'fallback';

/**
 * Maps a Json Schema type to a widget name, so
 */
export type SchemaToFieldMap = Record<
  JsonSchemaTypeMap,
  (schema: JSONSchemaObject, ...rest: any[]) => Core.FormField
>;

export const jsonSchemaMiddleware =
  (schemaToFieldMap: SchemaToFieldMap): Core.Middleware<Core.State, Core.Action> =>
  (_) =>
  (next) =>
  (action) => {
    if (action.type === 'INITIALIZE') {
      let formDef =
        action.payload.formDef === 'string'
          ? JSON.parse(action.payload.formDef)
          : action.payload.formDef;

      if (isJsonSchema(formDef)) {
        formDef = schemaToForm(
          formDef,
          schemaToFieldMap,
          // TODO: Implement Json Schema Ref resolver
          () => {
            throw new Error('Ref resolving not implemented');
          },
        );
        formDef = {
          form: formDef,
        } as Core.Form;
      }
      next({ ...action, payload: { ...action.payload, formDef } });
    } else {
      next(action);
    }
  };

function schemaToForm(
  schema: JSONSchemaObject,
  schemaToFieldMap: SchemaToFieldMap,
  resolveRef: RefResolver,
  path: string[] = [],
): Core.FormField {
  // TODO: Resolve refs
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref);
    return schemaToForm(resolved, schemaToFieldMap, resolveRef, path);
  }

  // oneOf --> tabs XOR
  if (schema.oneOf) {
    const tabs = schemaToFieldMap.oneOf(schema) as Core.LayoutField;
    return {
      ...tabs,
      props: {},
      children: schema.oneOf.map((s) => schemaToForm(s, schemaToFieldMap, resolveRef, path)),
    };
  }

  // anyOf --> tabs OR
  if (schema.anyOf) {
    const tabs = schemaToFieldMap.anyOf(schema) as Core.LayoutField;
    return {
      ...tabs,
      props: {},
      children: schema.anyOf.map((s) => schemaToForm(s, schemaToFieldMap, resolveRef, path)),
    };
  }

  //
  // Object --> always a vertical stack
  //
  if (schema.type === 'object') {
    const children: Core.FormField[] = [];
    if (schema.properties) {
      for (const [key, subschema] of Object.entries(schema.properties)) {
        const childPath = [...path, key];
        const child = schemaToForm(subschema, schemaToFieldMap, resolveRef, childPath);
        children.push(child);
      }
    }
    return schemaToFieldMap.object(schema, children);
  }

  //
  // Arrays not supported
  //
  if (schema.type === 'array') {
    throw new Error(`Arrays not supported yet at path: ${path.join('.')}`);
  }

  //
  // Enum --> select
  //
  if (schema.enum) {
    return schemaToFieldMap.enum(schema, path.join('.'));
  }

  //
  // Leaf primitives
  //
  const mapFn = schemaToFieldMap[schema.type as keyof typeof schemaToFieldMap];
  if (mapFn) {
    return mapFn(schema, path.join('.'));
  }

  // fallback
  return schemaToFieldMap.fallback(schema);
}
