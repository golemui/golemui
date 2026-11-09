/**
 * Moves the code that several generated validator modules contain into one shared module.
 *
 * ajv standalone code is self-contained: every module carries its own copy of the functions and
 * schema constants it reaches, so the validators of `common.schema.json` (`localizable`,
 * `boolOrWhen`, `on`, ...) are copied into nearly every widget module. All modules come from one
 * Ajv instance, which names each compiled function and constant once (`validate23`,
 * `schema31`), so a name declared in two modules is the same declaration in both. Each
 * declaration found in two or more modules moves to `shared.js`, and the modules import it.
 */
import ts from 'typescript';

/** One generated module before sharing: its runtime-helper imports and its code. */
export type StandaloneModule = { imports: string[]; body: string };

export type SharedModules = {
  /** Module path -> source, without the generated header. */
  modules: Map<string, string>;
  /** The source of the shared module, or null when nothing is shared. */
  shared: string | null;
};

type Statement = {
  /** The name it declares, or null for a statement that declares nothing (`validate1.x = ...`). */
  name: string | null;
  /** The name the sharing is decided on: the declared name, or the assigned function's name. */
  key: string;
  text: string;
};

/**
 * Shares the declarations that appear in two or more modules.
 * @param modules - Generated modules keyed by module path, in a stable order.
 * @param sharedModulePath - Path of the shared module, relative like the module paths.
 */
export function shareDeclarations(
  modules: Map<string, StandaloneModule>,
  sharedModulePath: string,
): SharedModules {
  const parsed = new Map<string, { exports: string[]; statements: Statement[] }>();
  const usersByKey = new Map<string, Set<string>>();
  const textByKey = new Map<string, string>();
  for (const [modulePath, { body }] of modules) {
    const { exports, statements } = parseModule(modulePath, body);
    parsed.set(modulePath, { exports, statements });
    for (const statement of statements) {
      const known = textByKey.get(`${statement.key}|${statement.name ?? ''}`);
      if (known !== undefined && known !== statement.text) {
        throw new Error(`"${statement.key}" has two different declarations; it cannot be shared`);
      }
      textByKey.set(`${statement.key}|${statement.name ?? ''}`, statement.text);
      const users = usersByKey.get(statement.key) ?? new Set<string>();
      users.add(modulePath);
      usersByKey.set(statement.key, users);
    }
  }
  const isShared = (statement: Statement): boolean =>
    (usersByKey.get(statement.key)?.size ?? 0) > 1;

  // First appearance order keeps each statement after the ones it followed in its module.
  const sharedStatements: Statement[] = [];
  const seenShared = new Set<string>();
  const result = new Map<string, string>();
  for (const [modulePath, { exports, statements }] of parsed) {
    const own: string[] = [];
    const imported: string[] = [];
    for (const statement of statements) {
      if (!isShared(statement)) {
        own.push(statement.text);
        continue;
      }
      if (statement.name !== null) imported.push(statement.name);
      if (!seenShared.has(statement.text)) {
        seenShared.add(statement.text);
        sharedStatements.push(statement);
      }
    }
    const code = [...own, ...exports].join('\n');
    const helperImports = modules
      .get(modulePath)!
      .imports.filter((line) => usesBinding(code, line));
    const sharedImport =
      imported.length > 0
        ? `import { ${imported.join(', ')} } from "${relativeImport(modulePath, sharedModulePath)}";\n`
        : '';
    result.set(modulePath, `${helperImports.join('')}${sharedImport}${code}\n`);
  }

  if (sharedStatements.length === 0) {
    return { modules: result, shared: null };
  }
  const sharedCode = sharedStatements.map((statement) => statement.text).join('\n');
  const allHelperImports = [...new Set([...modules.values()].flatMap(({ imports }) => imports))];
  const sharedNames = sharedStatements.flatMap((statement) =>
    statement.name === null ? [] : [statement.name],
  );
  return {
    modules: result,
    shared:
      allHelperImports.filter((line) => usesBinding(sharedCode, line)).join('') +
      `${sharedCode}\nexport { ${sharedNames.join(', ')} };\n`,
  };
}

/** True when `code` uses the `const <binding> = ...` declared by a runtime-helper import. */
function usesBinding(code: string, importLines: string): boolean {
  const binding = importLines.match(/\nconst ([A-Za-z0-9_$]+) =/)?.[1];
  return binding !== undefined && new RegExp(`\\b${binding}\\b`).test(code);
}

function relativeImport(fromModulePath: string, toModulePath: string): string {
  const depth = fromModulePath.split('/').length - 1;
  return `${depth === 0 ? './' : '../'.repeat(depth)}${toModulePath}.js`;
}

/** Splits ajv standalone code into its top-level declarations and its exports. */
function parseModule(
  modulePath: string,
  body: string,
): { exports: string[]; statements: Statement[] } {
  const sourceFile = ts.createSourceFile(
    `${modulePath}.js`,
    body,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.JS,
  );
  const exports: string[] = [];
  const statements: Statement[] = [];
  for (const statement of sourceFile.statements) {
    const text = statement.getText(sourceFile);
    if (ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression)) {
      continue; // "use strict": modules are strict anyway.
    }
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      statements.push({ name: statement.name.text, key: statement.name.text, text });
    } else if (
      ts.isVariableStatement(statement) &&
      statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      exports.push(text);
    } else if (
      ts.isVariableStatement(statement) &&
      statement.declarationList.declarations.length === 1 &&
      ts.isIdentifier(statement.declarationList.declarations[0]!.name)
    ) {
      const name = (statement.declarationList.declarations[0]!.name as ts.Identifier).text;
      statements.push({ name, key: name, text });
    } else if (
      ts.isExpressionStatement(statement) &&
      ts.isBinaryExpression(statement.expression) &&
      ts.isPropertyAccessExpression(statement.expression.left) &&
      ts.isIdentifier(statement.expression.left.expression)
    ) {
      // `validate12.evaluated = {...}` goes with the function it annotates.
      statements.push({ name: null, key: statement.expression.left.expression.text, text });
    } else {
      throw new Error(`Unexpected top-level statement in ${modulePath}: ${text.slice(0, 80)}`);
    }
  }
  return { exports, statements };
}
