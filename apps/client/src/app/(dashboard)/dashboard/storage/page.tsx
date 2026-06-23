/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
"use client";

import {
  ChevronRightIcon,
  ClockIcon,
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
  GlobeIcon,
  GlobeLockIcon,
  LayoutGridIcon,
  ListIcon,
  Loader2Icon,
  PackageIcon,
  PlusIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ShareDialog } from "@/components/ShareDialog";
import { MAX_IMPORT_SIZE } from "@/config";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  api,
  createFolder,
  deleteFile,
  deleteFolder,
  getFolders,
  getUserFiles,
  importArchive,
  renameFolder,
  setFileFolder,
  shareFile,
  unshareFile,
  uploadFile,
} from "@/lib/api";
import type { APIFile, APIFolder } from "@/types/API";

function getFilename(contentDisposition: string | null) {
  if (!contentDisposition) return "download";
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match) return decodeURIComponent(utf8Match[1]!);
  const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  if (filenameMatch) return filenameMatch[1];
  return "download";
}

export default function StoragePage() {
  const [files, setFiles] = useState<APIFile[]>([]);
  const [folders, setFolders] = useState<APIFolder[]>([]);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [renameTarget, setRenameTarget] = useState<APIFolder | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("storageViewMode") as "grid" | "list") || "grid";
    }
    return "grid";
  });

  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    localStorage.setItem("storageViewMode", mode);
  };

  useEffect(() => {
    getUserFiles().then(({ data }) => setFiles(data.files));
    getFolders().then(({ data }) => setFolders(data));
  }, []);

  const filteredFiles = useMemo(
    () =>
      selectedFolderId
        ? files.filter((f) => f.folderId === selectedFolderId)
        : files,
    [files, selectedFolderId],
  );

  const childFolders = (parentId: string | null) =>
    folders.filter((f) => f.parentId === parentId);

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setUploadingFile(file);
  };

  const handleUploadFileButton = () => {
    document.getElementById("fileinput")?.click();
  };

  const handleDownloadFile = async (fileId: string) => {
    const response = await api.get(`/files/${fileId}/download`, {
      responseType: "blob",
    });
    const filename =
      getFilename(response.headers["content-disposition"]) || "download";
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

  const handleShareFile = async (fileId: string, ttlDays?: number) => {
    const { data: updated } = await shareFile(fileId, ttlDays);
    setFiles((prev) => prev.map((f) => (f.id === fileId ? updated : f)));
    const shareUrl = `${window.location.origin}/s/${updated.shareToken}`;
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Share link created and copied to clipboard");
  };

  const handleCopyShareLink = async (shareToken: string) => {
    const shareUrl = `${window.location.origin}/s/${shareToken}`;
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied to clipboard");
  };

  const handleUnshareFile = async (fileId: string) => {
    const { data: updated } = await unshareFile(fileId);
    setFiles((prev) => prev.map((f) => (f.id === fileId ? updated : f)));
    toast.success("Share link removed");
  };

  const handleMoveFile = async (fileId: string, folderId: string | null) => {
    const { data: updated } = await setFileFolder(fileId, folderId);
    setFiles((prev) => prev.map((f) => (f.id === fileId ? updated : f)));
  };

  const handleCreateFolder = async (name: string, parentId?: string) => {
    const { data } = await createFolder(name, parentId);
    setFolders((prev) => [...prev, data]);
    setExpandedFolders((prev) => {
      if (parentId) {
        const next = new Set(prev);
        next.add(parentId);
        return next;
      }
      return prev;
    });
  };

  const handleRenameFolder = async (folderId: string, name: string) => {
    await renameFolder(folderId, name);
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, name } : f)),
    );
    setRenameTarget(null);
  };

  const handleDeleteFolder = async (folderId: string) => {
    await deleteFolder(folderId);
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    setFiles((prev) =>
      prev.map((f) => (f.folderId === folderId ? { ...f, folderId: null } : f)),
    );
    if (selectedFolderId === folderId) setSelectedFolderId(null);
  };

  useEffect(() => {
    if (!uploadingFile) return;
    setIsUploading(true);
    uploadFile(uploadingFile)
      .then(async ({ data: file }) => {
        if (selectedFolderId) {
          const { data: moved } = await setFileFolder(
            file.id,
            selectedFolderId,
          );
          setFiles((prev) => [moved, ...prev]);
        } else {
          setFiles((prev) => [file, ...prev]);
        }
        toast.success("File uploaded");
      })
      .catch(() => toast.error("Upload failed"))
      .finally(() => {
        setIsUploading(false);
        setUploadingFile(null);
      });
  }, [uploadingFile]);

  return (
    <div className="relative">
      {/* Full-screen drop overlay */}
      {isDragging && (
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-primary p-16">
            <UploadIcon className="size-12 text-primary" />
            <p className="text-lg font-medium">Drop files anywhere to upload</p>
          </div>
        </div>
      )}

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
          // Only close if we're not entering a child
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        className="flex gap-6 min-h-screen"
      >
        {/* Folder sidebar */}
        <div className="w-56 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Folders
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={() => setShowCreateFolder(true)}
            >
              <PlusIcon className="size-3.5" />
            </Button>
          </div>
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => setSelectedFolderId(null)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                selectedFolderId === null
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              <FileIcon className="size-4" />
              All files
            </button>
            {buildFolderTree(
              null,
              folders,
              0,
              expandedFolders,
              toggleFolder,
              selectedFolderId,
              setSelectedFolderId,
              setRenameTarget,
              handleDeleteFolder,
              handleMoveFile,
              files,
            )}
          </div>
        </div>

        {/* File grid */}
        <div className="flex-1 min-w-0">
          <input
            type="file"
            id="fileinput"
            className="hidden"
            onChangeCapture={(e) =>
              setUploadingFile(e.target.files![0]! || null)
            }
          />
          <h1 className="font-semibold text-xl">Storage</h1>
          <div className="mt-6 rounded-xl border bg-card p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">
                  {selectedFolderId
                    ? (folders.find((f) => f.id === selectedFolderId)?.name ??
                      "Files")
                    : "Files"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {filteredFiles.length} file
                  {filteredFiles.length !== 1 ? "s" : ""}. Click to download,
                  right-click for more actions.
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="size-8"
                  onClick={() => handleViewModeChange("grid")}
                >
                  <LayoutGridIcon className="size-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="size-8"
                  onClick={() => handleViewModeChange("list")}
                >
                  <ListIcon className="size-4" />
                </Button>
              </div>
            </div>

            {filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <FileIcon className="mb-3 size-12 text-muted-foreground" />
                <p className="font-medium">No files here</p>
                <p className="text-sm text-muted-foreground">
                  Upload files or select a different folder.
                </p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {filteredFiles.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    folders={folders}
                    onDownload={handleDownloadFile}
                    onDelete={handleDeleteFile}
                    onShare={handleShareFile}
                    onCopyShareLink={handleCopyShareLink}
                    onUnshare={handleUnshareFile}
                    onMove={handleMoveFile}
                  />
                ))}
              </div>
            ) : (
              <div className="divide-y rounded-lg border">
                {filteredFiles.map((file) => (
                  <FileRow
                    key={file.id}
                    file={file}
                    folders={folders}
                    onDownload={handleDownloadFile}
                    onDelete={handleDeleteFile}
                    onShare={handleShareFile}
                    onCopyShareLink={handleCopyShareLink}
                    onUnshare={handleUnshareFile}
                    onMove={handleMoveFile}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mt-10 flex items-center justify-between">
            <h1 className="font-semibold text-xl">Upload zone</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImportDialog(true)}
            >
              <PackageIcon className="mr-2 size-4" />
              Import archive
            </Button>
          </div>
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 border-muted-foreground/25 bg-card">
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

        {/* Dialogs */}
        <CreateFolderDialog
          open={showCreateFolder}
          onOpenChange={setShowCreateFolder}
          folders={folders}
          onCreate={handleCreateFolder}
        />

        <RenameFolderDialog
          folder={renameTarget}
          onOpenChange={() => setRenameTarget(null)}
          onRename={handleRenameFolder}
        />

        <ImportArchiveDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          onImported={() => {
            getUserFiles().then(({ data }) => setFiles(data.files));
          }}
        />
      </div>
    </div>
  );
}

function buildFolderTree(
  parentId: string | null,
  folders: APIFolder[],
  depth: number,
  expandedFolders: Set<string>,
  onToggle: (id: string) => void,
  selectedFolderId: string | null,
  onSelect: (id: string) => void,
  onRename: (folder: APIFolder) => void,
  onDelete: (id: string) => void,
  onMoveFile: (fileId: string, folderId: string | null) => void,
  files: APIFile[],
) {
  const children = folders.filter((f) => f.parentId === parentId);
  if (children.length === 0 && parentId !== null) return null;

  return children.map((folder) => {
    const hasChildren = folders.some((f) => f.parentId === folder.id);
    const isExpanded = expandedFolders.has(folder.id);
    const fileCount = files.filter((f) => f.folderId === folder.id).length;

    return (
      <div key={folder.id}>
        <ContextMenu>
          <ContextMenuTrigger>
            <button
              type="button"
              onClick={() => {
                onSelect(folder.id);
                if (hasChildren) onToggle(folder.id);
              }}
              className={`flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                selectedFolderId === folder.id
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-accent"
              }`}
              style={{ paddingLeft: `${12 + depth * 16}px` }}
            >
              {hasChildren ? (
                <ChevronRightIcon
                  className={`size-3 shrink-0 transition-transform ${
                    isExpanded ? "rotate-90" : ""
                  }`}
                />
              ) : (
                <span className="w-3 shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpenIcon className="size-4 shrink-0" />
              ) : (
                <FolderIcon className="size-4 shrink-0" />
              )}
              <span className="truncate">{folder.name}</span>
              {fileCount > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {fileCount}
                </span>
              )}
            </button>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-40">
            <ContextMenuItem onClick={() => onRename(folder)}>
              Rename
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => onDelete(folder.id)}>
              <span className="text-red-400">Delete</span>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        {isExpanded &&
          buildFolderTree(
            folder.id,
            folders,
            depth + 1,
            expandedFolders,
            onToggle,
            selectedFolderId,
            onSelect,
            onRename,
            onDelete,
            onMoveFile,
            files,
          )}
      </div>
    );
  });
}

function FileCard({
  file,
  folders,
  onDownload,
  onDelete,
  onShare,
  onCopyShareLink,
  onUnshare,
  onMove,
}: {
  file: APIFile;
  folders: APIFolder[];
  onDownload: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onShare: (id: string, ttlDays?: number) => Promise<void>;
  onCopyShareLink: (shareToken: string) => Promise<void>;
  onUnshare: (id: string) => Promise<void>;
  onMove: (fileId: string, folderId: string | null) => Promise<void>;
}) {
  const [showShareDialog, setShowShareDialog] = useState(false);

  const currentFolder = folders.find((f) => f.id === file.folderId);

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            onClick={() => onDownload(file.id)}
            className="group relative flex flex-col items-center gap-3 rounded-lg border p-4 transition-all hover:border-primary hover:bg-accent/10"
          >
            {file.shareToken && (
              <GlobeIcon className="absolute right-2 top-2 size-3.5 text-primary" />
            )}
            {file.shareExpiresAt && (
              <ClockIcon className="absolute right-7 top-2 size-3.5 text-muted-foreground" />
            )}
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
            <ContextMenuSubTrigger>
              <FolderIcon className="mr-2 size-4" />
              Move to folder
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="max-h-48 overflow-y-auto">
              <ContextMenuItem onClick={() => onMove(file.id, null)}>
                <FileIcon className="mr-2 size-4" />
                Root
                {!file.folderId && " ✓"}
              </ContextMenuItem>
              {folders.map((folder) => (
                <ContextMenuItem
                  key={folder.id}
                  onClick={() => onMove(file.id, folder.id)}
                >
                  <FolderIcon className="mr-2 size-4" />
                  {folder.name}
                  {file.folderId === folder.id && " ✓"}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>

          {currentFolder && (
            <ContextMenuItem onClick={() => onMove(file.id, null)}>
              <FolderOpenIcon className="mr-2 size-4" />
              Remove from folder
            </ContextMenuItem>
          )}

          <ContextMenuSeparator />
          {file.shareToken ? (
            <ContextMenuItem onClick={() => onCopyShareLink(file.shareToken!)}>
              <GlobeIcon className="mr-2 size-4" />
              Copy share link
            </ContextMenuItem>
          ) : (
            <ContextMenuItem onClick={() => setShowShareDialog(true)}>
              <GlobeIcon className="mr-2 size-4" />
              Create share link
            </ContextMenuItem>
          )}
          {file.shareToken && (
            <ContextMenuItem onClick={() => onUnshare(file.id)}>
              <GlobeLockIcon className="mr-2 size-4" />
              Remove share link
            </ContextMenuItem>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onDelete(file.id)}>
            <Trash2Icon className="mr-2 size-4" />
            <span className="text-red-400">Delete</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <ShareDialog
        fileName={file.originalName}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        onShare={(ttlDays) => onShare(file.id, ttlDays)}
      />
    </>
  );
}

function FileRow({
  file,
  folders,
  onDownload,
  onDelete,
  onShare,
  onCopyShareLink,
  onUnshare,
  onMove,
}: {
  file: APIFile;
  folders: APIFolder[];
  onDownload: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onShare: (id: string, ttlDays?: number) => Promise<void>;
  onCopyShareLink: (shareToken: string) => Promise<void>;
  onUnshare: (id: string) => Promise<void>;
  onMove: (fileId: string, folderId: string | null) => Promise<void>;
}) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const currentFolder = folders.find((f) => f.id === file.folderId);

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            onClick={() => onDownload(file.id)}
            className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/10"
          >
            <FileIcon className="size-5 shrink-0 text-muted-foreground" />
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <p className="truncate text-sm font-medium">{file.originalName}</p>
              {file.shareToken && (
                <GlobeIcon className="size-3.5 shrink-0 text-primary" />
              )}
            </div>
            {currentFolder && (
              <span className="shrink-0 text-xs text-muted-foreground">
                {currentFolder.name}
              </span>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => onDownload(file.id)}>
            Download
          </ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <FolderIcon className="mr-2 size-4" />
              Move to folder
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="max-h-48 overflow-y-auto">
              <ContextMenuItem onClick={() => onMove(file.id, null)}>
                <FileIcon className="mr-2 size-4" />
                Root
                {!file.folderId && " ✓"}
              </ContextMenuItem>
              {folders.map((folder) => (
                <ContextMenuItem
                  key={folder.id}
                  onClick={() => onMove(file.id, folder.id)}
                >
                  <FolderIcon className="mr-2 size-4" />
                  {folder.name}
                  {file.folderId === folder.id && " ✓"}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
          {currentFolder && (
            <ContextMenuItem onClick={() => onMove(file.id, null)}>
              <FolderOpenIcon className="mr-2 size-4" />
              Remove from folder
            </ContextMenuItem>
          )}
          <ContextMenuSeparator />
          {file.shareToken ? (
            <ContextMenuItem onClick={() => onCopyShareLink(file.shareToken!)}>
              <GlobeIcon className="mr-2 size-4" />
              Copy share link
            </ContextMenuItem>
          ) : (
            <ContextMenuItem onClick={() => setShowShareDialog(true)}>
              <GlobeIcon className="mr-2 size-4" />
              Create share link
            </ContextMenuItem>
          )}
          {file.shareToken && (
            <ContextMenuItem onClick={() => onUnshare(file.id)}>
              <GlobeLockIcon className="mr-2 size-4" />
              Remove share link
            </ContextMenuItem>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onDelete(file.id)}>
            <Trash2Icon className="mr-2 size-4" />
            <span className="text-red-400">Delete</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <ShareDialog
        fileName={file.originalName}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        onShare={(ttlDays) => onShare(file.id, ttlDays)}
      />
    </>
  );
}

function CreateFolderDialog({
  open,
  onOpenChange,
  folders,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: APIFolder[];
  onCreate: (name: string, parentId?: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onCreate(name.trim(), parentId || undefined);
      onOpenChange(false);
      setName("");
      setParentId("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create folder</DialogTitle>
          <DialogDescription>
            Create a new folder to organize your files.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="folder-name">Name</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Folder name"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="folder-parent">Parent folder (optional)</Label>
            <select
              id="folder-parent"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
            >
              <option value="">Root</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
            {loading && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RenameFolderDialog({
  folder,
  onOpenChange,
  onRename,
}: {
  folder: APIFolder | null;
  onOpenChange: () => void;
  onRename: (id: string, name: string) => Promise<void>;
}) {
  const [name, setName] = useState(folder?.name ?? "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(folder?.name ?? "");
  }, [folder]);

  const handleSubmit = async () => {
    if (!folder || !name.trim()) return;
    setLoading(true);
    try {
      await onRename(folder.id, name.trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!folder} onOpenChange={(open) => !open && onOpenChange()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename folder</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="rename-folder">Name</Label>
            <Input
              id="rename-folder"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onOpenChange}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
            {loading && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportArchiveDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    imported: { originalName: string; id: string }[];
    skipped: string[];
    errors: { file: string; error: string }[];
  } | null>(null);

  const handleImport = async () => {
    if (!file) return;

    if (file.size > MAX_IMPORT_SIZE) {
      toast.error("Archive too large. Maximum size is 500 MB");
      return;
    }

    setImporting(true);
    setResult(null);
    try {
      const { data } = await importArchive(file);
      setResult(data);
      if (data.imported.length > 0) onImported();
      toast.success(`Imported ${data.imported.length} files`);
    } catch {
      toast.error("Failed to import archive");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    if (importing) return;
    setFile(null);
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import archive</DialogTitle>
          <DialogDescription>
            Upload a .zip or .tar.gz file containing photos and videos.
            Supported formats are automatically extracted and added to your
            storage. Maximum archive size is 500 MB.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="grid gap-4 py-4">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) setFile(f);
              }}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 transition-colors hover:border-primary"
              onClick={() =>
                document.getElementById("import-file-input")?.click()
              }
            >
              <input
                id="import-file-input"
                type="file"
                accept=".zip,.tar.gz,.tgz"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <PackageIcon className="size-8 text-muted-foreground" />
              <p className="text-sm font-medium">
                {file ? file.name : "Click or drop an archive here"}
              </p>
              <p className="text-xs text-muted-foreground">
                .zip or .tar.gz — photos & videos only (max 500 MB)
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 py-4">
            {result.imported.length > 0 && (
              <div>
                <p className="mb-1 text-sm font-medium text-green-500">
                  Imported ({result.imported.length})
                </p>
                <div className="max-h-32 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                  {result.imported.map((f) => (
                    <p key={f.id} className="truncate">
                      {f.originalName}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {result.skipped.length > 0 && (
              <div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">
                  Skipped ({result.skipped.length})
                </p>
                <div className="max-h-20 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                  {result.skipped.map((name) => (
                    <p key={name} className="truncate">
                      {name}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {result.errors.length > 0 && (
              <div>
                <p className="mb-1 text-sm font-medium text-red-400">
                  Errors ({result.errors.length})
                </p>
                <div className="max-h-20 space-y-1 overflow-y-auto text-xs text-red-400">
                  {result.errors.map((e) => (
                    <p key={e.file} className="truncate">
                      {e.file}: {e.error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={importing}>
            {result ? "Done" : "Cancel"}
          </Button>
          {!result && (
            <Button onClick={handleImport} disabled={!file || importing}>
              {importing && (
                <Loader2Icon className="mr-2 size-4 animate-spin" />
              )}
              {importing ? "Importing..." : "Import"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
