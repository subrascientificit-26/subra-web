export default function AuthCard({ children, title }: any) {
  return (
    <div className="min-h-screen flex justify-center items-center bg-blue-50">
      <div className="bg-white p-6 rounded-xl shadow w-[350px]">
        <h2 className="text-xl font-bold text-blue-600 mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}