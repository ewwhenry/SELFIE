"use client";

import {
  LaptopIcon,
  SmartphoneIcon,
  TabletIcon,
  Trash2Icon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/hooks/useUser";
import {
  changePassword,
  getUserSessions,
  revokeSession,
  updateUserProfile,
} from "@/lib/api";
import type { APIUserSession } from "@/types/API";

export default function SettingsPage() {
  const { user, refreshUser } = useUser();

  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email);
  const [saving, setSaving] = useState(false);

  const [userSessions, setUserSessions] = useState<APIUserSession[]>([]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data: { firstName?: string; lastName?: string; email?: string } =
        {};
      if (firstName !== user.firstName) data.firstName = firstName;
      if (lastName !== user.lastName) data.lastName = lastName;
      if (email !== user.email) data.email = email;

      if (Object.keys(data).length === 0) {
        toast.info("No changes to save");
        setSaving(false);
        return;
      }

      await updateUserProfile(data);
      await refreshUser();
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      setChangingPassword(false);
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      setChangingPassword(false);
      return;
    }

    try {
      await changePassword(currentPassword, newPassword);
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        toast.error(
          axiosErr.response?.data?.message ?? "Failed to change password",
        );
      } else {
        toast.error("Failed to change password");
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSession(sessionId);
      setUserSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success("Session revoked");
    } catch {
      toast.error("Failed to revoke session");
    }
  };

  useEffect(() => {
    getUserSessions().then((res) => setUserSessions(res.data));
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>

      <div className="mt-6 rounded-xl border bg-card p-6">
        <h2 className="font-semibold mb-1">Profile</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Update your personal information
        </p>

        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
          <div className="space-y-1">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </div>

      <div className="mt-6 rounded-xl border bg-card p-6">
        <h2 className="font-semibold mb-1">Password</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Change your account password
        </p>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div className="space-y-1">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={changingPassword}>
            {changingPassword ? "Changing..." : "Change password"}
          </Button>
        </form>
      </div>

      <div className="mt-6 rounded-xl border bg-card p-6">
        <h2 className="font-semibold mb-1">Sessions</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Active login sessions across your devices
        </p>
        <div className="space-y-3">
          {userSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active sessions</p>
          ) : (
            userSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onRevoke={handleRevokeSession}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function DeviceIcon({ type }: { type: string | null }) {
  if (type === "mobile") return <SmartphoneIcon className="size-4" />;
  if (type === "tablet") return <TabletIcon className="size-4" />;
  return <LaptopIcon className="size-4" />;
}

function SessionCard({
  session,
  onRevoke,
}: {
  session: APIUserSession;
  onRevoke: (id: string) => void;
}) {
  const formatDate = (iso: string | null) => {
    if (!iso) return "Unknown";
    return new Date(iso).toLocaleString();
  };

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-muted-foreground">
          <DeviceIcon type={session.deviceType} />
        </div>
        <div>
          <p className="text-sm font-medium">
            {session.deviceName ?? "Unknown device"}
          </p>
          <p className="text-xs text-muted-foreground">
            IP: {session.ipAddress ?? "Unknown"}
          </p>
          <p className="text-xs text-muted-foreground">
            Expires: {formatDate(session.expiresAt)}
            {session.lastActiveAt &&
              ` · Active: ${formatDate(session.lastActiveAt)}`}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRevoke(session.id)}
        title="Revoke session"
      >
        <Trash2Icon className="size-4 text-red-400" />
      </Button>
    </div>
  );
}
