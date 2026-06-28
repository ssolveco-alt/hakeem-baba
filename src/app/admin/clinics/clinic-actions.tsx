"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MoreVertical, Ban, CheckCircle2, KeyRound, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { setClinicStatus, resetOwnerPassword, deleteClinic } from "../actions";

type Dialog = null | "reset" | "delete";

export function ClinicActions({
  clinicId,
  clinicName,
  status,
}: {
  clinicId: string;
  clinicName: string;
  status: "active" | "suspended";
}) {
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [pending, startTransition] = useTransition();

  function toggleStatus() {
    const next = status === "active" ? "suspended" : "active";
    startTransition(async () => {
      try {
        await setClinicStatus(clinicId, next);
        toast.success(next === "active" ? "Clinic activated" : "Clinic suspended");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  function onReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await resetOwnerPassword(clinicId, formData);
        toast.success("Password reset");
        setDialog(null);
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  function onDelete() {
    startTransition(async () => {
      try {
        await deleteClinic(clinicId);
        toast.success("Clinic deleted");
      } catch (err) {
        if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)} aria-label="Actions">
        <MoreVertical />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-lg border bg-background shadow-lg">
            <button
              className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-accent"
              onClick={toggleStatus}
              disabled={pending}
            >
              {status === "active" ? (
                <>
                  <Ban className="h-4 w-4 text-destructive" /> Suspend
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Activate
                </>
              )}
            </button>
            <button
              className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-accent"
              onClick={() => {
                setDialog("reset");
                setOpen(false);
              }}
            >
              <KeyRound className="h-4 w-4" /> Reset Password
            </button>
            <button
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-destructive hover:bg-accent"
              onClick={() => {
                setDialog("delete");
                setOpen(false);
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </>
      )}

      {dialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setDialog(null)}
        >
          <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <CardContent className="space-y-4 pt-6">
              {dialog === "reset" ? (
                <form onSubmit={onReset} className="space-y-4">
                  <h2 className="text-lg font-semibold">Reset owner password</h2>
                  <p className="text-sm text-muted-foreground">
                    Set a new password for <strong>{clinicName}</strong>&apos;s owner.
                  </p>
                  <Input name="password" type="text" placeholder="New password" minLength={6} required />
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={pending}>
                      {pending ? "Saving…" : "Reset"}
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <h2 className="text-lg font-semibold">Delete clinic</h2>
                  <p className="text-muted-foreground">
                    Permanently delete <strong>{clinicName}</strong> and ALL its data, patients,
                    visits and accounts. This cannot be undone.
                  </p>
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={onDelete} disabled={pending}>
                      {pending ? "Deleting…" : "Delete"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
