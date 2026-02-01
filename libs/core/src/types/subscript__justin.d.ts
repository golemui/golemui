// TODO: This shouldn't be required. There's something in this project's config that breaks subscript's typings
declare module 'subscript/justin' {
  // AST node types
  export type Identifier = string;
  export type Literal = [undefined, any];
  export type Operation = [string, ...AST[]];
  export type AST = Identifier | Literal | Operation;

  // Evaluator function
  export type Evaluator = (ctx?: any) => any;

  export function parse(s: string): AST;
  export function compile(node: AST): Evaluator;
}
