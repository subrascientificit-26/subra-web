interface InfoSectionProps {
  title: string;
  children: React.ReactNode;
  id?: string;
}

export default function InfoSection({ title, children, id }: InfoSectionProps) {
  return (
    <section id={id} className="rounded-2xl border border-border bg-surface p-6 md:p-8 shadow-lg theme-light:shadow-md">
      <h2 className="text-lg font-bold text-foreground mb-2">{title}</h2>
      <div className="h-1 w-10 rounded-full bg-primary mb-4" />
      <div className="space-y-3 text-sm sm:text-base text-muted leading-7">{children}</div>
    </section>
  );
}
