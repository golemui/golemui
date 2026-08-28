import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import type { Dependencies, FileItem, MultiFileUploadProps } from '@golemui/gui-shared/internals';
import { useCallback } from 'react';
import { GuiMultiFileUploadReact } from '../web-components';
import '../styles.scss';

export function MultiFileUpload(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<FileItem[]>;
  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
    FileItem[],
    MultiFileUploadProps
  >(widget);

  const handleChange = useCallback(
    (e: Event) => onValueChanged((e as CustomEvent).detail.value as FileItem[]),
    [onValueChanged],
  );

  const label = templateData.label as string;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Validator)?.required;

  return (
    <div className="gui-multi-file-upload gui-field" style={{ flex: templateData.size }}>
      <GuiMultiFileUploadReact
        uid={uid}
        path={widget.path}
        label={label}
        hint={templateData.hint}
        errors={errors}
        touched={isTouched}
        required={isRequired}
        disabled={isDisabled}
        readOnly={isReadonly}
        values={value ?? []}
        dependencies={templateData.deps as Dependencies}
        icon={templateData.icon}
        accept={templateData.accept}
        maxSize={templateData.maxSize}
        buttonLabel={templateData.buttonLabel as string | undefined}
        removeAriaLabel={templateData.removeAriaLabel as string | undefined}
        cancelAriaLabel={templateData.cancelAriaLabel as string | undefined}
        retryLabel={templateData.retryLabel as string | undefined}
        removeIcon={templateData.removeIcon}
        maxSizeMessage={templateData.maxSizeMessage as string | undefined}
        acceptMessage={templateData.acceptMessage as string | undefined}
        missingServiceMessage={templateData.missingServiceMessage as string | undefined}
        uploadedMessage={templateData.uploadedMessage as string | undefined}
        removedMessage={templateData.removedMessage as string | undefined}
        failedMessage={templateData.failedMessage as string | undefined}
        onChange={handleChange}
        onBlur={onBlur}
      ></GuiMultiFileUploadReact>
    </div>
  );
}
