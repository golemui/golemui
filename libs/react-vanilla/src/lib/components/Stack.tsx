import * as Core from '@golemui/core';
import { FieldRenderer, useLayoutField } from '@golemui/react';
import { StackProps } from '@golemui/shared-vanilla';
import { useCallback } from 'react';
import '../styles.scss';

export function Stack(fieldInstance: Core.WithWidget) {
  const field = fieldInstance.widget as Core.LayoutWidget;
  const { uid, children, templateData } = useLayoutField<StackProps>(field);

  const renderFields = useCallback(() => {
    return children.map((field) => (
      <FieldRenderer key={field.uid} field={field as Core.NonFunctionWidget<string>} />
    ));
  }, [children]);

  const direction = templateData.direction === 'horizontal' ? 'gui-stack__field--horizontal' : '';
  return (
    <div className="gui-stack" style={{ flex: templateData.size }}>
      <div className={`gui-stack__field ${direction}`} id={uid}>
        {renderFields()}
      </div>
    </div>
  );
}
