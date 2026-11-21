export default function Input(props: any) {
  return (
    <input
      {...props}
      className="w-full p-2.5 rounded-lg border border-border bg-surface-elevated text-foreground placeholder:text-muted outline-none focus:border-primary mb-3"
    />
  );
}