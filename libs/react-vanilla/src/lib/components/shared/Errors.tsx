export function Errors({ errors }: { errors: string[] }) {
  if (errors.length > 0) {
    return (
      <ul>
        {errors.map((error) => (
          <li>{error}</li>
        ))}
      </ul>
    );
  }
  return null;
}
