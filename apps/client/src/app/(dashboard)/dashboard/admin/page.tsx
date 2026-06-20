"use client";

import { FileIcon, HardDriveIcon, TrashIcon, UsersIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/useUser";
import {
  deleteAdminUser,
  getAdminStats,
  getAdminUsers,
  updateAdminUser,
} from "@/lib/api";
import type { APIAdminStats, APIAdminUser } from "@/types/API";

const GB = 1024 * 1024 * 1024;

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

function toGB(bytes: string): string {
  return (Number(bytes) / GB).toFixed(2);
}

function fromGB(gb: string): string {
  return String(Math.round(Number(gb) * GB));
}

export default function AdminPage() {
  const { user, refreshUser } = useUser();
  const router = useRouter();

  const [stats, setStats] = useState<APIAdminStats | null>(null);
  const [users, setUsers] = useState<APIAdminUser[]>([]);
  const [editingQuota, setEditingQuota] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user.role !== "ADMIN") {
      router.replace("/dashboard");
      return;
    }

    getAdminStats().then(({ data }) => setStats(data));
    getAdminUsers().then(({ data }) => {
      setUsers(data);
      const quotas: Record<string, string> = {};
      for (const u of data) {
        quotas[u.id] = toGB(u.quotaBytes);
      }
      setEditingQuota(quotas);
    });
  }, [user.role, router]);

  const handleRoleToggle = async (target: APIAdminUser) => {
    const newRole = target.role === "ADMIN" ? "USER" : "ADMIN";

    try {
      const { data } = await updateAdminUser(target.id, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === data.id ? data : u)));
      if (target.id === user.id) await refreshUser();
      toast.success(`${target.email} is now ${newRole}`);
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleQuotaSave = async (target: APIAdminUser) => {
    const newQuotaGB = editingQuota[target.id];

    if (!newQuotaGB || newQuotaGB === toGB(target.quotaBytes)) return;

    try {
      const { data } = await updateAdminUser(target.id, {
        quotaBytes: fromGB(newQuotaGB),
      });
      setUsers((prev) => prev.map((u) => (u.id === data.id ? data : u)));
      if (target.id === user.id) await refreshUser();
      toast.success(`Quota updated for ${target.email}`);
    } catch {
      toast.error("Failed to update quota");
    }
  };

  const handleDelete = async (target: APIAdminUser) => {
    if (
      !confirm(
        `Delete ${target.email}? This will remove all their files and data.`,
      )
    ) {
      return;
    }

    try {
      await deleteAdminUser(target.id);
      setUsers((prev) => prev.filter((u) => u.id !== target.id));
      toast.success(`${target.email} deleted`);
    } catch {
      toast.error("Failed to delete user");
    }
  };

  if (user.role !== "ADMIN") return null;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Manage users and server settings
      </p>

      <div className="grid gap-4 sm:grid-cols-3 mt-6">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-x-2 mb-3">
            <UsersIcon className="size-5 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Users</h2>
          </div>
          <p className="text-3xl font-bold tabular-nums">
            {stats?.userCount ?? "—"}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-x-2 mb-3">
            <FileIcon className="size-5 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Files</h2>
          </div>
          <p className="text-3xl font-bold tabular-nums">
            {stats?.fileCount ?? "—"}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-x-2 mb-3">
            <HardDriveIcon className="size-5 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Total storage</h2>
          </div>
          <p className="text-3xl font-bold tabular-nums">
            {stats ? formatBytes(Number(stats.totalStorageBytes)) : "—"}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border bg-card">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold">Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Email</th>
                <th className="text-left p-3 font-medium">Role</th>
                <th className="text-left p-3 font-medium">Quota</th>
                <th className="text-left p-3 font-medium">Used</th>
                <th className="text-left p-3 font-medium">Files</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="p-3">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="p-3 text-muted-foreground">{u.email}</td>
                  <td className="p-3">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleRoleToggle(u)}
                      disabled={u.id === user.id}
                      title={u.id === user.id ? "Cannot change your own role" : ""}
                    >
                      {u.role}
                    </Button>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={editingQuota[u.id] ?? toGB(u.quotaBytes)}
                        onChange={(e) =>
                          setEditingQuota((prev) => ({
                            ...prev,
                            [u.id]: e.target.value,
                          }))
                        }
                        className="w-20 h-7 text-xs"
                      />
                      <span className="text-xs text-muted-foreground">GB</span>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleQuotaSave(u)}
                        disabled={editingQuota[u.id] === toGB(u.quotaBytes)}
                      >
                        Save
                      </Button>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {formatBytes(Number(u.usedBytes))}
                  </td>
                  <td className="p-3 text-muted-foreground">{u.fileCount}</td>
                  <td className="p-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDelete(u)}
                      disabled={u.id === user.id}
                      title={u.id === user.id ? "Cannot delete yourself" : ""}
                    >
                      <TrashIcon className="size-4 text-red-400" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
