"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { trackDailyPresence, trackEngagementEvent } from "@/lib/engagement";
import { getExamContent } from "@/lib/examContent";
import {
  isSupabaseConfigured,
  supabase,
} from "@/lib/supabase";

function SyllabusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedExam = useMemo(
    () => searchParams.get("exam")?.trim() ?? "",
    [searchParams],
  );
  const examDetails = useMemo(() => getExamContent(selectedExam), [selectedExam]);
  const [loading, setLoading] = useState(true);
  const [selectedTopicId, setSelectedTopicId] = useState("");

  const studyHref = `/study?exam=${encodeURIComponent(selectedExam)}`;
  const chatHref = `/ai-doubt?exam=${encodeURIComponent(selectedExam)}`;

  const topics = useMemo(
    () =>
      examDetails?.syllabusSections.flatMap((section) =>
        section.topics.map((topic) => ({
          ...topic,
          sectionTitle: section.title,
        })),
      ) ?? [],
    [examDetails],
  );

  const selectedTopic =
    topics.find((topic) => topic.id === selectedTopicId) ?? topics[0];

  useEffect(() => {
    setSelectedTopicId(topics[0]?.id ?? "");
  }, [topics]);

  useEffect(() => {
    if (loading || !selectedExam) {
      return;
    }

    trackDailyPresence({ exam: selectedExam, area: "syllabus" });
  }, [loading, selectedExam]);

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

      if (!selectedExam || !examDetails) {
        router.replace("/dashboard");
        return;
      }

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

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [examDetails, router, selectedExam]);

  if (loading || !examDetails || !selectedTopic) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <span
          className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500/30 border-t-teal-500"
          aria-label="Loading syllabus"
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-950 text-white">
      <style jsx>{`
        @keyframes syllabusRise {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes detailSwap {
          from {
            opacity: 0;
            transform: translateX(14px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes railGlow {
          0%,
          100% {
            box-shadow: 0 0 0 rgba(45, 212, 191, 0);
          }
          50% {
            box-shadow: 0 0 32px rgba(45, 212, 191, 0.18);
          }
        }

        .syllabus-rise {
          animation: syllabusRise 700ms ease-out both;
        }

        .topic-detail {
          animation: detailSwap 360ms ease-out both;
        }

        .active-topic {
          animation: railGlow 2.8s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .syllabus-rise,
          .topic-detail,
          .active-topic {
            animation-duration: 1ms;
            animation-iteration-count: 1;
          }
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,#020617,#081524_48%,#020617)]" />
      <div className="pointer-events-none fixed inset-0 auth-grid opacity-45" />

      <div className="relative mx-auto min-h-screen w-full max-w-7xl px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
        <header className="syllabus-rise sticky top-2 z-20 rounded-2xl border border-white/10 bg-slate-950/76 px-3 py-3 shadow-2xl shadow-black/25 backdrop-blur-xl sm:top-4 sm:px-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href={studyHref}
              className="text-lg font-semibold tracking-normal text-white sm:text-xl"
            >
              Crack AI
            </Link>

            <nav
              className="flex w-full gap-2 overflow-x-auto pb-1 text-sm font-semibold text-slate-300 sm:w-auto sm:flex-wrap sm:overflow-visible sm:pb-0"
              aria-label="Syllabus navigation"
            >
              <Link
                href={studyHref}
                className="shrink-0 rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white sm:px-4"
              >
                Dashboard
              </Link>
              <Link
                href={chatHref}
                className="shrink-0 rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white sm:px-4"
              >
                Chatbot
              </Link>
              <Link
                href="/dashboard"
                className="shrink-0 rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white sm:px-4"
              >
                Exams
              </Link>
            </nav>
          </div>
        </header>

        <section className="syllabus-rise py-8 sm:py-14">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300 sm:text-sm sm:tracking-[0.3em]">
              {examDetails.name} syllabus
            </p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-normal text-white sm:mt-5 sm:text-5xl">
              Know the exact path before you start the next study sprint.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:mt-5 sm:text-base sm:leading-8">
              {examDetails.syllabusIntro}
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {examDetails.focusAreas.map((focusArea) => (
                <span
                  key={focusArea}
                  className="rounded-full border border-teal-300/25 bg-teal-300/10 px-3 py-1 text-xs font-semibold text-teal-100"
                >
                  {focusArea}
                </span>
              ))}
              <a
                href={examDetails.sourceHref}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-orange-300/25 bg-orange-300/10 px-3 py-1 text-xs font-semibold text-orange-100 transition hover:border-orange-200 hover:bg-orange-300/15"
              >
                {examDetails.sourceLabel}
              </a>
            </div>
          </div>
        </section>

        <section className="grid gap-6 pb-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            {examDetails.syllabusSections.map((section, sectionIndex) => (
              <section
                key={section.title}
                className="syllabus-rise rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-xl shadow-black/15 backdrop-blur-md"
                style={{ animationDelay: `${sectionIndex * 90}ms` }}
              >
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-300">
                    {section.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {section.overview}
                  </p>
                </div>

                <div className="grid gap-2">
                  {section.topics.map((topic) => {
                    const isActive = topic.id === selectedTopic.id;

                    return (
                      <button
                        key={topic.id}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => {
                          setSelectedTopicId(topic.id);
                          trackEngagementEvent({
                            type: "syllabus",
                            exam: selectedExam,
                            metadata: {
                              section: section.title,
                              topic: topic.title,
                            },
                          });
                        }}
                        className={`group flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-teal-300/20 sm:gap-4 sm:px-4 ${
                          isActive
                            ? "active-topic border-teal-300/50 bg-teal-300/12 text-white"
                            : "border-white/10 bg-slate-950/45 text-slate-200 hover:border-teal-300/30 hover:bg-white/[0.07]"
                        }`}
                      >
                        <span>
                          <span className="block text-sm font-semibold">
                            {topic.title}
                          </span>
                          <span className="mt-1 block text-xs text-slate-400 transition group-hover:text-slate-300">
                            {topic.highlights.length} focus points
                          </span>
                        </span>
                        <span
                          className={`h-2.5 w-2.5 rounded-full transition ${
                            isActive ? "bg-teal-200" : "bg-slate-600"
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div
              key={selectedTopic.id}
              className="topic-detail rounded-2xl border border-white/10 bg-slate-900/78 p-4 shadow-2xl shadow-black/25 backdrop-blur-xl sm:rounded-[1.75rem] sm:p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-200">
                {selectedTopic.sectionTitle}
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal text-white sm:text-3xl">
                {selectedTopic.title}
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                {selectedTopic.description}
              </p>

              <div className="mt-7">
                <h3 className="text-sm font-semibold text-white">
                  What to cover
                </h3>
                <ul className="mt-4 space-y-3">
                  {selectedTopic.highlights.map((highlight, index) => (
                    <li
                      key={highlight}
                      className="flex gap-3 rounded-xl border border-white/8 bg-slate-950/38 px-3 py-3 sm:px-4"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-300/12 text-xs font-semibold text-teal-100">
                        {index + 1}
                      </span>
                      <span className="text-sm leading-6 text-slate-300">
                        {highlight}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <Link
                  href={chatHref}
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-teal-500 px-5 text-sm font-semibold text-slate-950 shadow-xl shadow-teal-500/20 transition hover:-translate-y-0.5 hover:bg-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-300/25"
                >
                  Ask AI
                </Link>
                <Link
                  href={studyHref}
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-white/12 px-5 text-sm font-semibold text-slate-200 transition hover:-translate-y-0.5 hover:border-teal-300/70 hover:text-white focus:outline-none focus:ring-4 focus:ring-white/10"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

export default function SyllabusPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-950">
          <span
            className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500/30 border-t-teal-500"
            aria-label="Loading syllabus"
          />
        </main>
      }
    >
      <SyllabusContent />
    </Suspense>
  );
}
