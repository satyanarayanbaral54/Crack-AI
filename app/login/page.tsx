"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthMessage } from "@/components/AuthMessage";
import { AuthShell } from "@/components/AuthShell";
import { SubmitButton } from "@/components/SubmitButton";
import {
  isSupabaseConfigured,
  supabase,
  supabaseConfigError,
} from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    if (!isSupabaseConfigured) {
      setError(supabaseConfigError);
      setLoading(false);
      return;
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (loginError) {
      setError(loginError.message);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to your account"
      subtitle="Use your email and password to continue to the dashboard."
    >
      <form className="space-y-5" onSubmit={handleLogin}>
        {error ? <AuthMessage message={error} type="error" /> : null}

        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Email address
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Password
          </span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
            placeholder="Enter your password"
            className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
          />
        </label>

        <SubmitButton loading={loading}>Sign in</SubmitButton>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-300">
        New here?{" "}
        <Link
          href="/signup"
          className="font-semibold text-teal-700 hover:text-teal-600 dark:text-teal-300"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
