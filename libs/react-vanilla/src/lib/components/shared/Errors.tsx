export function Errors({ errors, uid }: { errors: string[]; uid: string }) {
  return (
    <ul className="gui-validator" id={`${uid}_errors`}>
      {errors.map((error) => (
        <li className="gui-validator__error">{error}</li>
      ))}
    </ul>
  );
}
