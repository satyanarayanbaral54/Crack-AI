"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AuthMessage } from "@/components/AuthMessage";
import {
  isSupabaseConfigured,
  supabase,
  supabaseConfigError,
} from "@/lib/supabase";

const exams = [
  {
    name: "JEE",
    description: "Engineering entrance preparation",
    logo: "/exam-logos/jee.png",
    logoAlt: "National Testing Agency logo for JEE",
  },
  {
    name: "NEET",
    description: "Medical entrance preparation",
    logo: "/exam-logos/neet.webp",
    logoAlt: "National Testing Agency logo for NEET",
  },
  {
    name: "UPSC",
    description: "Civil services preparation",
    logo: "/exam-logos/upsc.png",
    logoAlt: "UPSC logo",
  },
  {
    name: "GATE",
    description: "Postgraduate engineering preparation",
    logo: "/exam-logos/gate.png",
    logoAlt: "GATE logo",
  },
  {
    name: "CAT",
    description: "Management entrance preparation",
    logo: "/exam-logos/cat.jpg",
    logoAlt: "CAT logo",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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
        { onConflict: "user_id" }
      );

    if (saveError) {
      setError(saveError.message);
      setSavingExam(null);
      return;
    }

    setMessage(`${examName} selected successfully. Opening your study dashboard...`);

    setTimeout(() => {
      router.push(`/study?exam=${encodeURIComponent(examName)}`);
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
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-6">
      <section className="w-full max-w-6xl rounded-[1.5rem] border border-white/70 bg-white p-6 shadow-glow dark:border-white/10 dark:bg-slate-900 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-600 dark:text-teal-300">
              Competative Exams
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
              Choose Your Exam
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Signed in as {user?.email}
            </p>
          </div>
          <div className="w-full sm:w-40">
            <Link
              href="/study"
              className="flex h-12 w-full items-center justify-center rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/30"
            >
              Dashboard
            </Link>
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
              <span className="flex h-16 w-20 items-center justify-center rounded-2xl border border-white/80 bg-white p-2 shadow-lg shadow-black/10">
                {savingExam === exam.name ? (
                  <span
                    className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-teal-500"
                    aria-label={`Saving ${exam.name}`}
                  />
                ) : (
                  <img
                    src={exam.logo}
                    alt={exam.logoAlt}
                    className="max-h-full max-w-full object-contain"
                  />
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
