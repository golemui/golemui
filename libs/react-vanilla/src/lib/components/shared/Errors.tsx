export function Errors({ errors }: { errors: string[] }) {
  if (errors.length > 0) {
    return (
      <ul className="gui-validator">
        {errors.map((error) => (
          <li className="gui-validator__error">{error}</li>
        ))}
      </ul>
    );
  }
  return null;
}
