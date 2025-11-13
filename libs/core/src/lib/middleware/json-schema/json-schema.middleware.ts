import { Form } from '../../form';
import { FormField, LayoutField } from '../../form-field';
import { Action } from '../../store/actions';
import { Middleware, State } from '../../store/model';
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
  (schema: JSONSchemaObject, ...rest: any[]) => FormField
>;

/**
 * Use this middleware to convert a JSON schema into a JSON form.
 *
 * @example
 *  protected middlewares = jsonSchemaMiddleware(vanillaSchemaToFieldMap);
 * @example
 *  <gui-form [middlewares]="middlewares" />
 */
export const jsonSchemaMiddleware =
  (schemaToFieldMap: SchemaToFieldMap): Middleware<State, Action> =>
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
        } as Form;
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
): FormField {
  // TODO: Resolve refs
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref);
    return schemaToForm(resolved, schemaToFieldMap, resolveRef, path);
  }

  // oneOf --> tabs XOR
  if (schema.oneOf) {
    const tabs = schemaToFieldMap.oneOf(schema) as LayoutField;
    return {
      ...tabs,
      props: {},
      children: schema.oneOf.map((s) => schemaToForm(s, schemaToFieldMap, resolveRef, path)),
    };
  }

  // anyOf --> tabs OR
  if (schema.anyOf) {
    const tabs = schemaToFieldMap.anyOf(schema) as LayoutField;
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
    const children: FormField[] = [];
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
