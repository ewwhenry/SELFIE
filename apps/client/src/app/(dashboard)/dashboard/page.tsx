"use client";

import {
  FileIcon,
  HardDriveIcon,
  SettingsIcon,
  UploadIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useUser } from "@/hooks/useUser";
import { getUserFiles } from "@/lib/api";
import type { APIFile } from "@/types/API";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const base = 1024;
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(base)),
    units.length - 1,
  );

  return `${(bytes / base ** exponent).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export default function DashboardPage() {
  const { user } = useUser();
  const [files, setFiles] = useState<APIFile[]>([]);

  useEffect(() => {
    getUserFiles().then(({ data }) => setFiles(data.files));
  }, []);

  const usedBytes = Number(user.usedBytes);
  const quotaBytes = Number(user.quotaBytes);

  const usedPercentage = quotaBytes > 0 ? (usedBytes / quotaBytes) * 100 : 0;

  const totalFilesSize = files.reduce((acc, f) => acc + Number(f.sizeBytes), 0);

  return (
    <div>
      <div className="flex flex-col gap-y-1 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {user.firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here is what is happening with your storage.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 col-span-2 lg:col-span-1">
          <div className="flex items-center gap-x-2 mb-4">
            <HardDriveIcon className="size-5 text-muted-foreground" />
            <h2 className="font-semibold">Storage</h2>
          </div>
          <div className="flex flex-row items-center justify-between mb-1 text-sm text-muted-foreground">
            <span>{formatBytes(usedBytes)} used</span>
            <span>{formatBytes(quotaBytes)} total</span>
          </div>
          <Progress value={usedPercentage} className="h-2.5" />
          <p className="mt-2 text-xs text-muted-foreground">
            {usedPercentage.toFixed(1)}% of your storage is used
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-x-2 mb-4">
            <FileIcon className="size-5 text-muted-foreground" />
            <h2 className="font-semibold">Files</h2>
          </div>
          <p className="text-3xl font-bold tabular-nums">{files.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {files.length === 1 ? "1 file" : `${files.length} files`} stored
            {files.length > 0 && ` (${formatBytes(totalFilesSize)} total)`}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-x-2 mb-4">
            <UserIcon className="size-5 text-muted-foreground" />
            <h2 className="font-semibold">Account</h2>
          </div>
          <p className="text-sm font-medium truncate">{user.email}</p>
          <p className="text-xs text-muted-foreground capitalize mt-1">
            {user.role.toLowerCase()} account
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-semibold mb-3">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/storage">
            <Button variant="default">
              <UploadIcon /> Upload files
            </Button>
          </Link>
          <Link href="/dashboard/settings">
            <Button variant="outline">
              <SettingsIcon /> Settings
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
