import styles from './heading.component.module.scss';

export function HeadingComponent() {
  return (
    <div className={styles.field}>
      <h1 className={styles.heading}>Heading</h1>
    </div>
  );
}

export default HeadingComponent;
