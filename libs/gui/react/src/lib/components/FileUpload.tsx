import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import type { Dependencies, FileItem, FileUploadProps } from '@golemui/gui-shared/internals';
import { useCallback } from 'react';
import { GuiFileUploadReact } from '../web-components';
import '../styles.scss';

export function FileUpload(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<FileItem | null>;
  const {
    uid,
    errors,
    value,
    isTouched,
    templateData,
    onValueChanged,
    onBlur,
    injectValidationIssues,
  } = useInputWidget<FileItem | null, FileUploadProps>(widget);

  const handleChange = useCallback(
    (e: Event) => onValueChanged((e as CustomEvent).detail.value as FileItem | null),
    [onValueChanged],
  );

  const handleInputError = useCallback(
    (e: Event) => {
      const message = (e as CustomEvent).detail.message as string | null;
      injectValidationIssues(message ? [message] : null);
    },
    [injectValidationIssues],
  );

  const label = templateData.label as string;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Validator)?.required;

  return (
    <div className="gui-file-upload gui-field" style={{ flex: templateData.size }}>
      <GuiFileUploadReact
        uid={uid}
        path={widget.path}
        label={label}
        hint={templateData.hint}
        errors={errors}
        touched={isTouched}
        required={isRequired}
        disabled={isDisabled}
        readOnly={isReadonly}
        value={value ?? null}
        dependencies={templateData.deps as Dependencies}
        icon={templateData.icon}
        accept={templateData.accept}
        maxSize={templateData.maxSize}
        buttonLabel={templateData.buttonLabel as string | undefined}
        removeAriaLabel={templateData.removeAriaLabel as string | undefined}
        cancelAriaLabel={templateData.cancelAriaLabel as string | undefined}
        retryAriaLabel={templateData.retryAriaLabel as string | undefined}
        removeIcon={templateData.removeIcon}
        retryIcon={templateData.retryIcon}
        maxSizeMessage={templateData.maxSizeMessage as string | undefined}
        acceptMessage={templateData.acceptMessage as string | undefined}
        missingServiceMessage={templateData.missingServiceMessage as string | undefined}
        uploadedMessage={templateData.uploadedMessage as string | undefined}
        removedMessage={templateData.removedMessage as string | undefined}
        failedMessage={templateData.failedMessage as string | undefined}
        onChange={handleChange}
        onBlur={onBlur}
        onInputError={handleInputError}
      ></GuiFileUploadReact>
    </div>
  );
}
