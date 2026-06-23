"use client";

import { DownloadIcon, FileIcon, Loader2Icon } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getSharedFile } from "@/lib/api";
import { API_URL } from "@/config";
import type { APISharedFile } from "@/types/API";

export default function SharedFilePage() {
  const { token } = useParams<{ token: string }>();
  const [file, setFile] = useState<APISharedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!token) return;

    getSharedFile(token)
      .then(({ data }) => setFile(data))
      .catch((err) => {
        if (err.response?.status === 410) {
          setError("This share link has expired.");
        } else {
          setError("File not found or invalid share link.");
        }
      });
  }, [token]);

  const handleDownload = () => {
    setDownloading(true);
    const a = document.createElement("a");
    a.href = `${API_URL}/s/${token}/download`;
    a.download = file?.originalName ?? "download";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
    setTimeout(() => setDownloading(false), 2000);
  };

  const formatSize = (bytes: string) => {
    const num = Number(bytes);
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex max-w-md flex-col items-center text-center">
          <FileIcon className="mb-4 size-16 text-muted-foreground" />
          <h1 className="mb-2 text-2xl font-bold">File unavailable</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-md flex-col items-center rounded-xl border bg-card p-8 text-center shadow-sm">
        <div className="mb-6 rounded-full bg-primary/10 p-4">
          <FileIcon className="size-10 text-primary" />
        </div>
        <h1 className="mb-1 text-xl font-semibold break-all">{file.originalName}</h1>
        <p className="mb-6 text-sm text-muted-foreground">{formatSize(file.sizeBytes)}</p>
        <Button onClick={handleDownload} disabled={downloading} className="w-full">
          {downloading ? (
            <Loader2Icon className="mr-2 size-4 animate-spin" />
          ) : (
            <DownloadIcon className="mr-2 size-4" />
          )}
          Download
        </Button>
      </div>
    </div>
  );
}
