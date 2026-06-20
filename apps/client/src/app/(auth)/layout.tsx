export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid grid-cols-1 md:grid-cols-3 min-h-screen min-w-screen">
      <div className="col-span-1 w-full cssbg h-screen hidden md:flex"></div>
      <div className="col-span-2 w-full p-12 md:p-0">{children}</div>
    </main>
  );
}
