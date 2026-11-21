export default function AuthCard({ children, title }: any) {
  return (
    <div className="min-h-screen flex justify-center items-center bg-background text-foreground">
      <div className="bg-surface border border-border p-6 rounded-xl shadow-sm theme-dark:shadow-xl w-[350px]">
        <h2 className="text-xl font-bold text-primary mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}