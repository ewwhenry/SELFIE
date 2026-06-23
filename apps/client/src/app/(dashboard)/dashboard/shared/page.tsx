"use client";

import {
  ClockIcon,
  CopyIcon,
  ExternalLinkIcon,
  FileIcon,
  GlobeLockIcon,
  LinkIcon,
  Loader2Icon,
  TimerOffIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "@/components/ShareDialog";
import { toast } from "sonner";
import { getUserSharedFiles, shareFile, unshareFile } from "@/lib/api";
import type { APIFile } from "@/types/API";

export default function SharedPage() {
  const [files, setFiles] = useState<APIFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    getUserSharedFiles()
      .then((r) => setFiles(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCopyLink = async (shareToken: string) => {
    const url = `${window.location.origin}/s/${shareToken}`;
    await navigator.clipboard.writeText(url);
    toast.success("Share link copied");
  };

  const handleUnshare = async (fileId: string) => {
    await unshareFile(fileId);
    toast.success("Share link removed");
    load();
  };

  const handleReshare = async (fileId: string, ttlDays?: number) => {
    await shareFile(fileId, ttlDays);
    const updated = await getUserSharedFiles().then((r) => r.data);
    const file = updated.find((f: APIFile) => f.id === fileId);
    if (file?.shareToken) {
      await handleCopyLink(file.shareToken);
    }
    toast.success("Share link updated");
    load();
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return null;
    return new Date(iso).toLocaleString();
  };

  const formatSize = (bytes: string) => {
    const num = Number(bytes);
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Shared files</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage all your publicly shared files
      </p>

      <div className="mt-6 rounded-xl border bg-card">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Failed to load shared files
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <LinkIcon className="mb-3 size-12 text-muted-foreground" />
            <p className="font-medium">No shared files</p>
            <p className="text-sm text-muted-foreground">
              Right-click a file in Storage and select "Create share link" to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {files.map((file) => (
              <SharedFileRow
                key={file.id}
                file={file}
                onCopyLink={handleCopyLink}
                onUnshare={handleUnshare}
                onReshare={handleReshare}
                formatDate={formatDate}
                formatSize={formatSize}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SharedFileRow({
  file,
  onCopyLink,
  onUnshare,
  onReshare,
  formatDate,
  formatSize,
}: {
  file: APIFile;
  onCopyLink: (shareToken: string) => Promise<void>;
  onUnshare: (fileId: string) => Promise<void>;
  onReshare: (fileId: string, ttlDays?: number) => Promise<void>;
  formatDate: (iso: string | null) => string | null;
  formatSize: (bytes: string) => string;
}) {
  const [showShareDialog, setShowShareDialog] = useState(false);

  const isExpired =
    file.shareExpiresAt && new Date(file.shareExpiresAt) < new Date();

  return (
    <>
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <FileIcon className="mt-0.5 size-8 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{file.originalName}</p>
            <p className="text-xs text-muted-foreground">
              {formatSize(file.sizeBytes)}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {file.shareExpiresAt ? (
                <span className="flex items-center gap-1">
                  <ClockIcon className="size-3" />
                  {isExpired ? (
                    <span className="text-red-400">Expired</span>
                  ) : (
                    <>Expires {formatDate(file.shareExpiresAt)}</>
                  )}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <TimerOffIcon className="size-3" />
                  No expiry
                </span>
              )}
              {file.createdAt && (
                <span>Created {formatDate(file.createdAt)}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCopyLink(file.shareToken!)}
            title="Copy share link"
          >
            <CopyIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              window.open(
                `${window.location.origin}/s/${file.shareToken}`,
                "_blank",
              )
            }
            title="Open share page"
          >
            <ExternalLinkIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowShareDialog(true)}
            title="Change expiration"
          >
            <ClockIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onUnshare(file.id)}
            title="Remove share link"
          >
            <GlobeLockIcon className="size-4 text-red-400" />
          </Button>
        </div>
      </div>

      {showShareDialog && (
        <ShareDialog
          fileName={file.originalName}
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          onShare={(ttlDays) => onReshare(file.id, ttlDays)}
        />
      )}
    </>
  );
}
