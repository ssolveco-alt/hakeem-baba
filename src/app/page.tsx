import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

// Role-based landing router.
export default async function Home() {
  const user = await requireUser();

  if (user.role === "platform_admin") redirect("/admin");
  redirect("/dashboard");
}
