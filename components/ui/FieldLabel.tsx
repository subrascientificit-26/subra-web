export function RequiredMark() {
  return (
    <span className="required-mark ml-0.5 font-semibold text-danger" aria-hidden="true">
      *
    </span>
  );
}

export function FieldLabel({
  children,
  required = false,
  className = "",
}: {
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={className}>
      {children}
      {required && <RequiredMark />}
    </label>
  );
}
