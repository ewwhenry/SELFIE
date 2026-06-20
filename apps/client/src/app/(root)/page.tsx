import {
  HardDriveIcon,
  LockIcon,
  ShieldIcon,
  UploadIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <HardDriveIcon className="size-5" />
            Selfie
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-8 items-center rounded-lg bg-primary text-primary-foreground px-4 text-sm font-medium hover:bg-primary/80 transition-colors"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <section className="cssbg">
        <div className="mx-auto max-w-6xl flex flex-col items-center px-6 py-28 text-center">
          <div className="flex items-center justify-center size-14 rounded-xl bg-card border mb-6">
            <HardDriveIcon className="size-7" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-2xl">
            A self-hosted file storage you actually own
          </h1>
          <p className="mt-4 text-lg text-accent-foreground max-w-xl">
            Lightweight, self-hosted file storage built with Node.js, Hono, and
            PostgreSQL. Designed to run on minimal hardware — even a rooted
            Android device with Termux.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="inline-flex h-10 items-center rounded-lg bg-primary text-primary-foreground px-6 text-sm font-medium hover:bg-primary/80 transition-colors"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-lg border border-border bg-card px-6 text-sm font-medium hover:bg-muted transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-2xl font-semibold tracking-tight">Features</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Everything you need to store and share your files.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 mb-4">
              <UploadIcon className="size-5" />
            </div>
            <h3 className="font-semibold mb-1">Upload & Download</h3>
            <p className="text-sm text-muted-foreground">
              Upload and download files via REST API and Web UI. Drag-and-drop
              support with batch operations.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 mb-4">
              <UsersIcon className="size-5" />
            </div>
            <h3 className="font-semibold mb-1">Multi-user</h3>
            <p className="text-sm text-muted-foreground">
              Full multi-user support with role-based access control (USER /
              ADMIN). The first user gets admin privileges automatically.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 mb-4">
              <LockIcon className="size-5" />
            </div>
            <h3 className="font-semibold mb-1">JWT Auth</h3>
            <p className="text-sm text-muted-foreground">
              Secure authentication with access and refresh tokens. Automatic
              token rotation on expiry.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 mb-4">
              <HardDriveIcon className="size-5" />
            </div>
            <h3 className="font-semibold mb-1">Storage Quotas</h3>
            <p className="text-sm text-muted-foreground">
              Per-user storage quotas enforced at upload time. Default 5 GB per
              user, configurable by admins.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 mb-4">
              <ShieldIcon className="size-5" />
            </div>
            <h3 className="font-semibold mb-1">Admin Panel</h3>
            <p className="text-sm text-muted-foreground">
              Manage users, roles, and quotas from a built-in admin dashboard.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 mb-4">
              <HardDriveIcon className="size-5" />
            </div>
            <h3 className="font-semibold mb-1">Self-hosted</h3>
            <p className="text-sm text-muted-foreground">
              Runs anywhere — VPS, Raspberry Pi, or Termux on Android. No vendor
              lock-in, full data ownership.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl flex flex-col items-center px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Ready to own your storage?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            Deploy Selfie on your own hardware and take control of your files.
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary text-primary-foreground px-6 text-sm font-medium hover:bg-primary/80 transition-colors"
          >
            Get started
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-14">
          <p className="text-xs text-muted-foreground">
            Selfie &mdash; MIT License
          </p>
          <Link
            href="https://github.com/ewwhenry/SELFIE"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            GitHub
          </Link>
        </div>
      </footer>
    </div>
  );
}
