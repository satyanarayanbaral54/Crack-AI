"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { SubmitButton } from "@/components/SubmitButton";
import {
  isSupabaseConfigured,
  supabase,
} from "@/lib/supabase";

function StudyDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedExam = useMemo(
    () => searchParams.get("exam")?.trim() ?? "",
    [searchParams],
  );
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const chatHref = `/ai-doubt?exam=${encodeURIComponent(selectedExam)}`;

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

      if (!selectedExam) {
        router.replace("/dashboard");
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
  }, [router, selectedExam]);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function openChat() {
    router.push(chatHref);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <span
          className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500/30 border-t-teal-500"
          aria-label="Loading study dashboard"
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <style jsx>{`
        @keyframes dashboardRise {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes orbitSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes reverseOrbitSpin {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes pulseGlow {
          0%,
          100% {
            opacity: 0.45;
            transform: scale(0.95);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.08);
          }
        }

        @keyframes floatCore {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-12px);
          }
        }

        .dashboard-rise {
          animation: dashboardRise 760ms ease-out both;
        }

        .orbit-primary {
          animation: orbitSpin 12s linear infinite;
        }

        .orbit-secondary {
          animation: reverseOrbitSpin 16s linear infinite;
        }

        .pulse-glow {
          animation: pulseGlow 3.8s ease-in-out infinite;
        }

        .float-core {
          animation: floatCore 4.2s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .dashboard-rise,
          .orbit-primary,
          .orbit-secondary,
          .pulse-glow,
          .float-core {
            animation-duration: 1ms;
            animation-iteration-count: 1;
          }
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(20,184,166,0.22),transparent_28%),radial-gradient(circle_at_82%_28%,rgba(249,115,22,0.1),transparent_24%),linear-gradient(180deg,#020617,#07111f_46%,#020617)]" />
      <div className="pointer-events-none fixed inset-0 auth-grid opacity-45" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="dashboard-rise sticky top-4 z-20 rounded-2xl border border-white/10 bg-slate-950/72 px-4 py-3 shadow-2xl shadow-black/25 backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="#home"
              className="text-xl font-semibold tracking-normal text-white"
            >
              Crack AI
            </Link>

            <nav
              className="flex flex-wrap gap-2 text-sm font-semibold text-slate-300"
              aria-label="Study dashboard"
            >
              <a
                href="#home"
                className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white"
              >
                Home
              </a>
              <a
                href="#growth"
                className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white"
              >
                Growth
              </a>
              <a
                href="#profile"
                className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white"
              >
                Profile
              </a>
              <Link
                href="/dashboard"
                className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white"
              >
                Exams
              </Link>
            </nav>
          </div>
        </header>

        <section
          id="home"
          className="dashboard-rise grid flex-1 items-center gap-10 py-14 lg:grid-cols-[0.96fr_1.04fr] lg:py-16"
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-300">
              {selectedExam} learning dashboard
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-white sm:text-5xl lg:text-6xl">
              Practice smarter with an AI study companion built for focus.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">
              Ask doubts, revise concepts, generate quizzes, and keep your exam
              preparation moving from one clean workspace.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={chatHref}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-teal-500 px-6 text-sm font-semibold text-slate-950 shadow-xl shadow-teal-500/20 transition hover:-translate-y-0.5 hover:bg-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-300/30"
              >
                Open AI Chat
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/12 px-6 text-sm font-semibold text-slate-200 transition hover:-translate-y-0.5 hover:border-teal-300/70 hover:text-white focus:outline-none focus:ring-4 focus:ring-white/10"
              >
                Change Exam
              </Link>
            </div>
          </div>

          <button
            type="button"
            onClick={openChat}
            className="group relative mx-auto flex aspect-square w-full max-w-[520px] items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/35 outline-none backdrop-blur-md transition hover:-translate-y-1 hover:border-teal-300/50 focus:ring-4 focus:ring-teal-400/25"
            aria-label="Open AI chatbot"
          >
            <div className="pulse-glow absolute h-[62%] w-[62%] rounded-full bg-teal-300/20 blur-3xl" />
            <div className="orbit-primary absolute h-[82%] w-[82%] rounded-full border border-dashed border-teal-200/26">
              <span className="absolute left-1/2 top-[-7px] h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-teal-200 shadow-[0_0_24px_rgba(94,234,212,0.9)]" />
              <span className="absolute bottom-8 right-3 h-2.5 w-2.5 rounded-full bg-orange-300 shadow-[0_0_20px_rgba(253,186,116,0.8)]" />
            </div>
            <div className="orbit-secondary absolute h-[62%] w-[62%] rounded-full border border-white/12">
              <span className="absolute bottom-[-6px] left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-cyan-200 shadow-[0_0_20px_rgba(165,243,252,0.8)]" />
            </div>
            <div className="float-core relative flex h-44 w-44 items-center justify-center rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.45)] sm:h-56 sm:w-56">
              <img
                src="/crack-ai-logo.png"
                alt="Crack AI logo"
                className="max-h-full max-w-full object-contain drop-shadow-[0_0_36px_rgba(45,212,191,0.42)]"
              />
            </div>
            <span className="absolute bottom-6 rounded-full border border-teal-300/30 bg-slate-950/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-200 transition group-hover:border-teal-200 group-hover:text-white">
              Click to ask AI
            </span>
          </button>
        </section>

        <section
          id="growth"
          className="dashboard-rise grid gap-4 pb-8 md:grid-cols-3"
        >
          {[
            ["Doubt solving", "Ask concept questions and receive structured answers."],
            ["Smart quizzes", "Turn any topic into quick practice tests."],
            ["Resource path", "Get videos, PDFs, and topics after every answer."],
          ].map(([title, description]) => (
            <article
              key={title}
              className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-xl shadow-black/15 backdrop-blur-md transition hover:-translate-y-1 hover:border-teal-300/40"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-300">
                Growth
              </p>
              <h2 className="mt-3 text-xl font-semibold tracking-normal text-white">
                {title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {description}
              </p>
            </article>
          ))}
        </section>

        <section
          id="profile"
          className="dashboard-rise mb-6 grid gap-4 rounded-[1.75rem] border border-white/10 bg-slate-900/70 p-5 shadow-2xl shadow-black/20 backdrop-blur-md lg:grid-cols-[1fr_0.7fr]"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-300">
              Profile
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-normal text-white">
              Ready for {selectedExam}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Signed in as {user?.email}. Your selected exam stays connected to
              the AI chat and quiz tools.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Link
              href={chatHref}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-teal-100 focus:outline-none focus:ring-4 focus:ring-white/20"
            >
              Continue to Chatbot
            </Link>
            <SubmitButton
              type="button"
              loading={signingOut}
              onClick={handleSignOut}
            >
              Sign out
            </SubmitButton>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function StudyDashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-950">
          <span
            className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500/30 border-t-teal-500"
            aria-label="Loading study dashboard"
          />
        </main>
      }
    >
      <StudyDashboardContent />
    </Suspense>
  );
}
