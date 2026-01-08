import * as Core from '@golemui/core';
import { useControlField } from '@golemui/react';
import { TextareaProps } from '@golemui/shared-vanilla';
import { useCallback, useLayoutEffect, useRef } from 'react';
import '../styles.scss';
import { Errors } from './shared/Errors';

function Counter({
  value,
  validator,
  counterMode,
}: {
  value?: string;
  validator: Core.Validator;
  counterMode: 'remaining' | 'current';
}) {
  const val = value?.length ?? 0;
  return (
    <div
      className={`gui-textarea--counter ${val > validator?.maxLength ? 'gui-textarea--counter__error' : ''}`}
    >
      <span>{counterMode === 'current' ? val : validator?.maxLength - val}</span>
      <span> / {validator?.maxLength}</span>
    </div>
  );
}

export function TextArea(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.ControlField<string>;
  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useControlField<
    string,
    TextareaProps
  >(field);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => onValueChanged(e.target.value),
    [onValueChanged],
  );
  const hint = templateData.hint;
  const placeholder = templateData.placeholder;
  const icon = templateData.icon;
  const showErrors = isTouched && errors && errors.length > 0;
  const isRequired = (templateData.validator as Core.Validator)?.required;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const counterMode = templateData.counterMode;

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (textarea && templateData.autoGrow) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(templateData.minimumHeight ?? 120, textarea.scrollHeight)}px`;
    }
  }, [templateData]);

  return (
    <div className="gui-textarea">
      <label className="gui-label" htmlFor={uid} data-cy={`${uid}_label`}>
        {templateData.label + (isRequired ? ' *' : '')}
        {hint && (
          <div className="gui-field-hint" id={`${uid}_hint`}>
            {hint}
          </div>
        )}
      </label>
      <div className="gui-field">
        <textarea
          id={uid}
          ref={textareaRef}
          data-cy={`${uid}_textarea`}
          className={`${icon ? 'gui-textarea--icon' : ''}`}
          style={{
            height: `${templateData.minimumHeight ?? 120}px`,
            minHeight: `${templateData.minimumHeight ?? 120}px`,
            resize: templateData.autoGrow ? 'none' : 'vertical',
          }}
          required={isRequired}
          value={value ?? ''}
          disabled={isDisabled}
          readOnly={isReadonly}
          placeholder={placeholder ?? undefined}
          onInput={handleChange}
          onBlur={onBlur}
          aria-invalid={showErrors}
          aria-errormessage={showErrors ? `${uid}_errors` : undefined}
          aria-required={isRequired}
          aria-describedby={hint ? `${uid}_hint` : undefined}
        ></textarea>
        {icon && <span className={`${icon} gui-field-icon gui-field-icon--right`}></span>}
      </div>

      <div className="gui-textarea--validation">
        <div>{showErrors && <Errors errors={errors} uid={uid} />}</div>
        <div>
          {counterMode && (
            <Counter value={value} validator={templateData.validator} counterMode={counterMode} />
          )}
        </div>
      </div>
    </div>
  );
}
