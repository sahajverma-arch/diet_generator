import { redirect } from "next/navigation";

// The root simply forwards into the app; middleware handles auth gating
// (unauthenticated users are redirected to /login).
export default function RootPage() {
  redirect("/dashboard");
}
