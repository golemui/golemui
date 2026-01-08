export function Errors({ errors, uid }: { errors: string[]; uid: string }) {
  return (
    <ul className="gui-validator" id={`${uid}_errors`} data-cy={`${uid}_validator-errors`}>
      {errors.map((error, index) => (
        <li
          className="gui-validator__error"
          role="alert"
          key={index}
          data-cy={`${uid}_validator-error`}
        >
          {error}
        </li>
      ))}
    </ul>
  );
}
