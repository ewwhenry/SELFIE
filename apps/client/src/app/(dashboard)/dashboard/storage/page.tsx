/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
"use client";

import { DownloadIcon, FileIcon, Loader2Icon, UploadIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { toast } from "sonner";
import { api, deleteFile, getUserFiles, uploadFile } from "@/lib/api";
import type { APIFile } from "@/types/API";

function getFilename(contentDisposition: string | null) {
  if (!contentDisposition) {
    return "download";
  }

  // RFC 5987 (UTF-8)
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);

  if (utf8Match) {
    return decodeURIComponent(utf8Match[1]!);
  }

  // Fallback clásico
  const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);

  if (filenameMatch) {
    return filenameMatch[1];
  }

  return "download";
}

export default function StoragePage() {
  const [files, setFiles] = useState<APIFile[]>([]);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    getUserFiles().then(({ data }) => {
      setFiles(data.files);
    });
  }, []);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];

    if (!file) return;

    setUploadingFile(file);
  };

  const handleUploadFileButton = () => {
    const fileinput = document.getElementById("fileinput");

    if (!fileinput) return;

    fileinput.click();
  };

  const handleDownloadFile = async (fileId: string) => {
    const response = await api.get(`/files/${fileId}/download`, {
      responseType: "blob",
    });

    const disposition = response.headers["content-disposition"];

    const filename = getFilename(disposition) || "download";

    const url = URL.createObjectURL(response.data);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  const handleDeleteFile = async (fileId: string) => {
    await deleteFile(fileId);
    setFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  useEffect(() => {
    if (!uploadingFile) return;

    setIsUploading(true);
    uploadFile(uploadingFile)
      .then(({ data: file }) => {
        setFiles((prev) => [file, ...prev]);
        toast.success("File uploaded");
      })
      .catch(() => toast.error("Upload failed"))
      .finally(() => {
        setIsUploading(false);
      });
  }, [uploadingFile]);
  return (
    <div>
      <input
        type="file"
        id="fileinput"
        className="hidden"
        onChangeCapture={(e) => setUploadingFile(e.target.files![0]! || null)}
      />
      <h1 className="font-semibold text-xl">Storage</h1>
      <div className="mt-6 rounded-xl border bg-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Files</h2>
            <p className="text-sm text-muted-foreground">
              {files.length} files stored. Click to download, right-click for
              more actions.
            </p>
          </div>
        </div>

        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <FileIcon className="mb-3 size-12 text-muted-foreground" />
            <p className="font-medium">No files uploaded yet</p>
            <p className="text-sm text-muted-foreground">
              Upload your first file to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {files.map((file) => (
              <File
                file={file}
                onDelete={handleDeleteFile}
                onDownload={handleDownloadFile}
                key={file.id}
              />
            ))}
          </div>
        )}
      </div>
      <h1 className="mt-10 font-semibold text-xl">Upload zone</h1>
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        className={`mt-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 bg-card"
        }`}
      >
        {isUploading ? (
          <Loader2Icon className="mb-3 size-10 text-muted-foreground animate-spin" />
        ) : (
          <UploadIcon className="mb-3 size-10 text-muted-foreground" />
        )}
        <span className="font-medium">
          {isUploading ? "Uploading..." : "Drag & drop to upload"}
        </span>
        <span className="my-2 text-sm text-muted-foreground">or</span>
        <Button onClick={handleUploadFileButton} disabled={isUploading}>
          {isUploading ? "Uploading..." : "Click to upload"}
        </Button>
      </div>
    </div>
  );
}

function File({
  file,
  onDownload,
  onDelete,
}: {
  file: APIFile;
  onDownload: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          onClick={() => onDownload(file.id)}
          className="group flex flex-col items-center gap-3 rounded-lg border p-4 transition-all hover:border-primary hover:bg-accent/10"
        >
          <FileIcon className="size-10 text-muted-foreground group-hover:text-primary" />

          <p className="text-center text-xs font-medium break-all line-clamp-2">
            {file.originalName}
          </p>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => onDownload(file.id)}>
          Download
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger disabled>Share</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>Public</ContextMenuItem>
            <ContextMenuItem>Private</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onDelete(file.id)}>
          <span className="text-red-400">Delete</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
