import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

// Posts to the signout route handler (clears the cookie session server-side).
export function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <Button type="submit" variant="ghost" size="sm">
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Sign out</span>
      </Button>
    </form>
  );
}
