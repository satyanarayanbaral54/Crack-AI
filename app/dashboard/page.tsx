"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AuthMessage } from "@/components/AuthMessage";
import { SubmitButton } from "@/components/SubmitButton";
import {
  isSupabaseConfigured,
  supabase,
  supabaseConfigError,
} from "@/lib/supabase";

const exams = [
  {
    name: "JEE",
    description: "Engineering entrance preparation",
    accent: "from-cyan-500 to-blue-600",
  },
  {
    name: "NEET",
    description: "Medical entrance preparation",
    accent: "from-emerald-500 to-teal-600",
  },
  {
    name: "UPSC",
    description: "Civil services preparation",
    accent: "from-amber-500 to-orange-600",
  },
  {
    name: "GATE",
    description: "Postgraduate engineering preparation",
    accent: "from-violet-500 to-fuchsia-600",
  },
  {
    name: "CAT",
    description: "Management entrance preparation",
    accent: "from-rose-500 to-red-600",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [savingExam, setSavingExam] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      if (!isSupabaseConfigured) {
        router.replace("/login");
        return;
      }

      const { data } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (!data.session) {
        router.replace("/login");
        return;
      }

      setUser(data.session.user);
      setLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
        return;
      }

      setUser(session.user);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function handleExamSelect(examName: string) {
    setError("");
    setMessage("");

    if (!isSupabaseConfigured) {
      setError(supabaseConfigError);
      return;
    }

    if (!user) {
      setError("Please sign in again before choosing an exam.");
      router.replace("/login");
      return;
    }

    setSavingExam(examName);

    const { error: saveError } = await supabase
      .from("student_exam_selections")
      .upsert(
        {
          user_id: user.id,
          email: user.email,
          exam: examName,
          selected_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (saveError) {
      setError(saveError.message);
      setSavingExam(null);
      return;
    }

    setMessage(`${examName} selected successfully. Redirecting to AI doubt page...`);

    setTimeout(() => {
      router.push(`/ai-doubt?exam=${encodeURIComponent(examName)}`);
    }, 900);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
        <span
          className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500/30 border-t-teal-500"
          aria-label="Loading dashboard"
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-6">
      <section className="mx-auto max-w-6xl rounded-[1.5rem] border border-white/70 bg-white p-6 shadow-glow dark:border-white/10 dark:bg-slate-900 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-600 dark:text-teal-300">
              Student Dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
              Choose Your Exam
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Signed in as {user?.email}
            </p>
          </div>
          <div className="w-full sm:w-40">
            <SubmitButton type="button" loading={signingOut} onClick={handleSignOut}>
              Sign out
            </SubmitButton>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {error ? <AuthMessage message={error} type="error" /> : null}
          {message ? <AuthMessage message={message} type="success" /> : null}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {exams.map((exam) => (
            <button
              key={exam.name}
              type="button"
              disabled={Boolean(savingExam)}
              onClick={() => handleExamSelect(exam.name)}
              className="group min-h-44 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:-translate-y-1 hover:border-teal-300 hover:bg-white hover:shadow-xl hover:shadow-slate-200/70 focus:outline-none focus:ring-4 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/10 dark:bg-slate-950 dark:hover:border-teal-400/60 dark:hover:bg-slate-900 dark:hover:shadow-black/30"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${exam.accent} text-sm font-bold text-white shadow-lg`}
              >
                {savingExam === exam.name ? (
                  <span
                    className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    aria-label={`Saving ${exam.name}`}
                  />
                ) : (
                  exam.name.slice(0, 1)
                )}
              </span>
              <span className="mt-6 block text-3xl font-semibold tracking-normal text-slate-950 dark:text-white">
                {exam.name}
              </span>
              <span className="mt-2 block text-sm leading-6 text-slate-600 dark:text-slate-300">
                {exam.description}
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
