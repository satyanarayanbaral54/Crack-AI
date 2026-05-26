"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { getChatHistory, type ChatHistoryRecord } from "@/lib/chatHistory";
import {
  formatLocalDateKey,
  getEngagementEvents,
  trackDailyPresence,
  type EngagementEvent,
} from "@/lib/engagement";
import { getExamContent } from "@/lib/examContent";
import {
  isSupabaseConfigured,
  supabase,
} from "@/lib/supabase";

type ExamSelection = {
  exam: string | null;
  selected_at: string | null;
};

type GraphMode = "daily" | "monthly";
type StreakMode = "date" | "month";

type ActivityBucket = {
  key: string;
  label: string;
  shortLabel: string;
  questions: number;
  quizzes: number;
  presence: number;
  resources: number;
  other: number;
  score: number;
};

type Suggestion = {
  title: string;
  body: string;
  accent: "amber" | "cyan" | "emerald" | "rose";
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DAILY_GRAPH_DAYS = 14;
const MONTHLY_GRAPH_MONTHS = 6;
const STREAK_DAYS = 84;
const STREAK_MONTHS = 12;

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number) {
  return new Date(date.getTime() + amount * DAY_IN_MS);
}

function parseRecordDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

function formatShortMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
  }).format(date);
}

function createDayBucket(date: Date): ActivityBucket {
  return {
    key: formatLocalDateKey(date),
    label: formatDayLabel(date),
    shortLabel: new Intl.DateTimeFormat("en", { weekday: "short" }).format(date),
    questions: 0,
    quizzes: 0,
    presence: 0,
    resources: 0,
    other: 0,
    score: 0,
  };
}

function createMonthBucket(date: Date): ActivityBucket {
  return {
    key: formatMonthKey(date),
    label: formatMonthLabel(date),
    shortLabel: formatShortMonthLabel(date),
    questions: 0,
    quizzes: 0,
    presence: 0,
    resources: 0,
    other: 0,
    score: 0,
  };
}

function scoreBucket(bucket: ActivityBucket) {
  return {
    ...bucket,
    score:
      bucket.presence * 2 +
      bucket.questions * 5 +
      bucket.quizzes * 4 +
      bucket.resources * 2 +
      bucket.other * 2,
  };
}

function registerEngagement(
  bucket: ActivityBucket,
  eventType: EngagementEvent["type"],
) {
  bucket.presence = Math.max(bucket.presence, 1);

  if (eventType === "quiz") {
    bucket.quizzes += 1;
  }

  if (eventType === "resource") {
    bucket.resources += 1;
  }

  if (eventType === "syllabus") {
    bucket.other += 1;
  }
}

function buildDayBuckets(
  historyItems: ChatHistoryRecord[],
  engagementEvents: EngagementEvent[],
  dayCount: number,
) {
  const today = startOfLocalDay(new Date());
  const firstDay = addDays(today, 1 - dayCount);
  const bucketMap = new Map<string, ActivityBucket>();

  for (let index = 0; index < dayCount; index += 1) {
    const bucket = createDayBucket(addDays(firstDay, index));
    bucketMap.set(bucket.key, bucket);
  }

  historyItems.forEach((item) => {
    const date = parseRecordDate(item.createdAt);
    const bucket = date ? bucketMap.get(formatLocalDateKey(date)) : null;

    if (!bucket) {
      return;
    }

    bucket.questions += 1;
    bucket.presence = Math.max(bucket.presence, 1);
  });

  engagementEvents.forEach((event) => {
    const date = parseRecordDate(event.createdAt);
    const bucket = date ? bucketMap.get(formatLocalDateKey(date)) : null;

    if (!bucket) {
      return;
    }

    registerEngagement(bucket, event.type);
  });

  return Array.from(bucketMap.values()).map(scoreBucket);
}

function buildMonthBuckets(
  historyItems: ChatHistoryRecord[],
  engagementEvents: EngagementEvent[],
  monthCount: number,
) {
  const now = new Date();
  const bucketMap = new Map<string, ActivityBucket>();
  const activeDaysByMonth = new Map<string, Set<string>>();

  for (let index = monthCount - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const bucket = createMonthBucket(date);
    bucketMap.set(bucket.key, bucket);
    activeDaysByMonth.set(bucket.key, new Set());
  }

  function registerMonthActivity(
    date: Date,
    updateBucket: (bucket: ActivityBucket) => void,
  ) {
    const monthKey = formatMonthKey(date);
    const bucket = bucketMap.get(monthKey);

    if (!bucket) {
      return;
    }

    activeDaysByMonth.get(monthKey)?.add(formatLocalDateKey(date));
    updateBucket(bucket);
  }

  historyItems.forEach((item) => {
    const date = parseRecordDate(item.createdAt);

    if (!date) {
      return;
    }

    registerMonthActivity(date, (bucket) => {
      bucket.questions += 1;
    });
  });

  engagementEvents.forEach((event) => {
    const date = parseRecordDate(event.createdAt);

    if (!date) {
      return;
    }

    registerMonthActivity(date, (bucket) => {
      if (event.type === "quiz") {
        bucket.quizzes += 1;
      }

      if (event.type === "resource") {
        bucket.resources += 1;
      }

      if (event.type === "syllabus") {
        bucket.other += 1;
      }
    });
  });

  return Array.from(bucketMap.values()).map((bucket) =>
    scoreBucket({
      ...bucket,
      presence: activeDaysByMonth.get(bucket.key)?.size ?? 0,
    }),
  );
}

function getCurrentStreak(days: ActivityBucket[]) {
  let streak = 0;

  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (days[index].score <= 0) {
      break;
    }

    streak += 1;
  }

  return streak;
}

function getLongestStreak(days: ActivityBucket[]) {
  let longest = 0;
  let current = 0;

  days.forEach((day) => {
    if (day.score > 0) {
      current += 1;
      longest = Math.max(longest, current);
      return;
    }

    current = 0;
  });

  return longest;
}

function getIntensityClass(score: number, maxScore: number) {
  if (score <= 0) {
    return "border-white/10 bg-white/[0.045]";
  }

  const ratio = maxScore > 0 ? score / maxScore : 0;

  if (ratio >= 0.76) {
    return "border-emerald-200/70 bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.35)]";
  }

  if (ratio >= 0.48) {
    return "border-teal-200/60 bg-teal-400/85 shadow-[0_0_14px_rgba(45,212,191,0.28)]";
  }

  if (ratio >= 0.24) {
    return "border-cyan-200/40 bg-cyan-400/55";
  }

  return "border-slate-500/50 bg-slate-600/70";
}

function getSegmentHeight(value: number, score: number) {
  if (score <= 0 || value <= 0) {
    return "0%";
  }

  return `${Math.max((value / score) * 100, 8)}%`;
}

function getSuggestions({
  currentMonth,
  previousMonth,
  currentStreak,
}: {
  currentMonth: ActivityBucket;
  previousMonth: ActivityBucket;
  currentStreak: number;
}): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const trend = currentMonth.score - previousMonth.score;

  if (currentMonth.presence < 12) {
    suggestions.push({
      title: "Build a steadier study rhythm",
      body: "Aim for at least 12 active days this month with short daily sessions before increasing study load.",
      accent: "amber",
    });
  } else {
    suggestions.push({
      title: "Protect the active-day base",
      body: "Your presence pattern is forming well. Keep one compact revision slot reserved for weak topics each active day.",
      accent: "emerald",
    });
  }

  if (currentMonth.questions === 0) {
    suggestions.push({
      title: "Start with doubt capture",
      body: "Ask topic-specific doubts after every study block so the graph can reveal where your preparation needs support.",
      accent: "cyan",
    });
  } else if (currentMonth.quizzes < Math.max(2, Math.ceil(currentMonth.questions / 2))) {
    suggestions.push({
      title: "Turn more doubts into practice",
      body: "Pair every two AI answers with one quiz session to convert explanations into recall strength.",
      accent: "cyan",
    });
  } else {
    suggestions.push({
      title: "Increase quiz difficulty gradually",
      body: "Your quiz rhythm is matching your doubts. Add mixed-topic quizzes to test retention under exam-like switching.",
      accent: "emerald",
    });
  }

  if (currentMonth.resources + currentMonth.other < currentMonth.questions) {
    suggestions.push({
      title: "Use the resource path more",
      body: "Open at least one recommended video, PDF, or syllabus topic after each hard doubt to close learning gaps faster.",
      accent: "rose",
    });
  } else if (trend < 0) {
    suggestions.push({
      title: "Recover this month’s momentum",
      body: "Your monthly activity is behind the previous month. Set a three-day mini target: one doubt, one quiz, one revision topic.",
      accent: "amber",
    });
  } else {
    suggestions.push({
      title: "Keep compounding the streak",
      body: `Your current streak is ${currentStreak} day${currentStreak === 1 ? "" : "s"}. Use the next sessions for revision and error correction.`,
      accent: "emerald",
    });
  }

  return suggestions;
}

function suggestionAccentClass(accent: Suggestion["accent"]) {
  if (accent === "amber") {
    return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  }

  if (accent === "cyan") {
    return "border-cyan-300/30 bg-cyan-300/10 text-cyan-100";
  }

  if (accent === "rose") {
    return "border-rose-300/30 bg-rose-300/10 text-rose-100";
  }

  return "border-emerald-300/30 bg-emerald-300/10 text-emerald-100";
}

function GrowthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examFromUrl = useMemo(
    () => searchParams.get("exam")?.trim() ?? "",
    [searchParams],
  );
  const [selectedExam, setSelectedExam] = useState(examFromUrl);
  const [historyItems, setHistoryItems] = useState<ChatHistoryRecord[]>([]);
  const [engagementEvents, setEngagementEvents] = useState<EngagementEvent[]>([]);
  const [graphMode, setGraphMode] = useState<GraphMode>("daily");
  const [streakMode, setStreakMode] = useState<StreakMode>("date");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const examDetails = useMemo(() => getExamContent(selectedExam), [selectedExam]);
  const studyHref = selectedExam
    ? `/study?exam=${encodeURIComponent(selectedExam)}`
    : "/dashboard";
  const chatHref = selectedExam
    ? `/ai-doubt?exam=${encodeURIComponent(selectedExam)}`
    : "/dashboard";
  const profileHref = selectedExam
    ? `/profile?exam=${encodeURIComponent(selectedExam)}`
    : "/profile";

  useEffect(() => {
    let mounted = true;

    async function loadGrowthContext() {
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

      let resolvedExam = examFromUrl;

      if (!resolvedExam) {
        const { data: selection, error: selectionError } = await supabase
          .from("student_exam_selections")
          .select("exam, selected_at")
          .eq("user_id", data.session.user.id)
          .maybeSingle<ExamSelection>();

        if (!mounted) {
          return;
        }

        if (selectionError) {
          setError(selectionError.message);
        }

        resolvedExam = selection?.exam ?? "";
      }

      if (!resolvedExam || !getExamContent(resolvedExam)) {
        router.replace("/dashboard");
        return;
      }

      setSelectedExam(resolvedExam);
      setLoading(false);
    }

    loadGrowthContext();

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
  }, [examFromUrl, router]);

  useEffect(() => {
    if (loading || !selectedExam) {
      return;
    }

    function loadActivity() {
      setHistoryItems(getChatHistory(selectedExam));
      setEngagementEvents(getEngagementEvents(selectedExam));
    }

    trackDailyPresence({ exam: selectedExam, area: "growth" });
    loadActivity();
    window.addEventListener("focus", loadActivity);
    window.addEventListener("storage", loadActivity);

    return () => {
      window.removeEventListener("focus", loadActivity);
      window.removeEventListener("storage", loadActivity);
    };
  }, [loading, selectedExam]);

  const dailyBuckets = useMemo(
    () => buildDayBuckets(historyItems, engagementEvents, DAILY_GRAPH_DAYS),
    [engagementEvents, historyItems],
  );
  const monthlyBuckets = useMemo(
    () =>
      buildMonthBuckets(historyItems, engagementEvents, MONTHLY_GRAPH_MONTHS),
    [engagementEvents, historyItems],
  );
  const streakDays = useMemo(
    () => buildDayBuckets(historyItems, engagementEvents, STREAK_DAYS),
    [engagementEvents, historyItems],
  );
  const streakMonths = useMemo(
    () => buildMonthBuckets(historyItems, engagementEvents, STREAK_MONTHS),
    [engagementEvents, historyItems],
  );
  const monthlyOverview = useMemo(
    () => buildMonthBuckets(historyItems, engagementEvents, 2),
    [engagementEvents, historyItems],
  );

  const chartBuckets = graphMode === "daily" ? dailyBuckets : monthlyBuckets;
  const chartMaxScore = Math.max(...chartBuckets.map((bucket) => bucket.score), 1);
  const streakMaxScore = Math.max(
    ...streakDays.map((bucket) => bucket.score),
    ...streakMonths.map((bucket) => bucket.score),
    1,
  );
  const currentMonth =
    monthlyOverview[monthlyOverview.length - 1] ?? createMonthBucket(new Date());
  const previousMonth =
    monthlyOverview[monthlyOverview.length - 2] ?? createMonthBucket(new Date());
  const currentStreak = getCurrentStreak(streakDays);
  const longestStreak = getLongestStreak(streakDays);
  const suggestions = getSuggestions({
    currentMonth,
    previousMonth,
    currentStreak,
  });
  const statCards = [
    {
      label: "Active days",
      value: currentMonth.presence,
      detail: `${currentStreak} day current streak`,
      tone: "from-emerald-300/22 to-emerald-500/5",
    },
    {
      label: "Doubts solved",
      value: currentMonth.questions,
      detail: `${historyItems.length} saved in total`,
      tone: "from-cyan-300/22 to-cyan-500/5",
    },
    {
      label: "Quiz practices",
      value: currentMonth.quizzes,
      detail: "Tracked from quiz sessions",
      tone: "from-amber-300/22 to-amber-500/5",
    },
    {
      label: "Other engagements",
      value: currentMonth.resources + currentMonth.other,
      detail: "Resources and syllabus focus",
      tone: "from-rose-300/18 to-rose-500/5",
    },
  ];

  if (loading || !examDetails) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <span
          className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500/30 border-t-teal-500"
          aria-label="Loading growth analytics"
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-950 text-white">
      <style jsx>{`
        @keyframes growthRise {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes barReveal {
          from {
            opacity: 0;
            transform: scaleY(0.18);
          }
          to {
            opacity: 1;
            transform: scaleY(1);
          }
        }

        @keyframes heatReveal {
          from {
            opacity: 0;
            transform: scale(0.72);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes activePulse {
          0%,
          100% {
            box-shadow: 0 0 0 rgba(94, 234, 212, 0);
          }
          50% {
            box-shadow: 0 0 34px rgba(94, 234, 212, 0.18);
          }
        }

        .growth-rise {
          animation: growthRise 720ms ease-out both;
        }

        .bar-reveal {
          animation: barReveal 860ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
          transform-origin: bottom;
        }

        .heat-reveal {
          animation: heatReveal 420ms ease-out both;
        }

        .active-pulse {
          animation: activePulse 3s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .growth-rise,
          .bar-reveal,
          .heat-reveal,
          .active-pulse {
            animation-duration: 1ms;
            animation-iteration-count: 1;
          }
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,#020617,#08111f_46%,#020617)]" />
      <div className="pointer-events-none fixed inset-0 auth-grid opacity-45" />

      <div className="relative mx-auto min-h-screen w-full max-w-7xl px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
        <header className="growth-rise sticky top-2 z-20 rounded-2xl border border-white/10 bg-slate-950/76 px-3 py-3 shadow-2xl shadow-black/25 backdrop-blur-xl sm:top-4 sm:px-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href={studyHref}
              className="text-lg font-semibold tracking-normal text-white sm:text-xl"
            >
              Crack AI
            </Link>

            <nav
              className="flex w-full gap-2 overflow-x-auto pb-1 text-sm font-semibold text-slate-300 sm:w-auto sm:flex-wrap sm:overflow-visible sm:pb-0"
              aria-label="Growth navigation"
            >
              <Link
                href={studyHref}
                className="shrink-0 rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white sm:px-4"
              >
                Home
              </Link>
              <Link
                href={`/growth?exam=${encodeURIComponent(selectedExam)}`}
                className="active-pulse shrink-0 rounded-full border border-teal-300/30 bg-teal-300/12 px-3 py-2 text-teal-100 transition hover:bg-teal-300/16 hover:text-white sm:px-4"
              >
                Growth
              </Link>
              <Link
                href={profileHref}
                className="shrink-0 rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white sm:px-4"
              >
                Profile
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

        <section className="growth-rise py-8 sm:py-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300 sm:text-sm sm:tracking-[0.3em]">
                {examDetails.name} growth analytics
              </p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-normal text-white sm:mt-5 sm:text-5xl">
                Your preparation momentum, mapped by action.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:mt-5 sm:text-base sm:leading-8">
                Daily presence, AI doubts, quiz practice, resources, and syllabus
                focus are combined into one clear learning signal.
              </p>
              {error ? (
                <p className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                  {error}
                </p>
              ) : null}
            </div>

            <Link
              href={chatHref}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-teal-400 px-6 text-sm font-semibold text-slate-950 shadow-xl shadow-teal-500/20 transition hover:-translate-y-0.5 hover:bg-teal-200 focus:outline-none focus:ring-4 focus:ring-teal-300/25 sm:w-auto"
            >
              Continue Practice
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card, index) => (
            <article
              key={card.label}
              className={`growth-rise rounded-2xl border border-white/10 bg-gradient-to-br ${card.tone} p-5 shadow-xl shadow-black/15 backdrop-blur-md transition hover:-translate-y-1 hover:border-white/20`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                {card.label}
              </p>
              <p className="mt-4 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
                {card.value}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {card.detail}
              </p>
            </article>
          ))}
        </section>

        <section className="growth-rise mt-6 rounded-2xl border border-white/10 bg-white/[0.05] p-4 shadow-2xl shadow-black/20 backdrop-blur-md sm:rounded-[1.75rem] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                Learning graph
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal text-white">
                Daily and monthly engagement
              </h2>
            </div>

            <div className="flex w-full rounded-xl border border-white/10 bg-slate-950/58 p-1 text-sm font-semibold text-slate-300 sm:w-auto">
              {(["daily", "monthly"] as GraphMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setGraphMode(mode)}
                  className={`h-10 flex-1 rounded-lg px-4 capitalize transition sm:flex-none ${
                    graphMode === mode
                      ? "bg-white text-slate-950"
                      : "hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold text-slate-300">
            {[
              ["Presence", "bg-emerald-300"],
              ["Asked questions", "bg-cyan-300"],
              ["Quiz practice", "bg-amber-300"],
              ["Other engagement", "bg-rose-300"],
            ].map(([label, color]) => (
              <span key={label} className="inline-flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                {label}
              </span>
            ))}
          </div>

          <div className="mt-6 overflow-x-auto pb-2">
            <div
              className="grid min-w-[620px] items-end gap-3 sm:min-w-[760px]"
              style={{
                gridTemplateColumns: `repeat(${chartBuckets.length}, minmax(2.25rem, 1fr))`,
              }}
            >
              {chartBuckets.map((bucket, index) => {
                const height = `${Math.max((bucket.score / chartMaxScore) * 100, bucket.score ? 16 : 5)}%`;
                const segments = [
                  {
                    label: "Presence",
                    value: bucket.presence * 2,
                    className: "bg-emerald-300",
                  },
                  {
                    label: "Asked questions",
                    value: bucket.questions * 5,
                    className: "bg-cyan-300",
                  },
                  {
                    label: "Quiz practice",
                    value: bucket.quizzes * 4,
                    className: "bg-amber-300",
                  },
                  {
                    label: "Other engagement",
                    value: (bucket.resources + bucket.other) * 2,
                    className: "bg-rose-300",
                  },
                ];

                return (
                  <div
                    key={bucket.key}
                    className="group flex h-72 flex-col items-center justify-end gap-3"
                  >
                    <div className="relative flex h-56 w-full items-end rounded-xl border border-white/10 bg-slate-950/48 px-2 py-2">
                      <div
                        className="bar-reveal flex w-full flex-col-reverse overflow-hidden rounded-lg shadow-lg shadow-black/20"
                        style={{
                          animationDelay: `${index * 45}ms`,
                          height,
                        }}
                        title={`${bucket.label}: ${bucket.score} engagement score`}
                      >
                        {segments.map((segment) => (
                          <span
                            key={segment.label}
                            className={segment.className}
                            style={{
                              height: getSegmentHeight(segment.value, bucket.score),
                            }}
                          />
                        ))}
                      </div>

                      <div className="pointer-events-none absolute -top-3 left-1/2 hidden w-44 -translate-x-1/2 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs leading-5 text-slate-200 shadow-xl shadow-black/30 group-hover:block">
                        <p className="font-semibold text-white">{bucket.label}</p>
                        <p>Presence: {bucket.presence}</p>
                        <p>Questions: {bucket.questions}</p>
                        <p>Quizzes: {bucket.quizzes}</p>
                        <p>Other: {bucket.resources + bucket.other}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-slate-200">
                        {bucket.shortLabel}
                      </p>
                      <p className="mt-1 text-[0.7rem] font-medium text-slate-500">
                        {bucket.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="growth-rise mt-6 rounded-2xl border border-white/10 bg-slate-900/72 p-4 shadow-2xl shadow-black/20 backdrop-blur-md sm:rounded-[1.75rem] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
                Streak table
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal text-white">
                Date-wise and month-wise consistency
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Current streak: {currentStreak} day
                {currentStreak === 1 ? "" : "s"} · Longest streak:{" "}
                {longestStreak} day{longestStreak === 1 ? "" : "s"}
              </p>
            </div>

            <div className="flex w-full rounded-xl border border-white/10 bg-slate-950/58 p-1 text-sm font-semibold text-slate-300 sm:w-auto">
              {([
                ["date", "Date wise"],
                ["month", "Month wise"],
              ] as [StreakMode, string][]).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setStreakMode(mode)}
                  className={`h-10 flex-1 rounded-lg px-4 transition sm:flex-none ${
                    streakMode === mode
                      ? "bg-white text-slate-950"
                      : "hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {streakMode === "date" ? (
            <div className="mt-6 overflow-x-auto pb-2">
              <div
                className="grid w-max grid-flow-col gap-1.5"
                style={{ gridTemplateRows: "repeat(7, 0.95rem)" }}
              >
                {streakDays.map((day, index) => (
                  <span
                    key={day.key}
                    className={`heat-reveal h-3.5 w-3.5 rounded-[0.25rem] border transition hover:scale-125 ${getIntensityClass(
                      day.score,
                      streakMaxScore,
                    )}`}
                    style={{ animationDelay: `${Math.min(index * 8, 480)}ms` }}
                    title={`${day.label}: ${day.score} engagement score`}
                    aria-label={`${day.label}: ${day.score} engagement score`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-12">
              {streakMonths.map((month, index) => (
                <div
                  key={month.key}
                  className={`heat-reveal rounded-xl border px-3 py-4 text-center transition hover:-translate-y-1 ${getIntensityClass(
                    month.score,
                    streakMaxScore,
                  )}`}
                  style={{ animationDelay: `${index * 45}ms` }}
                  title={`${month.label}: ${month.score} engagement score`}
                >
                  <p className="text-sm font-semibold text-white">
                    {month.shortLabel}
                  </p>
                  <p className="mt-2 text-xs font-medium text-white/80">
                    {month.presence} days
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="growth-rise mt-6 grid gap-5 pb-10 lg:grid-cols-[0.82fr_1.18fr]">
          <aside className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-2xl shadow-black/20 backdrop-blur-md sm:rounded-[1.75rem] sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
              This month
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-normal text-white">
              Engagement score {currentMonth.score}
            </h2>
            <div className="mt-5 grid gap-3 text-sm text-slate-300">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span>Presence days</span>
                <span className="font-semibold text-white">
                  {currentMonth.presence}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span>AI questions</span>
                <span className="font-semibold text-white">
                  {currentMonth.questions}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span>Quiz sessions</span>
                <span className="font-semibold text-white">
                  {currentMonth.quizzes}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Resources and syllabus</span>
                <span className="font-semibold text-white">
                  {currentMonth.resources + currentMonth.other}
                </span>
              </div>
            </div>
          </aside>

          <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 shadow-2xl shadow-black/20 backdrop-blur-md sm:rounded-[1.75rem] sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-300">
              Monthly suggestion
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-normal text-white">
              Preparation adjustments for {examDetails.name}
            </h2>

            <div className="mt-5 divide-y divide-white/10">
              {suggestions.map((suggestion, index) => (
                <article
                  key={suggestion.title}
                  className="growth-rise py-4 first:pt-0 last:pb-0"
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <span
                    className={`inline-flex max-w-full rounded-full border px-3 py-1 text-left text-xs font-semibold leading-5 ${suggestionAccentClass(
                      suggestion.accent,
                    )}`}
                  >
                    {suggestion.title}
                  </span>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {suggestion.body}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

export default function GrowthPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-950">
          <span
            className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500/30 border-t-teal-500"
            aria-label="Loading growth analytics"
          />
        </main>
      }
    >
      <GrowthContent />
    </Suspense>
  );
}
