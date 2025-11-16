export function Errors({ errors }: { errors: string[] }) {
  return (
    <ul className="gui-validator">
      {errors.map((error) => (
        <li className="gui-validator__error">{error}</li>
      ))}
    </ul>
  );
}
