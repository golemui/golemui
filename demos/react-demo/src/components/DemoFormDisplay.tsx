import * as React from '@golemui/react';
import GolemForm from '../wrappers/golemForm.component';
import { FormDefFacade } from '../services/formDef/formDef.domain';

interface DemoFormDisplayProps<T extends Record<string, any>> {
  title: string;
  description: string;
  formDef?: FormDefFacade<T>;
  formData?: T;
  warnings?: string[];
}

export function DemoFormDisplay<T extends Record<string, any>>({
  title,
  description,
  formDef,
  formData,
  warnings,
}: DemoFormDisplayProps<T>) {
  // Custom serializer that converts functions to string representation
  const serializeFormDef = (obj: any, indent: number = 0): string => {
    const indentStr = '  '.repeat(indent);
    const nextIndentStr = '  '.repeat(indent + 1);

    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';
    if (typeof obj === 'string') return JSON.stringify(obj);
    if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);

    if (typeof obj === 'function') {
      // Format function on multiple lines with proper indentation
      const funcStr = obj.toString();
      return funcStr
        .split('\n')
        .map((line, i) => (i === 0 ? line : nextIndentStr + line))
        .join('\n');
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      const items = obj.map((item) => nextIndentStr + serializeFormDef(item, indent + 1));
      return '[\n' + items.join(',\n') + '\n' + indentStr + ']';
    }

    if (typeof obj === 'object') {
      const keys = Object.keys(obj);
      if (keys.length === 0) return '{}';

      const items = keys.map((key) => {
        const value = obj[key];
        const serializedValue = serializeFormDef(value, indent + 1);

        // Check if value is a function to format differently
        if (typeof value === 'function') {
          return `${nextIndentStr}${JSON.stringify(key)}: ${serializedValue}`;
        }

        return `${nextIndentStr}${JSON.stringify(key)}: ${serializedValue}`;
      });

      return '{\n' + items.join(',\n') + '\n' + indentStr + '}';
    }

    return String(obj);
  };

  return (
    <div
      style={{
        marginBottom: '2rem',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '1.5rem',
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: '1.5rem',
          fontSize: '1.5rem',
          color: '#333',
          borderBottom: '2px solid #007bff',
          paddingBottom: '0.5rem',
        }}
      >
        {title}
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
        }}
      >
        {/* Left Column: Description + Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h4
              style={{
                marginTop: 0,
                marginBottom: '0.5rem',
                fontSize: '0.95rem',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Description
            </h4>
            <p style={{ margin: 0, lineHeight: '1.6', color: '#444' }}>{description}</p>
          </div>

          {formDef && (
            <div>
              <h4
                style={{
                  marginTop: 0,
                  marginBottom: '1rem',
                  fontSize: '0.95rem',
                  color: '#666',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Form
              </h4>
              <GolemForm<T> formDef={formDef} formData={formData} />
            </div>
          )}
        </div>

        {/* Right Column: formDef */}
        {formDef && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <h4
                style={{
                  marginTop: 0,
                  marginBottom: '0.5rem',
                  fontSize: '0.95rem',
                  color: '#666',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                formDef
              </h4>
              <pre
                style={{
                  fontSize: '0.8rem',
                  overflow: 'auto',
                  backgroundColor: '#f5f5f5',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  margin: 0,
                  maxHeight: '600px',
                }}
              >
                <code style={{ color: '#333' }}>{serializeFormDef(formDef)}</code>
              </pre>
            </div>

            {warnings && warnings.length > 0 && (
              <div
                style={{
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '4px',
                  padding: '0.75rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '1.2rem',
                      color: '#856404',
                    }}
                  >
                    ⚠️
                  </span>
                  <h5
                    style={{
                      margin: 0,
                      fontSize: '0.85rem',
                      color: '#856404',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Warnings
                  </h5>
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: '1.5rem',
                    fontSize: '0.85rem',
                    color: '#856404',
                    lineHeight: '1.6',
                  }}
                >
                  {warnings.map((warning, index) => (
                    <li key={index} style={{ marginBottom: '0.25rem' }}>
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DemoFormDisplay;
