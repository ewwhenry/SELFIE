import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardTopbar } from "@/components/DashboardTopbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-6 gap-x-2">
      {/* MAIN SIDEBAR - hidden on mobile */}
      <div className="hidden md:block col-span-1 min-h-screen">
        <DashboardSidebar />
      </div>
      {/* CONTENT - full width on mobile */}
      <div className="col-span-6 md:col-span-5 lg:col-span-4">
        <DashboardTopbar />
        <div className="px-4 sm:px-12 pt-2">{children}</div>
      </div>
      {/* RIGHT SIDEBAR - hidden on tablet and below */}
      <div className="hidden lg:block col-span-1"></div>
    </div>
  );
}
