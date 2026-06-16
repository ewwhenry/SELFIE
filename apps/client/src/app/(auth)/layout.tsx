export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid grid-cols-3 min-h-screen min-w-screen">
      <div className="col-span-1 w-full cssbg h-screen"></div>
      <div className="col-span-2 w-full">{children}</div>
    </main>
  );
}
