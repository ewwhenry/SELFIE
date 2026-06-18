import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardTopbar } from "@/components/DashboardTopbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-6 gap-x-2">
      {/* MAIN SIDEBAR */}
      <div className="col-span-1 min-h-screen">
        <DashboardSidebar />
      </div>
      {/* CONTENT */}
      <div className="col-span-4">
        <DashboardTopbar />
        <div className="px-12 pt-2">{children}</div>
      </div>
      {/* RIGHT SIDEBAR */}
      <div className="col-span-1"></div>
    </div>
  );
}
