import type { Metadata } from "next";
import { AuthForm } from "@/app/(auth)/auth-form";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
