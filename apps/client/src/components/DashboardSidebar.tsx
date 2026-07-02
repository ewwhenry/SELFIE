"use client";

import {
  HardDriveIcon,
  LayoutDashboardIcon,
  LinkIcon,
  SettingsIcon,
  ShieldIcon,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";

export function DashboardSidebar() {
  const { user } = useUser();
  return (
    <div className="border-r border-r-accent h-full p-6">
      <div className="flex flex-row justify-between items-center">
        <div>
          <div className="size-10 rounded-md bg-blue-950 flex items-center justify-center text-blue-500">
            <HardDriveIcon />
          </div>
        </div>
        <div>
          {/* <SidebarIcon className="text-sidebar-accent-foreground" /> */}
        </div>
      </div>
      <div className="mt-8">
        <span className="flex flex-row items-center gap-x-1 mb-2 font-semibold text-sidebar-accent-foreground text-xs">
          Main menu
        </span>
        <div className="flex flex-col gap-y-1">
          <Link href="/dashboard">
            <span className="border border-sidebar-accent shadow-xs py-2 px-2 rounded-md flex flex-row items-center gap-x-2 text-sm">
              <LayoutDashboardIcon className="size-4" /> Overview
            </span>
          </Link>
          <Link href="/dashboard/storage">
            <span className="border border-sidebar-accent shadow-xs py-2 px-2 rounded-md flex flex-row items-center gap-x-2 text-sm">
              <HardDriveIcon className="size-4" /> Storage
            </span>
          </Link>
          <Link href="/dashboard/settings">
            <span className="border border-sidebar-accent shadow-xs py-2 px-2 rounded-md flex flex-row items-center gap-x-2 text-sm">
              <SettingsIcon className="size-4" /> Settings
            </span>
          </Link>
          {user.role === "ADMIN" && (
            <Link href="/dashboard/admin">
              <span className="border border-sidebar-accent shadow-xs py-2 px-2 rounded-md flex flex-row items-center gap-x-2 text-sm">
                <ShieldIcon className="size-4" /> Admin
              </span>
            </Link>
          )}
        </div>
      </div>
      <div className="mt-8">
        <span className="flex flex-row items-center gap-x-1 mb-2 font-semibold text-sidebar-accent-foreground text-xs">
          Files
        </span>
        <div className="flex flex-col gap-y-1">
          <Link href="/dashboard/shared">
            <span className="border border-sidebar-accent shadow-xs py-2 px-2 rounded-md flex flex-row items-center gap-x-2 text-sm">
              <LinkIcon className="size-4" /> Shared
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
