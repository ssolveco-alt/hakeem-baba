import Link from "next/link";
import { Leaf } from "lucide-react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Leaf className="h-9 w-9" />
          </div>
          <h1 className="text-3xl font-bold text-primary">HakeemCare</h1>
          <p className="mt-1 text-muted-foreground">
            Sign in to manage your clinic
          </p>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </p>
      </div>
    </main>
  );
}
