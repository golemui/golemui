/**
 * Serializes a FormDef object for display purposes only.
 * WARNING: This function serializes functions as strings for visualization.
 * The output should NEVER be deserialized and executed.
 */
export function serializeFormDefForDisplay(obj: any, indent = 0): string {
  const indentStr = '  '.repeat(indent);
  const nextIndentStr = '  '.repeat(indent + 1);

  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  if (typeof obj === 'string') return JSON.stringify(obj);
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);

  if (typeof obj === 'function') {
    // Show the function source code for better visibility
    const fnStr = obj.toString();
    // Format multi-line functions nicely
    if (fnStr.includes('\n')) {
      const lines = fnStr.split('\n');
      return lines.map((line: string, idx: number) => (idx === 0 ? line : nextIndentStr + line)).join('\n');
    }
    return fnStr;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';

    try {
      const items = obj.map((item) => nextIndentStr + serializeFormDefForDisplay(item, indent + 1));
      return '[\n' + items.join(',\n') + '\n' + indentStr + ']';
    } catch (_error) {
      return '[Circular Reference or Serialization Error]';
    }
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';

    try {
      const items = keys.map((key) => {
        const value = obj[key];
        const serializedValue = serializeFormDefForDisplay(value, indent + 1);
        return `${nextIndentStr}${JSON.stringify(key)}: ${serializedValue}`;
      });

      return '{\n' + items.join(',\n') + '\n' + indentStr + '}';
    } catch (_error) {
      return '{Circular Reference or Serialization Error}';
    }
  }

  return String(obj);
}
