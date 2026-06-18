"use client";

import { Progress } from "@/components/ui/progress";
import { useUser } from "@/hooks/useUser";

export default function DashboardPage() {
  const { user } = useUser();

  const usedStorageMB = Number(user.usedBytes) / (1024 * 1024);
  const totalStorageMB = Number(user.quotaBytes) / (1024 * 1024);

  const usedStoragePercentage =
    Number(user.quotaBytes) > 0
      ? (Number(user.usedBytes) / Number(user.quotaBytes)) * 100
      : 0;

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
      <div className="p-4 mt-4 border rounded-lg border-accent">
        <h2 className="flex flex-row items-center mb-4 text-xl font-semibold gap-x-2">
          Storage
        </h2>
        <div className="flex flex-row items-center justify-between mb-1 text-sm font-semibold text-accent-foreground">
          <span>{(usedStorageMB / 1024).toFixed(1)} GB used</span>
          <span>{(totalStorageMB / 1024).toFixed(1)} GB total</span>
        </div>
        <Progress value={usedStoragePercentage} className="h-2" />
      </div>
    </div>
  );
}
