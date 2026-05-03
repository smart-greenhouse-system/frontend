const Input = ({
  id,
  name,
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  autoComplete,
  required = false,
  error = "",
  className = "",
  ...props
}) => {
  return (
    <div>
      {label && (
        <label htmlFor={id || name} className="mb-2 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={id || name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className={[
          "w-full rounded-lg border px-4 py-2.5 text-gray-800 outline-none transition",
          error
            ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
            : "border-gray-300 focus:border-farm-green focus:ring-2 focus:ring-farm-green/20",
          className,
        ].join(" ")}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id || name}-error` : undefined}
        {...props}
      />
      {error ? (
        <p id={`${id || name}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default Input;
