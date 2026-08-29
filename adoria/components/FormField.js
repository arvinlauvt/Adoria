// One field: label, optional hint, input, and — only once the field has
// been touched (blurred, or submit was pressed while invalid) — a red
// border and an inline message naming exactly what's wrong, instead of a
// single generic error for the whole form.
export default function FormField({ id, label, hint, error, touched, onBlur, children, ...inputProps }) {
  const showError = touched && error;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && <span className="hint">{hint}</span>}
      <input
        id={id}
        onBlur={onBlur}
        aria-invalid={showError ? "true" : undefined}
        aria-describedby={showError ? `${id}-error` : undefined}
        style={showError ? { borderColor: "var(--danger)" } : undefined}
        {...inputProps}
      />
      {children}
      {showError && (
        <p id={`${id}-error`} className="error-text" style={{ marginTop: 4 }}>
          {error}
        </p>
      )}
    </div>
  );
}
