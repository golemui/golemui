import * as Core from '@formforge/core';
import { useField } from '@formforge/react';
import clsx from 'clsx';
import '../styles.scss';
import styles from './Alert.module.scss';

type AlertProps = {
  text: string;
  level?: 'default' | 'info' | 'success' | 'warning' | 'error';
};

export function Alert(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.Field;
  const { uid, props } = useField<AlertProps>(field);

  return (
    <div className="field" id={uid}>
      <div className={clsx(styles.alert, styles[props.level || 'default'])}>
        {props.text}
      </div>
    </div>
  );
}
