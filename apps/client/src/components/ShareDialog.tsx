"use client";

import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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

export function ShareDialog({
  fileName,
  open,
  onOpenChange,
  onShare,
}: {
  fileName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShare: (ttlDays?: number) => Promise<void>;
}) {
  const [ttlDays, setTtlDays] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onShare(ttlDays ? Number(ttlDays) : undefined);
      onOpenChange(false);
      setTtlDays("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create share link</DialogTitle>
          <DialogDescription>
            Set an expiration for "{fileName}" or leave empty for no expiration.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-wrap gap-2">
            {[
              { label: "1 day", value: 1 },
              { label: "7 days", value: 7 },
              { label: "30 days", value: 30 },
            ].map((preset) => (
              <Button
                key={preset.value}
                variant={Number(ttlDays) === preset.value ? "default" : "outline"}
                size="sm"
                onClick={() => setTtlDays(String(preset.value))}
              >
                {preset.label}
              </Button>
            ))}
            <Button
              variant={ttlDays === "" ? "default" : "outline"}
              size="sm"
              onClick={() => setTtlDays("")}
            >
              No expiry
            </Button>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ttl-custom">Custom (days)</Label>
            <Input
              id="ttl-custom"
              type="number"
              min="1"
              placeholder="e.g. 14"
              value={ttlDays}
              onChange={(e) => setTtlDays(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            Create link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
