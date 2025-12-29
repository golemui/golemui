import * as React from '@golemui/react';
import GolemForm from '../wrappers/golemForm.component';
import { FormDefFacade } from '../services/formDef/formDef.domain';

interface DemoFormDisplayProps<T extends Record<string, any>> {
  title: string;
  description: string;
  formDef?: FormDefFacade<T>;
  formData?: T;
}

export function DemoFormDisplay<T extends Record<string, any>>({
  title,
  description,
  formDef,
  formData,
}: DemoFormDisplayProps<T>) {
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
          marginBottom: '1rem',
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
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
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
              }}
            >
              <code style={{ color: '#333' }}>{JSON.stringify(formDef, null, 2)}</code>
            </pre>
          </div>
        )}

        {formData && (
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
              formData
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
              }}
            >
              <code style={{ color: '#333' }}>{JSON.stringify(formData, null, 2)}</code>
            </pre>
          </div>
        )}
      </div>

      {formDef && (
        <div
          style={{
            borderTop: '1px solid #e0e0e0',
            paddingTop: '1.5rem',
          }}
        >
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
  );
}

export default DemoFormDisplay;
