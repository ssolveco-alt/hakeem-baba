import { AppFrame } from "./app-frame";

// Client-rendered shell (auth happens in AppFrame). Keeping this layout free of
// server data makes the clinic routes static & fully navigable offline.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppFrame>{children}</AppFrame>;
}
