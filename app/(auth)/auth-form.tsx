"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp, type AuthState } from "@/app/(auth)/actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="brand" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" /> Please wait…
        </>
      ) : (
        label
      )}
    </Button>
  );
}

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction] = useActionState<AuthState, FormData>(action, {});

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {mode === "signin"
            ? "Sign in to generate and manage diet reports."
            : "Start generating premium diet reports for your clients."}
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@leanr.co"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            placeholder="••••••••"
            minLength={6}
            required
          />
        </div>

        {state.error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        ) : null}
        {state.message ? (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {state.message}
          </p>
        ) : null}

        <SubmitButton label={mode === "signin" ? "Sign in" : "Create account"} />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "signin" ? (
          <>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-brand-black underline underline-offset-4">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-brand-black underline underline-offset-4">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
