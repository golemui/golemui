declare module 'subscript/justin' {
  type OperatorFunction = (...args: any[]) => any;

  export function parse(s: string): any;
  export function compile(node: Node): ((ctx?: any) => any) | OperatorFunction;
}
