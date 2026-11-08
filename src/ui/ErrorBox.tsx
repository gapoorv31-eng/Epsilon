/** A red box listing validation errors. Renders nothing when there are no errors. */
export default function ErrorBox({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <div className="error-box" role="alert">
      <strong>Please fix the following:</strong>
      <ul>
        {errors.map((message, i) => (
          <li key={i}>{message}</li>
        ))}
      </ul>
    </div>
  );
}
