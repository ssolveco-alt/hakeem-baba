import { Ban } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import { Card, CardContent } from "@/components/ui/card";

export default function SuspendedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <Ban className="h-8 w-8" />
          </span>
          <h1>Clinic Suspended</h1>
          <p className="text-muted-foreground">
            Your clinic access has been suspended. Please contact the HakeemCare
            administrator for assistance.
          </p>
          <SignOutButton />
        </CardContent>
      </Card>
    </main>
  );
}
