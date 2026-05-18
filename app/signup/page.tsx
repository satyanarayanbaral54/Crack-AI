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

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (!isSupabaseConfigured) {
      setError(supabaseConfigError);
      setLoading(false);
      return;
    }

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (signupError) {
      setError(signupError.message);
      return;
    }

    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    setMessage("Check your email to confirm your account before signing in.");
  }

  return (
    <AuthShell
      eyebrow="Start fresh"
      title="Create your account"
      subtitle="Sign up with email and password. Supabase will handle the session and confirmation flow."
    >
      <form className="space-y-5" onSubmit={handleSignup}>
        {error ? <AuthMessage message={error} type="error" /> : null}
        {message ? <AuthMessage message={message} type="success" /> : null}

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
            minLength={6}
            autoComplete="new-password"
            placeholder="At least 6 characters"
            className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
          />
        </label>

        <SubmitButton loading={loading}>Create account</SubmitButton>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-300">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-teal-700 hover:text-teal-600 dark:text-teal-300"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
