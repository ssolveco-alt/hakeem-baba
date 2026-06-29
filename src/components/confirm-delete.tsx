"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Confirmation-before-delete (PRD requirement). Calls a server action.
export function ConfirmDelete({
  action,
  label = "Delete",
  message = "This cannot be undone. Are you sure?",
  iconOnly = false,
}: {
  action: () => Promise<void>;
  label?: string;
  message?: string;
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      try {
        await action();
      } catch (err) {
        if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
        toast.error(err instanceof Error ? err.message : "Could not delete");
      }
    });
  }

  return (
    <>
      {iconOnly ? (
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label={label}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ) : (
        <Button variant="destructive" size="lg" onClick={() => setOpen(true)}>
          <Trash2 /> {label}
        </Button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <CardContent className="space-y-4 pt-6">
              <h2 className="text-lg font-semibold">Confirm delete</h2>
              <p className="text-muted-foreground">{message}</p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={onConfirm} disabled={pending}>
                  {pending ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
