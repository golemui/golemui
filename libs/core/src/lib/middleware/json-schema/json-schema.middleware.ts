import { Form } from '../../form';
import { FormWidget, LayoutWidget } from '../../form-widget';
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
export type SchemaToWidgetMap = Record<
  JsonSchemaTypeMap,
  (schema: JSONSchemaObject, ...rest: any[]) => FormWidget
>;

/**
 * Use this middleware to convert a JSON schema into a JSON form.
 *
 * @example
 *  protected middlewares = [
 *    Core.devToolsMiddleware(),
 *    Core.jsonSchemaMiddleware(golemSchemaToFieldMap(GolemValidators.jsonSchemaValidators)),
 *  ];
  ];
 * @example
 *  <gui-form [middlewares]="middlewares" />
 */
export const jsonSchemaMiddleware =
  (schemaToWidgetMap: SchemaToWidgetMap): Middleware<State, Action> =>
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
          schemaToWidgetMap,
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
  schemaToWidgetMap: SchemaToWidgetMap,
  resolveRef: RefResolver,
  path: string[] = [],
): FormWidget {
  // TODO: Resolve refs
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref);
    return schemaToForm(resolved, schemaToWidgetMap, resolveRef, path);
  }

  // oneOf --> tabs XOR
  if (schema.oneOf) {
    const tabs = schemaToWidgetMap.oneOf(schema) as LayoutWidget;
    return {
      ...tabs,
      props: {},
      children: schema.oneOf.map((s) => schemaToForm(s, schemaToWidgetMap, resolveRef, path)),
    };
  }

  // anyOf --> tabs OR
  if (schema.anyOf) {
    const tabs = schemaToWidgetMap.anyOf(schema) as LayoutWidget;
    return {
      ...tabs,
      props: {},
      children: schema.anyOf.map((s) => schemaToForm(s, schemaToWidgetMap, resolveRef, path)),
    };
  }

  //
  // Object --> always a vertical flex
  //
  if (schema.type === 'object') {
    const children: FormWidget[] = [];
    if (schema.properties) {
      for (const [key, subschema] of Object.entries(schema.properties)) {
        const childPath = [...path, key];
        const child = schemaToForm(subschema, schemaToWidgetMap, resolveRef, childPath);
        children.push(child);
      }
    }
    return schemaToWidgetMap.object(schema, children);
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
    return schemaToWidgetMap.enum(schema, path.join('.'));
  }

  //
  // Leaf primitives
  //
  const mapFn = schemaToWidgetMap[schema.type as keyof typeof schemaToWidgetMap];
  if (mapFn) {
    return mapFn(schema, path.join('.'));
  }

  // fallback
  return schemaToWidgetMap.fallback(schema);
}
